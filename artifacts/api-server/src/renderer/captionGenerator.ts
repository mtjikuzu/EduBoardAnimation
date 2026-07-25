/**
 * Caption/subtitle generator.
 *
 * Converts narration text with timing metadata into:
 * - SRT subtitle file for MP4 embedding
 * - WebVTT for YouTube captions
 * - In-scene caption overlay timing
 */
export interface CaptionSegment {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

/**
 * Generate caption segments from narration text.
 * Splits by sentences and assigns approximate timing based on
 * a speaking rate of ~150 words per minute.
 */
export function generateCaptionSegments(
  narration: string,
  startOffsetMs: number = 0,
  wordsPerMinute: number = 150,
): CaptionSegment[] {
  const sentences = narration.match(/[^.!?\n]+[.!?]*/g) ?? [narration];
  const msPerWord = (60 / wordsPerMinute) * 1000;
  const segments: CaptionSegment[] = [];
  let currentMs = startOffsetMs;

  sentences.forEach((sentence, i) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    const wordCount = trimmed.split(/\s+/).length;
    const durationMs = Math.max(wordCount * msPerWord, 1000);

    segments.push({
      index: i + 1,
      startMs: Math.round(currentMs),
      endMs: Math.round(currentMs + durationMs),
      text: trimmed,
    });

    currentMs += durationMs;
  });

  return segments;
}

/**
 * Convert caption segments to SRT format.
 */
export function segmentsToSrt(segments: CaptionSegment[]): string {
  return segments
    .map((seg) => {
      const start = msToSrtTime(seg.startMs);
      const end = msToSrtTime(seg.endMs);
      return `${seg.index}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
}

/**
 * Convert caption segments to WebVTT format.
 */
export function segmentsToVtt(segments: CaptionSegment[]): string {
  const header = "WEBVTT\n\n";
  const body = segments
    .map((seg) => {
      const start = msToVttTime(seg.startMs);
      const end = msToVttTime(seg.endMs);
      return `${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
  return header + body;
}

/**
 * Get caption overlay timing for in-scene display.
 * Returns an array of { atMs, text } pairs.
 */
export function getCaptionTimeline(segments: CaptionSegment[]): Array<{ atMs: number; text: string }> {
  return segments.map((seg) => ({
    atMs: seg.startMs,
    text: seg.text,
  }));
}

function msToSrtTime(ms: number): string {
  const totalSec = ms / 1000;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const millis = Math.floor(ms % 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function msToVttTime(ms: number): string {
  const totalSec = ms / 1000;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const millis = Math.floor(ms % 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
