/**
 * Content-hash cache for scene rendering.
 *
 * Each scene's canonical JSON, style version, narration hash,
 * renderer version, and media contract produce a stable content hash.
 * If a render already exists for that hash, it's a cache hit.
 * Scene-only invalidation means changing one scene only affects
 * that scene's cache key.
 */
import { createHash } from "node:crypto";
import { db, renderJobsTable, storyboardsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

export interface CacheKeyInput {
  storyboardId: number;
  sceneIndex: number | null; // null = full lesson
  scenes: unknown[];
  styleVersion: number;
  rendererVersion: string;
  narrationHashes: string[];
  mediaContract: string; // e.g. "1920x1080_30fps_h264_aac"
}

/**
 * Generate a stable content hash from scene data.
 */
export function computeContentHash(input: CacheKeyInput): string {
  const hash = createHash("sha256");

  // Include scene JSON (sorted keys for stability)
  const sceneData = input.sceneIndex !== null
    ? [input.scenes[input.sceneIndex]]
    : input.scenes;
  hash.update(JSON.stringify(sceneData, Object.keys(sceneData).sort()));

  // Include versioning metadata
  hash.update(`:style-v${input.styleVersion}`);
  hash.update(`:renderer-${input.rendererVersion}`);
  hash.update(`:media-${input.mediaContract}`);

  // Include narration hashes
  for (const nh of input.narrationHashes) {
    hash.update(`:narration-${nh}`);
  }

  // Include storyboard id for uniqueness
  hash.update(`:sb-${input.storyboardId}`);
  if (input.sceneIndex !== null) {
    hash.update(`:scene-${input.sceneIndex}`);
  }

  return hash.digest("hex");
}

export interface CacheEntry {
  contentHash: string;
  sceneIndex: number | null;
  outputPath: string;
  jobId: number;
}

/**
 * Cached render artifacts are stored in the render_jobs table.
 * A non-null `completed` status with an output_url means the
 * artifact is cached and reusable.
 */
export async function findCachedRender(
  storyboardId: number,
  sceneIndex: number | null,
  contentHash: string,
): Promise<CacheEntry | null> {
  // Find a completed render job matching the content hash
  const jobs = await db
    .select()
    .from(renderJobsTable)
    .where(
      and(
        eq(renderJobsTable.storyboardId, storyboardId),
        eq(renderJobsTable.status, "completed"),
        sceneIndex !== null
          ? eq(renderJobsTable.sceneIndex, sceneIndex)
          : sql`${renderJobsTable.sceneIndex} IS NULL`,
      ),
    )
    .orderBy(sql`${renderJobsTable.id} DESC`)
    .limit(1);

  if (jobs.length === 0) return null;

  const job = jobs[0];
  const metadata = job.metadata as Record<string, unknown> ?? {};

  if (metadata.contentHash === contentHash && job.outputUrl) {
    return {
      contentHash,
      sceneIndex,
      outputPath: job.outputUrl,
      jobId: job.id,
    };
  }

  return null;
}

/**
 * Get the style version for a storyboard.
 * Increment this when the rendering pipeline changes.
 */
export function getCurrentStyleVersion(): number {
  return parseInt(process.env["EDUWB_STYLE_VERSION"] ?? "1", 10);
}

/**
 * Get the current renderer version string.
 */
export function getRendererVersion(): string {
  return process.env["EDUWB_RENDERER_VERSION"] ?? "1.0.0";
}

/**
 * Get the media contract string for cache keying.
 */
export function getMediaContractKey(): string {
  return "1920x1080_30fps_h264_aac";
}
