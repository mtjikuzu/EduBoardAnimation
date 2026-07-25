/**
 * ElevenLabs Text-to-Speech integration.
 *
 * Generates narration audio from scene text with word-level timing,
 * enabling synchronized caption display and animation pacing.
 */
import { execSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger";

export interface TTSOptions {
  voice?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

export interface TTSResult {
  audioPath: string;
  durationMs: number;
  wordTimings: Array<{ word: string; startMs: number; endMs: number }>;
}

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
const API_BASE = "https://api.elevenlabs.io/v1";

/**
 * Generate narration audio with word-level timing data.
 *
 * Uses the ElevenLabs Text-to-Speech API with timestamps.
 * Falls back to system TTS (espeak) when the API key is not configured.
 */
export async function generateNarration(
  text: string,
  options: TTSOptions = {},
): Promise<TTSResult> {
  const apiKey = process.env["ELEVENLABS_API_KEY"];

  if (apiKey) {
    try {
      return await elevenLabsTTS(text, apiKey, options);
    } catch (err) {
      logger.warn({ err }, "ElevenLabs TTS failed, falling back to espeak");
      return fallbackTTS(text);
    }
  }

  logger.info("No ELEVENLABS_API_KEY set, using espeak fallback");
  return fallbackTTS(text);
}

async function elevenLabsTTS(
  text: string,
  apiKey: string,
  options: TTSOptions,
): Promise<TTSResult> {
  const voice = options.voice ?? DEFAULT_VOICE;
  const model = options.model ?? "eleven_multilingual_v2";

  const response = await fetch(
    `${API_BASE}/text-to-speech/${voice}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    audio_base64: string;
    alignment: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
    duration: number;
  };

  // Decode audio
  const audioBuffer = Buffer.from(data.audio_base64, "base64");
  const audioPath = join(tmpdir(), `eduwb-tts-${randomUUID()}.mp3`);
  writeFileSync(audioPath, audioBuffer);

  // Build word timings from character alignment
  const wordTimings: Array<{ word: string; startMs: number; endMs: number }> = [];
  let currentWord = "";
  let wordStartMs = 0;

  for (let i = 0; i < data.alignment.characters.length; i++) {
    const char = data.alignment.characters[i];
    const startMs = data.alignment.character_start_times_seconds[i] * 1000;
    const endMs = data.alignment.character_end_times_seconds[i] * 1000;

    if (char === " " || char === "\n") {
      if (currentWord) {
        wordTimings.push({
          word: currentWord,
          startMs: Math.round(wordStartMs),
          endMs: Math.round(endMs),
        });
        currentWord = "";
      }
    } else {
      if (!currentWord) wordStartMs = startMs;
      currentWord += char;
    }
  }

  // Last word
  if (currentWord) {
    wordTimings.push({
      word: currentWord,
      startMs: Math.round(wordStartMs),
      endMs: Math.round(data.duration * 1000),
    });
  }

  return {
    audioPath,
    durationMs: Math.round(data.duration * 1000),
    wordTimings,
  };
}

async function fallbackTTS(text: string): Promise<TTSResult> {
  const audioPath = join(tmpdir(), `eduwb-tts-${randomUUID()}.wav`);

  // Use espeak for fallback TTS
  try {
    execSync(
      `espeak "${text.replace(/"/g, '\\"')}" -w "${audioPath}" 2>/dev/null`,
      { timeout: 30000 },
    );
  } catch {
    // Generate silent audio if espeak is not available
    const { execSync } = require("node:child_process");
    try {
      execSync(
        `ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 5 "${audioPath}" 2>/dev/null`,
        { timeout: 10000 },
      );
    } catch {
      // Last resort: write a minimal WAV header
      writeFileSync(audioPath, createSilentWav(5000));
    }
  }

  // Estimate duration from word count (~150 wpm)
  const wordCount = text.split(/\s+/).length;
  const estimatedDurationMs = Math.max((wordCount / 150) * 60 * 1000, 3000);

  return {
    audioPath,
    durationMs: estimatedDurationMs,
    wordTimings: text.split(/\s+/).map((word, i, arr) => {
      const msPerWord = estimatedDurationMs / arr.length;
      return {
        word,
        startMs: Math.round(i * msPerWord),
        endMs: Math.round((i + 1) * msPerWord),
      };
    }),
  };
}

function createSilentWav(durationMs: number): Buffer {
  const sampleRate = 24000;
  const numSamples = Math.round((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2; // 16-bit samples
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}
