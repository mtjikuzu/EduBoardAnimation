/**
 * Kokoro TTS integration.
 *
 * Generates narration audio from scene text using the Kokoro TTS model
 * (MIT-licensed, 82M parameters, runs 100% locally).
 * https://github.com/hexgrad/kokoro
 *
 * Sentence-level timing is estimated from word count at ~150 wpm
 * since Kokoro's raw output doesn't include alignment data.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger";

export interface TTSOptions {
  voice?: string;
  dtype?: "fp32" | "fp16" | "q8" | "q4" | "q4f16";
}

export interface TTSResult {
  audioPath: string;
  durationMs: number;
  sentenceTimings: Array<{ sentence: string; startMs: number; endMs: number }>;
}

// Lazy singleton — model loads once, reused across calls
let ttsInstance: any = null;

async function getTTS(options: TTSOptions = {}) {
  if (ttsInstance) return ttsInstance;
  try {
    const { KokoroTTS } = await import("kokoro-js");
    const modelId = process.env["KOKORO_MODEL_ID"] ?? "onnx-community/Kokoro-82M-v1.0-ONNX";
    const dtype = options.dtype ?? (process.env["KOKORO_DTYPE"] as "fp32" | "fp16" | "q8" | "q4" | "q4f16") ?? "q8";
    const device = (process.env["KOKORO_DEVICE"] ?? "cpu") as "cpu" | "wasm" | "webgpu";

    logger.info({ modelId, dtype, device }, "Loading Kokoro TTS model");
    ttsInstance = await KokoroTTS.from_pretrained(modelId, { dtype, device });
    logger.info("Kokoro TTS model loaded");
    return ttsInstance;
  } catch (err) {
    logger.error({ err }, "Failed to load Kokoro TTS model");
    throw err;
  }
}

/**
 * Generate narration audio from text using Kokoro.
 * Falls back to espeak/silent if the model fails to load.
 */
export async function generateNarration(
  text: string,
  options: TTSOptions = {},
): Promise<TTSResult> {
  try {
    return await kokoroGenerate(text, options);
  } catch (err) {
    logger.warn({ err }, "Kokoro TTS failed, falling back to espeak");
    return fallbackGenerate(text);
  }
}

async function kokoroGenerate(
  text: string,
  options: TTSOptions,
): Promise<TTSResult> {
  const tts = await getTTS(options);
  const voice = options.voice ?? process.env["KOKORO_VOICE"] ?? "af_heart";

  const audio = await tts.generate(text, { voice });

  // Save to WAV file
  const audioPath = join(tmpdir(), `eduwb-kokoro-${randomUUID()}.wav`);
  audio.save(audioPath);

  // Estimate timing from word count (~150 wpm speaking rate)
  const sentences = text.match(/[^.!?\n]+[.!?]*/g) ?? [text];
  const wordsPerMinute = 150;
  const msPerWord = (60 / wordsPerMinute) * 1000;
  const totalWords = text.split(/\s+/).length;
  const estimatedDurationMs = Math.max((totalWords / wordsPerMinute) * 60 * 1000, 2000);

  // Distribute timing across sentences
  const sentenceTimings: Array<{ sentence: string; startMs: number; endMs: number }> = [];
  let currentMs = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    const wordCount = trimmed.split(/\s+/).length;
    const durationMs = Math.max(wordCount * msPerWord, 500);
    sentenceTimings.push({
      sentence: trimmed,
      startMs: Math.round(currentMs),
      endMs: Math.round(currentMs + durationMs),
    });
    currentMs += durationMs;
  }

  return {
    audioPath,
    durationMs: Math.round(estimatedDurationMs),
    sentenceTimings,
  };
}

async function fallbackGenerate(text: string): Promise<TTSResult> {
  const audioPath = join(tmpdir(), `eduwb-tts-${randomUUID()}.wav`);

  // Try espeak first
  try {
    const { execSync } = await import("node:child_process");
    execSync(`espeak "${text.replace(/"/g, '\\"')}" -w "${audioPath}" 2>/dev/null`, { timeout: 30000 });
  } catch {
    // Fall back to silent audio via FFmpeg
    try {
      const { execSync } = await import("node:child_process");
      execSync(
        `ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 5 "${audioPath}" 2>/dev/null`,
        { timeout: 10000 },
      );
    } catch {
      // Last resort: minimal WAV header
      writeFileSync(audioPath, createSilentWav(5000));
    }
  }

  const wordCount = text.split(/\s+/).length;
  const estimatedDurationMs = Math.max((wordCount / 150) * 60 * 1000, 3000);

  return {
    audioPath,
    durationMs: estimatedDurationMs,
    sentenceTimings: text.match(/[^.!?\n]+[.!?]*/g)?.map((s, i, arr) => {
      const msPerSegment = estimatedDurationMs / arr.length;
      return {
        sentence: s.trim(),
        startMs: Math.round(i * msPerSegment),
        endMs: Math.round((i + 1) * msPerSegment),
      };
    }) ?? [{ sentence: text, startMs: 0, endMs: estimatedDurationMs }],
  };
}

function createSilentWav(durationMs: number): Buffer {
  const sampleRate = 24000;
  const numSamples = Math.round((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}
