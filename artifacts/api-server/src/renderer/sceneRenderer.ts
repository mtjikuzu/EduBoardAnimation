import { db, renderJobsTable, storyboardsTable, creditLedgerTable, lessonsTable as lessonTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { addLedgerEntry, getBalance, estimateRenderCost } from "../lib/credits";

/**
 * Scene renderer — produces a narrated whiteboard scene.
 *
 * In the beta this runs in a separate worker (Fargate task) that:
 * 1. Reads the scene JSON from the storyboard
 * 2. Compiles an SVG/HTML timeline with Rough.js paths and MathJax equations
 * 3. Captures 30fps frames via headless Chromium
 * 4. Encodes with FFmpeg to the fixed 1080p H.264/AAC contract
 * 5. Uploads the clip to S3
 * 6. Reports job completion
 *
 * For the prototype we simulate the pipeline and record the result.
 */

export type RenderProgressCallback = (jobId: number, status: string, progress: number) => Promise<void>;

/**
 * Create a render job and queue it for processing.
 */
export async function createRenderJob(
  storyboardId: number,
  jobType: "scene_preview" | "full_export" | "scene_regen",
  sceneIndex?: number,
): Promise<{ jobId: number; estimatedCost: number }> {
  const [storyboard] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));

  if (!storyboard) {
    throw new Error("Storyboard not found");
  }

  const scenes = typeof storyboard.scenes === "string"
    ? JSON.parse(storyboard.scenes)
    : (storyboard.scenes ?? []);

  const targetScenes = sceneIndex !== undefined ? [scenes[sceneIndex]] : scenes;
  const totalElements = targetScenes.reduce(
    (sum: number, s: { elements?: unknown[] }) => sum + (s.elements?.length ?? 0),
    0,
  );

  const cost = estimateRenderCost(targetScenes.length, totalElements);

  const [job] = await db
    .insert(renderJobsTable)
    .values({
      storyboardId,
      jobType,
      sceneIndex: sceneIndex ?? null,
      status: "queued",
      progress: "0",
      estimatedCost: String(cost),
      metadata: {
        sceneCount: targetScenes.length,
        elementCount: totalElements,
      },
    })
    .returning();

  return { jobId: job.id, estimatedCost: cost };
}

/**
 * Start processing a render job.
 * In production this dispatches to a BullMQ/SQS worker.
 * For the prototype, we simulate completion.
 */
export async function processRenderJob(jobId: number): Promise<void> {
  const [job] = await db
    .select()
    .from(renderJobsTable)
    .where(eq(renderJobsTable.id, jobId));

  if (!job) {
    throw new Error(`Render job ${jobId} not found`);
  }

  logger.info({ jobId, jobType: job.jobType }, "Processing render job");

  // Simulate render progress
  await db
    .update(renderJobsTable)
    .set({ status: "rendering", progress: "10", updatedAt: new Date() })
    .where(eq(renderJobsTable.id, jobId));

  // In production: actual SVG rendering → Chromium capture → FFmpeg encoding → S3 upload
  // For the prototype: simulate success after a short delay
  await new Promise((r) => setTimeout(r, 2000));

  await db
    .update(renderJobsTable)
    .set({
      status: "completed",
      progress: "100",
      actualCost: job.estimatedCost,
      outputUrl: `/api/renderer/output/${jobId}`,
      updatedAt: new Date(),
    })
    .where(eq(renderJobsTable.id, jobId));

  logger.info({ jobId }, "Render job completed");
}

/**
 * Consume the credit hold and finalise the render.
 */
export async function finaliseRenderCosts(
  creatorId: number,
  storyboardId: number,
  jobId: number,
): Promise<void> {
  const [job] = await db
    .select()
    .from(renderJobsTable)
    .where(eq(renderJobsTable.id, jobId));

  if (!job) return;

  const cost = Number(job.actualCost || job.estimatedCost || 0);
  if (cost > 0) {
    await addLedgerEntry(
      creatorId,
      "consume",
      cost,
      `Render job #${jobId} (${job.jobType})`,
      { type: "render_job", id: jobId },
      { storyboardId },
    );
  }
}
