/**
 * BullMQ render job queue — replaces inline processRenderJob.
 *
 * Architecture:
 *   Web app → Queue → Worker (separate process) → SSE events → UI
 *
 * The queue provides:
 * - Durable job storage (Redis)
 * - Retry with backoff
 * - Job progress tracking (pushes to SSE)
 * - Graceful worker lifecycle
 */
import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { EventEmitter } from "node:events";
import { logger } from "../lib/logger";
import { processRenderJob } from "../renderer/sceneRenderer";

// SSE event bus — workers emit progress, the HTTP endpoint subscribes
export const renderEvents = new EventEmitter();
renderEvents.setMaxListeners(200);

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

let connection: Redis | null = null;

function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return connection;
}

let renderQueue: Queue | null = null;

export function getRenderQueue(): Queue {
  if (!renderQueue) {
    renderQueue = new Queue("eduwb-render", {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return renderQueue;
}

/**
 * Enqueue a render job and return the job id.
 * The worker will process it asynchronously and emit SSE events.
 */
export async function enqueueRender(
  jobType: "scene_preview" | "full_export" | "scene_regen",
  storyboardId: number,
  creatorId: number,
  sceneIndex?: number,
): Promise<string> {
  const queue = getRenderQueue();
  const job = await queue.add(
    jobType,
    { storyboardId, creatorId, sceneIndex, jobType },
    {
      jobId: `${jobType}-${storyboardId}-${sceneIndex ?? "all"}-${Date.now()}`,
    },
  );
  return job.id ?? "";
}

/**
 * Start the render worker. Call once at server startup.
 * The worker picks up jobs from the queue, processes them, and emits
 * progress/complete/fail events to the SSE bus.
 */
export function startRenderWorker(): void {
  const worker = new Worker(
    "eduwb-render",
    async (job: Job) => {
      const { storyboardId, creatorId, sceneIndex, jobType } = job.data;

      logger.info({ jobId: job.id, jobType, storyboardId }, "Worker processing render job");

      // Emit initial progress
      renderEvents.emit(`progress:${job.id}`, { status: "rendering", progress: 0 });

      try {
        // Map our progress events
        const origUpdate = async (status: string, progress: number) => {
          await job.updateProgress(progress);
          renderEvents.emit(`progress:${job.id}`, { status, progress });
        };

        // Process the render (uses the existing pipeline)
        await processRenderJob(job.id as unknown as number);

        renderEvents.emit(`progress:${job.id}`, { status: "completed", progress: 100 });
        logger.info({ jobId: job.id }, "Worker completed render job");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        renderEvents.emit(`progress:${job.id}`, { status: "failed", progress: 0, error: message });
        throw err; // Let BullMQ handle retry
      }
    },
    {
      connection: getConnection(),
      concurrency: 2,
      lockDuration: 120000,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, "Render job failed");
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Render job completed");
  });

  logger.info("Render worker started");
}

/**
 * SSE endpoint handler — streams render job progress to the frontend.
 */
export function sseHandler(req: any, res: any): void {
  const jobId = req.query.jobId;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ status: "connected", jobId })}\n\n`);

  const onProgress = (data: Record<string, unknown>) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const eventKey = `progress:${jobId}`;
  renderEvents.on(eventKey, onProgress);

  // Keep alive
  const keepAlive = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(keepAlive);
      return;
    }
    res.write(": heartbeat\n\n");
  }, 15000);

  // Cleanup on disconnect
  req.on("close", () => {
    renderEvents.off(eventKey, onProgress);
    clearInterval(keepAlive);
  });
}
