import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, renderJobsTable, storyboardsTable, lessonsTable as lessonTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { createRenderJob, processRenderJob } from "../renderer/sceneRenderer";

const router: IRouter = Router();
router.use("/renderer", requireAuth);

/**
 * POST /renderer/preview
 * Generate a preview of a single scene.
 * Body: { storyboardId: number, sceneIndex: number }
 */
router.post("/renderer/preview", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { storyboardId, sceneIndex } = req.body;

  if (!storyboardId || typeof sceneIndex !== "number") {
    res.status(400).json({ error: "storyboardId and sceneIndex are required" });
    return;
  }

  // Find the storyboard and verify ownership
  const [board] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));

  if (!board) { res.status(404).json({ error: "Storyboard not found" }); return; }

  const [lesson] = await db
    .select({ id: lessonTable.id })
    .from(lessonTable)
    .where(and(eq(lessonTable.id, board.lessonId), eq(lessonTable.creatorId, creatorId)));
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }

  const { jobId } = await createRenderJob(storyboardId, "scene_preview", sceneIndex);
  // In production: dispatch to worker. Here we process inline.
  await processRenderJob(jobId);

  res.json({ jobId, previewUrl: `/api/renderer/output/${jobId}` });
});

/**
 * POST /renderer/export
 * Generate the full lesson export.
 * Body: { storyboardId: number }
 */
router.post("/renderer/export", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { storyboardId } = req.body;

  if (!storyboardId) {
    res.status(400).json({ error: "storyboardId is required" });
    return;
  }

  const [board] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));
  if (!board) { res.status(404).json({ error: "Storyboard not found" }); return; }

  const [lesson] = await db
    .select({ id: lessonTable.id })
    .from(lessonTable)
    .where(and(eq(lessonTable.id, board.lessonId), eq(lessonTable.creatorId, creatorId)));
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }

  const { jobId } = await createRenderJob(storyboardId, "full_export");
  await processRenderJob(jobId);

  const [job] = await db
    .select()
    .from(renderJobsTable)
    .where(eq(renderJobsTable.id, jobId));

  res.status(201).json({
    jobId,
    status: job?.status ?? "completed",
    outputUrl: job?.outputUrl ?? `/api/renderer/output/${jobId}`,
  });
});

/**
 * GET /renderer/jobs/:jobId
 * Get the status of a render job.
 */
router.get("/renderer/jobs/:jobId", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const jobId = parseInt(req.params.jobId as string, 10);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const [job] = await db
    .select()
    .from(renderJobsTable)
    .where(eq(renderJobsTable.id, jobId));

  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  // Verify ownership via storyboard → lesson chain
  const [board] = await db
    .select({ lessonId: storyboardsTable.lessonId })
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, job.storyboardId));
  if (!board) { res.status(404).json({ error: "Job not found" }); return; }

  const [lesson] = await db
    .select({ id: lessonTable.id })
    .from(lessonTable)
    .where(and(eq(lessonTable.id, board.lessonId), eq(lessonTable.creatorId, creatorId)));
  if (!lesson) { res.status(404).json({ error: "Job not found" }); return; }

  res.json(job);
});

/**
 * GET /renderer/output/:jobId
 * Returns the render output metadata (in production serves the actual MP4).
 */
router.get("/renderer/output/:jobId", async (req: AuthenticatedRequest, res): Promise<void> => {
  const jobId = parseInt(req.params.jobId as string, 10);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const [job] = await db
    .select()
    .from(renderJobsTable)
    .where(eq(renderJobsTable.id, jobId));

  if (!job) { res.status(404).json({ error: "Output not found" }); return; }

  if (job.status !== "completed") {
    res.status(202).json({ status: job.status, progress: job.progress });
    return;
  }

  res.json({
    status: "completed",
    jobType: job.jobType,
    outputUrl: job.outputUrl,
    meta: job.metadata,
  });
});

export default router;
