import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, renderJobsTable, storyboardsTable, lessonsTable as lessonTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { createRenderJob, processRenderJob } from "../renderer/sceneRenderer";
import { enqueueRender, sseHandler } from "../queue/renderQueue";

const router: IRouter = Router();
router.use("/renderer", requireAuth);

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

  const [board] = await db.select().from(storyboardsTable).where(eq(storyboardsTable.id, storyboardId));
  if (!board) { res.status(404).json({ error: "Storyboard not found" }); return; }
  const [lesson] = await db.select({ id: lessonTable.id }).from(lessonTable)
    .where(and(eq(lessonTable.id, board.lessonId), eq(lessonTable.creatorId, creatorId)));
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }

  const { jobId } = await createRenderJob(storyboardId, "scene_preview", sceneIndex);
  const queueJobId = await enqueueRender("scene_preview", storyboardId, creatorId, sceneIndex);

  res.json({ jobId, queueJobId, previewUrl: `/api/renderer/output/${jobId}` });
});

/**
 * POST /renderer/export — full lesson export (via queue)
 */
router.post("/renderer/export", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { storyboardId } = req.body;
  if (!storyboardId) { res.status(400).json({ error: "storyboardId is required" }); return; }

  const [board] = await db.select().from(storyboardsTable).where(eq(storyboardsTable.id, storyboardId));
  if (!board) { res.status(404).json({ error: "Storyboard not found" }); return; }
  const [lesson] = await db.select({ id: lessonTable.id }).from(lessonTable)
    .where(and(eq(lessonTable.id, board.lessonId), eq(lessonTable.creatorId, creatorId)));
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }

  const { jobId } = await createRenderJob(storyboardId, "full_export");
  const queueJobId = await enqueueRender("full_export", storyboardId, creatorId);

  res.status(201).json({ jobId, queueJobId, status: "queued" });
});

/**
 * GET /renderer/progress — SSE stream for a render job
 * Query: ?jobId=<bullmq-job-id>
 */
router.get("/renderer/progress", sseHandler);

/**
 * GET /renderer/jobs/:jobId
 */
router.get("/renderer/jobs/:jobId", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const jobId = parseInt(req.params.jobId as string, 10);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const [job] = await db.select().from(renderJobsTable).where(eq(renderJobsTable.id, jobId));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const [board] = await db.select({ lessonId: storyboardsTable.lessonId }).from(storyboardsTable)
    .where(eq(storyboardsTable.id, job.storyboardId));
  if (!board) { res.status(404).json({ error: "Job not found" }); return; }
  const [lesson] = await db.select({ id: lessonTable.id }).from(lessonTable)
    .where(and(eq(lessonTable.id, board.lessonId), eq(lessonTable.creatorId, creatorId)));
  if (!lesson) { res.status(404).json({ error: "Job not found" }); return; }

  res.json(job);
});

/**
 * GET /renderer/output/:jobId
 */
router.get("/renderer/output/:jobId", async (req: AuthenticatedRequest, res): Promise<void> => {
  const jobId = parseInt(req.params.jobId as string, 10);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const [job] = await db.select().from(renderJobsTable).where(eq(renderJobsTable.id, jobId));
  if (!job) { res.status(404).json({ error: "Output not found" }); return; }

  if (job.status !== "completed") {
    res.status(202).json({ status: job.status, progress: job.progress });
    return;
  }

  res.json({ status: "completed", jobType: job.jobType, outputUrl: job.outputUrl, meta: job.metadata });
});

export default router;
