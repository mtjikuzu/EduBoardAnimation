/**
 * Scene renderer — produces a narrated whiteboard scene.
 *
 * Orchestrates the full rendering pipeline:
 * 1. Reads scene JSON from the storyboard
 * 2. Compiles an SVG/HTML timeline via svgTimeline
 * 3. Generates narration audio via ElevenLabs/fallback TTS
 * 4. Generates captions from narration text
 * 5. Captures frames via headless Chromium
 * 6. Encodes scene video with FFmpeg
 * 7. Checks content-hash cache for scene-only invalidation
 * 8. Records render job status throughout
 */
import { db, renderJobsTable, storyboardsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync, mkdirSync } from "node:fs";
import { logger } from "../lib/logger";
import { addLedgerEntry } from "../lib/credits";
import { compileScene } from "./svgTimeline";
import { captureFrames } from "./frameCapture";
import { encodeScene, assembleLesson, checkAVSync, FIXED_MEDIA_CONTRACT } from "./ffmpegEncoder";
import { generateNarration } from "./elevenLabsTTS";
import { generateCaptionSegments, segmentsToSrt, segmentsToVtt } from "./captionGenerator";
import {
  computeContentHash,
  findCachedRender,
  getCurrentStyleVersion,
  getRendererVersion,
  getMediaContractKey,
} from "./contentHashCache";

export type RenderProgressCallback = (jobId: number, status: string, progress: number) => Promise<void>;

/** Extract the scenes array from storyboard data (handles nested planner output). */
function extractScenes(storyboard: { scenes: unknown }): unknown[] {
  const raw = typeof storyboard.scenes === "string"
    ? JSON.parse(storyboard.scenes)
    : (storyboard.scenes ?? []);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).scenes)) {
    return (raw as Record<string, unknown>).scenes as unknown[];
  }
  return [];
}

export async function createRenderJob(
  storyboardId: number,
  jobType: "scene_preview" | "full_export" | "scene_regen",
  sceneIndex?: number,
): Promise<{ jobId: number; estimatedCost: number }> {
  const [storyboard] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));

  if (!storyboard) throw new Error("Storyboard not found");

  const scenes = extractScenes(storyboard);
  const targetScenes = sceneIndex !== undefined ? [scenes[sceneIndex]] : scenes;
  const totalElements = (targetScenes as Array<{ elements?: unknown[] }>).reduce(
    (sum: number, s) => sum + ((s.elements as unknown[])?.length ?? 0),
    0,
  );

  const cost = targetScenes.length * 10 + totalElements * 2 + 15;

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
        styleVersion: getCurrentStyleVersion(),
        rendererVersion: getRendererVersion(),
      },
    })
    .returning();

  return { jobId: job.id, estimatedCost: cost };
}

