/**
 * FFmpeg video encoder and scene assembly.
 *
 * Takes a sequence of PNG frames (or scene clips) and encodes them
 * to the fixed 1080p H.264/AAC media contract, then assembles
 * the full lesson MP4.
 */
import { execSync, execFileSync } from "node:child_process";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger";

export interface MediaContract {
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  pixelFormat: string;
  crf: number;
}

export const FIXED_MEDIA_CONTRACT: MediaContract = {
  width: 1920,
  height: 1080,
  fps: 30,
  videoCodec: "libx264",
  audioCodec: "aac",
  pixelFormat: "yuv420p",
  crf: 23,
};

export interface EncodeResult {
  outputPath: string;
  durationSec: number;
  fileSizeBytes: number;
}

/**
 * Encode a sequence of PNG frames into an MP4 scene clip.
 */
export function encodeScene(
  frameDir: string,
  framePattern: string,
  audioPath: string | null,
  outputPath: string,
  contract: MediaContract = FIXED_MEDIA_CONTRACT,
): EncodeResult {
  const frameGlob = join(frameDir, framePattern);

  // Validate contract
  if (contract.width !== 1920 || contract.height !== 1080) {
    logger.warn({ contract }, "Non-standard media contract — expected 1920x1080");
  }

  const args = [
    "-y",
    "-framerate", String(contract.fps),
    "-pattern_type", "glob",
    "-i", frameGlob,
  ];

  // Add audio track if provided
  if (audioPath && existsSync(audioPath)) {
    args.push("-i", audioPath);
    args.push("-c:a", contract.audioCodec);
    args.push("-shortest");
  } else {
    args.push("-an");
  }

  args.push(
    "-c:v", contract.videoCodec,
    "-pix_fmt", contract.pixelFormat,
    "-crf", String(contract.crf),
    "-preset", "medium",
    "-r", String(contract.fps),
    "-vf", `scale=${contract.width}:${contract.height}:force_original_aspect_ratio=decrease,pad=${contract.width}:${contract.height}:(ow-iw)/2:(oh-ih)/2`,
    outputPath,
  );

  logger.info({ args: args.join(" ") }, "FFmpeg encode scene");

  try {
    const start = Date.now();
    execFileSync("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"], timeout: 120000 });
    const durationMs = Date.now() - start;

    const stats = existsSync(outputPath)
      ? { size: require("fs").statSync(outputPath).size }
      : { size: 0 };

    // Get duration via ffprobe
    let durationSec = 0;
    try {
      const probeOutput = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`,
        { encoding: "utf-8", timeout: 10000 },
      );
      durationSec = parseFloat(probeOutput.trim()) || 0;
    } catch {
      durationSec = 0;
    }

    logger.info(
      { outputPath, durationMs, sizeBytes: stats.size, durationSec },
      "Scene encoded",
    );

    return { outputPath, durationSec, fileSizeBytes: stats.size };
  } catch (err) {
    logger.error({ err, outputPath }, "FFmpeg encode failed");
    throw err;
  }
}

/**
 * Assemble multiple scene MP4 clips into a single lesson video.
 * Uses FFmpeg concat demuxer for frame-accurate assembly.
 */
export function assembleLesson(
  scenePaths: string[],
  outputPath: string,
): EncodeResult {
  if (scenePaths.length === 0) {
    throw new Error("No scenes to assemble");
  }

  // Create concat file
  const concatPath = join(tmpdir(), `eduwb-concat-${randomUUID()}.txt`);
  const concatContent = scenePaths
    .filter((p) => existsSync(p))
    .map((p) => `file '${p}'`)
    .join("\n");
  writeFileSync(concatPath, concatContent);

  try {
    const args = [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", concatPath,
      "-c", "copy",
      outputPath,
    ];

    logger.info({ sceneCount: scenePaths.length }, "Assembling lesson");

    execFileSync("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"], timeout: 300000 });

    const stats = existsSync(outputPath)
      ? { size: require("fs").statSync(outputPath).size }
      : { size: 0 };

    let durationSec = 0;
    try {
      const probeOutput = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`,
        { encoding: "utf-8", timeout: 10000 },
      );
      durationSec = parseFloat(probeOutput.trim()) || 0;
    } catch {
      durationSec = 0;
    }

    return { outputPath, durationSec, fileSizeBytes: stats.size };
  } finally {
    // Clean up concat file
    try {
      unlinkSync(concatPath);
    } catch {}
  }
}

/**
 * Check A/V sync by comparing expected vs actual duration.
 * Returns true if the drift is within tolerance (100ms).
 */
export function checkAVSync(
  expectedDurationSec: number,
  actualDurationSec: number,
  toleranceMs: number = 100,
): { inSync: boolean; driftMs: number } {
  const driftMs = Math.abs(expectedDurationSec - actualDurationSec) * 1000;
  return {
    inSync: driftMs <= toleranceMs,
    driftMs: Math.round(driftMs),
  };
}
