import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, renderJobsTable, storyboardsTable, lessonsTable as lessonTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { createRenderJob } from "../renderer/sceneRenderer";
import { enqueueRender, sseHandler } from "../queue/renderQueue";
import { startMcpServer } from "../excalidraw/mcpServer";

const router: IRouter = Router();
router.use("/renderer", requireAuth);

/**
 * Shared ownership check: given a storyboardId and creatorId,
 * returns the storyboard if the creator owns the parent lesson.
 * Exits the request with 404 if not found.
 */
async function authorizeStoryboard(
  storyboardId: number,
  creatorId: number,
  res: any,
): Promise<{ lessonId: number } | null> {
  const [board] = await db
    .select({ lessonId: storyboardsTable.lessonId })
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));
  if (!board) {
    res.status(404).json({ error: "Storyboard not found" });
    return null;
  }
  const [lesson] = await db
    .select({ id: lessonTable.id })
    .from(lessonTable)
    .where(and(eq(lessonTable.id, board.lessonId), eq(lessonTable.creatorId, creatorId)));
  if (!lesson) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  return { lessonId: board.lessonId };
}

/**
 * POST /renderer/preview — generate a single-scene preview (via queue)
 */
router.post("/renderer/preview", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { storyboardId, sceneIndex } = req.body;
  if (!storyboardId || typeof sceneIndex !== "number") {
    res.status(400).json({ error: "storyboardId and sceneIndex are required" });
    return;
  }

  const authorized = await authorizeStoryboard(storyboardId, creatorId, res);
  if (!authorized) return;

  const { jobId } = await createRenderJob(storyboardId, "scene_preview", sceneIndex);
  const queueJobId = await enqueueRender("scene_preview", storyboardId, creatorId, jobId, sceneIndex);

  res.json({ jobId, queueJobId, previewUrl: `/api/renderer/output/${jobId}` });
});

/**
 * POST /renderer/export — full lesson export (via queue)
 */
router.post("/renderer/export", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { storyboardId } = req.body;
  if (!storyboardId) {
    res.status(400).json({ error: "storyboardId is required" });
    return;
  }

  const authorized = await authorizeStoryboard(storyboardId, creatorId, res);
  if (!authorized) return;

  const { jobId } = await createRenderJob(storyboardId, "full_export");
  const queueJobId = await enqueueRender("full_export", storyboardId, creatorId, jobId);

  res.status(201).json({ jobId, queueJobId, status: "queued" });
});

/**
 * GET /renderer/progress — SSE stream for a render job
 * Query: ?dbJobId=<render_jobs.id> (preferred) or ?jobId=<bullmq-job-id>
 */
router.get("/renderer/progress", sseHandler);

/**
 * GET /renderer/jobs/:jobId — get job status (creator-scoped)
 */
router.get("/renderer/jobs/:jobId", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const jobId = parseInt(req.params.jobId as string, 10);
  if (isNaN(jobId)) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const [job] = await db.select().from(renderJobsTable).where(eq(renderJobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const authorized = await authorizeStoryboard(job.storyboardId, creatorId, res);
  if (!authorized) return;

  res.json(job);
});

/**
 * GET /renderer/output/:jobId — get render output (creator-scoped)
 */
router.get("/renderer/output/:jobId", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const jobId = parseInt(req.params.jobId as string, 10);
  if (isNaN(jobId)) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const [job] = await db.select().from(renderJobsTable).where(eq(renderJobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "Output not found" });
    return;
  }

  // Creator authorization — must own the parent lesson
  const authorized = await authorizeStoryboard(job.storyboardId, creatorId, res);
  if (!authorized) return;

  if (job.status !== "completed") {
    res.status(202).json({ status: job.status, progress: job.progress });
    return;
  }

  res.json({ status: "completed", jobType: job.jobType, outputUrl: job.outputUrl, meta: job.metadata });
});

/**
 * POST /renderer/start — called once at server startup to wire MCP and worker
 */
router.post("/renderer/start", (_req, res) => {
  try {
    startMcpServer();
    res.json({ status: "ok", mcp: "started" });
  } catch (err) {
    logger.error({ err }, "Failed to start MCP server");
    res.status(500).json({ error: "Failed to start MCP server" });
  }
});

export default router;