export async function processRenderJob(jobId: number): Promise<void> {
  const [job] = await db
    .select()
    .from(renderJobsTable)
    .where(eq(renderJobsTable.id, jobId));

  if (!job) throw new Error(`Render job ${jobId} not found`);

  logger.info({ jobId, jobType: job.jobType }, "Processing render job");

  try {
    const [storyboard] = await db
      .select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, job.storyboardId));
    if (!storyboard) throw new Error("Storyboard not found");

    const scenes = extractScenes(storyboard);

    const targetScenes = job.sceneIndex !== null
      ? [scenes[job.sceneIndex]]
      : scenes;

    const globalStyle = ((storyboard as any).globalStyle ?? {});

    const workDir = join(tmpdir(), `eduwb-render-${randomUUID()}`);
    mkdirSync(workDir, { recursive: true });
    const sceneClips: string[] = [];

    await updateJobProgress(jobId, "rendering", 5);

    for (let i = 0; i < targetScenes.length; i++) {
      const scene = targetScenes[i] as Record<string, unknown>;
      const sceneProgress = 5 + ((i + 1) / targetScenes.length) * 85;

      const narrationText = String(scene.narration ?? "");

      // Check content hash cache
      const contentHash = computeContentHash({
        storyboardId: job.storyboardId,
        sceneIndex: job.sceneIndex,
        scenes,
        styleVersion: getCurrentStyleVersion(),
        rendererVersion: getRendererVersion(),
        narrationHashes: [hashString(narrationText)],
        mediaContract: getMediaContractKey(),
      });

      const cached = await findCachedRender(job.storyboardId, job.sceneIndex, contentHash);
      if (cached) {
        logger.info({ jobId, sceneIndex: i, contentHash }, "Cache hit");
        sceneClips.push(cached.outputPath);
        continue;
      }

      // Generate narration audio
      logger.info({ jobId, sceneIndex: i, sceneCount: targetScenes.length }, "Starting scene render");
      const narration = await generateNarration(narrationText);
      await updateJobProgress(jobId, "rendering", sceneProgress * 0.3);

      // Generate captions
      const captionSegments = generateCaptionSegments(narrationText);
      const srtContent = segmentsToSrt(captionSegments);
      const srtPath = join(workDir, `scene-${i}-captions.srt`);
      writeFileSync(srtPath, srtContent);

      // Compile SVG timeline
      const rawElements = (scene.elements ?? []) as Array<Record<string, unknown>>;
      const timelineElements = rawElements.map((el) => ({
        type: String(el.type ?? "text"),
        content: String(el.content ?? ""),
        x: Number(el.x ?? 0),
        y: Number(el.y ?? 0),
        width: el.width ? Number(el.width) : undefined,
        height: el.height ? Number(el.height) : undefined,
        drawOrder: Number(el.drawOrder ?? 0),
        timingHint: el.timingHint ? String(el.timingHint) : undefined,
      }));

      const htmlContent = compileScene(
        timelineElements,
        narrationText,
        Number(scene.durationSec ?? 60),
        globalStyle as { strokeWidth?: number; roughness?: number; palette?: string[] },
      );
      await updateJobProgress(jobId, "rendering", sceneProgress * 0.5);

      // Capture frames via Chromium
      const captureResult = await captureFrames(htmlContent, {
        durationSec: Number(scene.durationSec ?? 60),
        fps: FIXED_MEDIA_CONTRACT.fps,
        width: FIXED_MEDIA_CONTRACT.width,
        height: FIXED_MEDIA_CONTRACT.height,
        outputDir: join(workDir, `scene-${i}-frames`),
      });
      await updateJobProgress(jobId, "rendering", sceneProgress * 0.7);

      // Encode scene video
      const sceneOutput = join(workDir, `scene-${i}.mp4`);
      const encodeResult = encodeScene(
        captureResult.outputDir,
        "frame-*.png",
        narration.audioPath,
        sceneOutput,
      );
      sceneClips.push(sceneOutput);

      const syncCheck = checkAVSync(Number(scene.durationSec ?? 60), encodeResult.durationSec);
      if (!syncCheck.inSync) {
        logger.warn({ jobId, sceneIndex: i, driftMs: syncCheck.driftMs }, "A/V sync drift");
      }

      await updateJobProgress(jobId, "rendering", sceneProgress);
    }

    // Assemble final MP4
    let outputPath: string;
    if (targetScenes.length > 1) {
      outputPath = join(workDir, "lesson-final.mp4");
      assembleLesson(sceneClips, outputPath);
    } else {
      outputPath = sceneClips[0];
    }
    await updateJobProgress(jobId, "rendering", 95);

    await db
      .update(renderJobsTable)
      .set({
        status: "completed" as const,
        progress: "100",
        actualCost: job.estimatedCost,
        outputUrl: outputPath,
        metadata: {
          ...((job.metadata as Record<string, unknown>) ?? {}),
          contentHash: computeContentHash({
            storyboardId: job.storyboardId,
            sceneIndex: job.sceneIndex,
            scenes,
            styleVersion: getCurrentStyleVersion(),
            rendererVersion: getRendererVersion(),
            narrationHashes: targetScenes.map(
              (s: Record<string, unknown>) => hashString(String(s.narration ?? "")),
            ),
            mediaContract: getMediaContractKey(),
          }),
          sceneCount: targetScenes.length,
        },
        updatedAt: new Date(),
      })
      .where(eq(renderJobsTable.id, jobId));

    logger.info({ jobId, outputPath }, "Render job completed");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, jobId }, "Render job failed");

    await db
      .update(renderJobsTable)
      .set({
        status: "failed" as const,
        errorMessage: message,
        progress: "0",
        updatedAt: new Date(),
      })
      .where(eq(renderJobsTable.id, jobId));
  }
}

async function updateJobProgress(
  jobId: number,
  status: string,
  progress: number,
): Promise<void> {
  const s = status === "rendering" ? "rendering" as const : status === "queued" ? "queued" as const : "rendering" as const;
  await db
    .update(renderJobsTable)
    .set({ status: s, progress: String(Math.round(progress)), updatedAt: new Date() })
    .where(eq(renderJobsTable.id, jobId));
}

function hashString(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}
