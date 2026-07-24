import { z } from "zod/v4";

/**
 * Shared domain schemas for the EduWhiteboard storyboard model.
 */

// --- Element types ---

export const ElementType = z.enum([
  "text",
  "icon",
  "math",
  "table",
  "shape",
  "handPointer",
]);

export const SceneElement = z.object({
  type: ElementType,
  content: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  drawOrder: z.number().optional(),
  timingHint: z.string().optional(),
  styleOverrides: z.record(z.string(), z.string()).optional(),
});

// --- Scene ---

export const Scene = z.object({
  id: z.number(),
  order: z.number(),
  title: z.string(),
  narration: z.string(),
  durationSec: z.number().positive(),
  elements: z.array(SceneElement).default([]),
  camera: z
    .object({
      zoom: z.number().optional(),
      panX: z.number().optional(),
      panY: z.number().optional(),
    })
    .optional(),
});

// --- Storyboard ---

export const Storyboard = z.object({
  title: z.string(),
  grade: z.string(),
  language: z.string(),
  objectives: z.string().optional(),
  estimatedDuration: z.number().positive().optional(),
  scenes: z.array(Scene),
  globalStyle: z
    .object({
      strokeWidth: z.number().optional(),
      roughness: z.number().optional(),
      palette: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SceneElement = z.infer<typeof SceneElement>;
export type Scene = z.infer<typeof Scene>;
export type Storyboard = z.infer<typeof Storyboard>;

// --- Brief input ---

export const BriefInput = z.object({
  lessonId: z.number(),
  brief: z.string().min(1, "Brief is required"),
});

export type BriefInput = z.infer<typeof BriefInput>;

// --- Safety flag ---

export const SafetyFlag = z.object({
  category: z.string(),
  severity: z.enum(["info", "warning", "block"]),
  message: z.string(),
});

export type SafetyFlag = z.infer<typeof SafetyFlag>;
