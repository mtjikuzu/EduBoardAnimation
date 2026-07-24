import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, renderJobsTable, storyboardsTable, lessonsTable as lessonTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();
router.use("/publish", requireAuth);

/**
 * POST /publish/youtube/connect
 * Initiates YouTube OAuth connection.
 * In the beta, returns the Google OAuth URL for the creator to visit.
 */
router.post("/publish/youtube/connect", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;

  // Production: construct Google OAuth URL with youtube.upload scope
  // For now, return a placeholder
  const oauthUrl = `/api/publish/youtube/callback?state=dev_${creatorId}`;

  res.json({
    url: oauthUrl,
    note: "Production: redirect to Google OAuth consent screen with youtube.upload scope.",
  });
});

/**
 * GET /publish/youtube/callback
 * Handles the YouTube OAuth callback (dev mode).
 */
router.get("/publish/youtube/callback", async (req, res): Promise<void> => {
  const { state, code } = req.query;
  logger.info({ state, code: code ? "present" : "missing" }, "YouTube OAuth callback");

  res.json({
    connected: true,
    channelTitle: "Dev Channel (mock)",
    note: "Production: exchange code for tokens, store encrypted refresh token, return channel info.",
  });
});

/**
 * POST /publish/youtube/upload
 * Upload an approved export to YouTube.
 * Body: { jobId: number, title: string, description: string, privacyStatus: string }
 */
router.post("/publish/youtube/upload", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { jobId, title, description, privacyStatus } = req.body;

  if (!jobId) {
    res.status(400).json({ error: "jobId is required" });
    return;
  }

  // Verify render job ownership
  const [job] = await db
    .select()
    .from(renderJobsTable)
    .where(eq(renderJobsTable.id, jobId));

  if (!job) { res.status(404).json({ error: "Render job not found" }); return; }

  const [board] = await db
    .select({ lessonId: storyboardsTable.lessonId })
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, job.storyboardId));
  if (!board) { res.status(404).json({ error: "Not found" }); return; }

  const [lesson] = await db
    .select({ id: lessonTable.id })
    .from(lessonTable)
    .where(and(eq(lessonTable.id, board.lessonId), eq(lessonTable.creatorId, creatorId)));
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }

  const visibility = ["private", "unlisted", "public"].includes(privacyStatus)
    ? privacyStatus
    : "private";

  // Production: upload to YouTube via resumable upload with quota management
  // For now, return a placeholder
  res.status(201).json({
    success: true,
    videoId: `dev_video_${Date.now()}`,
    watchUrl: `https://www.youtube.com/watch?v=dev_video_${Date.now()}`,
    privacyStatus: visibility,
    note: "Production: perform resumable upload, poll processing status, store video metadata.",
  });
});

export default router;
