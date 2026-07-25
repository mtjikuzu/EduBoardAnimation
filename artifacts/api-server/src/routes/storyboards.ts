import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, lessonsTable as lessonTable, storyboardsTable, auditEventsTable } from "@workspace/db";
import { BriefInput } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import type { LessonPlanner, PlannerResult, PlannerError } from "../planner/types";
import { checkBriefSafety } from "../renderer/contentSafety";

const router: IRouter = Router();
router.use("/storyboards", requireAuth);

// --- Planner selection ---
// Use OpenAI when a key is available, otherwise fall back to the mock.
let planner: LessonPlanner | null = null;

async function getPlanner(): Promise<LessonPlanner> {
  if (planner) return planner;
  if (process.env["OPENAI_API_KEY"]) {
    const { createOpenAiPlanner } = await import("../planner/openai");
    planner = createOpenAiPlanner();
    logger.info("Using OpenAI planner");
  } else {
    const { mockPlanner } = await import("../planner/mock");
    planner = mockPlanner;
    logger.info("Using mock planner (no OPENAI_API_KEY set)");
  }
  return planner;
}

/**
 * POST /storyboards/generate
 *
 * Accepts a lesson brief, runs it through the planner, stores the
 * validated result, and returns the storyboard with validation/safety status.
 */
router.post("/storyboards/generate", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;

  const parsed = BriefInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Verify the lesson belongs to this creator
  const [lesson] = await db
    .select({ id: lessonTable.id, title: lessonTable.title })
    .from(lessonTable)
    .where(
      and(
        eq(lessonTable.id, parsed.data.lessonId),
        eq(lessonTable.creatorId, creatorId),
        eq(lessonTable.isDeleted, false),
      ),
    );

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  // Safety check
  const safetyFlags = checkBriefSafety(parsed.data.brief);
  const blocked = safetyFlags.filter((f) => f.severity === "block");
  if (blocked.length > 0) {
    res.status(422).json({
      error: "Brief blocked by content policy",
      safetyFlags: blocked,
    });
    return;
  }

  try {
    const p = await getPlanner();
    const result: PlannerResult = await p.plan(parsed.data);

    // Validate scenes have required structure
    const sceneCount = result.storyboard.scenes.length;
    if (sceneCount < 1) {
      res.status(422).json({ error: "Generated storyboard has no scenes" });
      return;
    }

    // Store the storyboard
    const [storyboard] = await db
      .insert(storyboardsTable)
      .values({
        lessonId: lesson.id,
        briefText: parsed.data.brief,
        status: "validated",
        scenes: JSON.parse(result.rawOutput),
        safetyFlags: result.safetyFlags.length > 0 ? JSON.parse(JSON.stringify(result.safetyFlags)) : [],
      })
      .returning();

    // Update lesson status
    await db
      .update(lessonTable)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(lessonTable.id, lesson.id));

    res.status(201).json({
      id: storyboard.id,
      lessonId: storyboard.lessonId,
      revision: storyboard.revision,
      status: storyboard.status,
      briefText: storyboard.briefText,
      scenes: result.storyboard.scenes,
      safetyFlags: result.safetyFlags,
      modelUsed: result.modelUsed,
      createdAt: storyboard.createdAt,
    });
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    logger.error({ err, lessonId: parsed.data.lessonId }, "Storyboard generation failed");

    if (error.code === "schema" || error.code === "policy") {
      res.status(422).json({ error: error.message, code: error.code });
      return;
    }

    if (error.code === "provider" || error.code === "timeout") {
      res.status(502).json({ error: "Generation service unavailable", code: error.code });
      return;
    }

    res.status(500).json({ error: "Failed to generate storyboard" });
  }
});

/**
 * GET /storyboards/:id
 *
 * Returns a specific storyboard by id (first checks lesson ownership).
 */
router.get("/storyboards/:id", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const storyboardId = parseInt(raw, 10);

  if (Number.isNaN(storyboardId)) {
    res.status(400).json({ error: "Invalid storyboard ID" });
    return;
  }

  const [storyboard] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));

  if (!storyboard) {
    res.status(404).json({ error: "Storyboard not found" });
    return;
  }

  // Verify ownership via the linked lesson
  const [lesson] = await db
    .select()
    .from(lessonTable)
    .where(
      and(
        eq(lessonTable.id, storyboard.lessonId),
        eq(lessonTable.creatorId, creatorId),
      ),
    );

  if (!lesson) {
    res.status(404).json({ error: "Storyboard not found" });
    return;
  }

  const normalized: Record<string, unknown> = normalizeStoryboardResponse(storyboard as Record<string, unknown>);
  normalized.safetyFlags = typeof storyboard.safetyFlags === "string"
    ? JSON.parse(storyboard.safetyFlags as string)
    : storyboard.safetyFlags;
  normalized.validationErrors = typeof storyboard.validationErrors === "string"
    ? JSON.parse(storyboard.validationErrors as string)
    : storyboard.validationErrors;

  res.json(normalized);
});

/**
 * Normalize the DB scenes field: it stores the full Storyboard object
 * (title, grade, scenes[]) but the API should return a flat scenes array.
 * Also extracts storyboard-level metadata (title, grade, language).
 */
function normalizeStoryboardResponse(board: Record<string, unknown>) {
  const rawScenes = typeof board.scenes === "string"
    ? JSON.parse(board.scenes as string)
    : (board.scenes ?? {});

  const storyboardData = rawScenes as Record<string, unknown>;
  const scenesArray = Array.isArray(storyboardData.scenes)
    ? storyboardData.scenes
    : [];

  return {
    ...board,
    scenes: scenesArray,
    storyboardTitle: storyboardData.title ?? null,
    storyboardGrade: storyboardData.grade ?? null,
    storyboardLanguage: storyboardData.language ?? null,
    estimatedDuration: storyboardData.estimatedDuration ?? null,
  };
}

/**
 * GET /storyboards?lessonId=:id
 *
 * Lists all storyboard revisions for a given lesson.
 */
router.get("/storyboards", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const lessonId = parseInt(req.query.lessonId as string, 10);

  if (Number.isNaN(lessonId)) {
    res.status(400).json({ error: "lessonId query parameter is required" });
    return;
  }

  // Verify lesson ownership
  const [lesson] = await db
    .select({ id: lessonTable.id })
    .from(lessonTable)
    .where(
      and(
        eq(lessonTable.id, lessonId),
        eq(lessonTable.creatorId, creatorId),
      ),
    );

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const boards = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.lessonId, lessonId))
    .orderBy(desc(storyboardsTable.createdAt));

  res.json(boards.map(normalizeStoryboardResponse));
});

/**
 * PATCH /storyboards/:id/scenes
 *
 * Updates one or more scenes in a storyboard and increments the revision.
 * Body: { scenes: Scene[], changedSceneIds?: number[] }
 */
router.patch("/storyboards/:id/scenes", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const storyboardId = parseInt(raw, 10);

  if (Number.isNaN(storyboardId)) {
    res.status(400).json({ error: "Invalid storyboard ID" });
    return;
  }

  // Fetch the existing storyboard
  const [existing] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));

  if (!existing) {
    res.status(404).json({ error: "Storyboard not found" });
    return;
  }

  // Verify ownership via the linked lesson
  const [lesson] = await db
    .select({ id: lessonTable.id })
    .from(lessonTable)
    .where(
      and(
        eq(lessonTable.id, existing.lessonId),
        eq(lessonTable.creatorId, creatorId),
      ),
    );

  if (!lesson) {
    res.status(404).json({ error: "Storyboard not found" });
    return;
  }

  const { scenes, changedSceneIds } = req.body;
  if (!Array.isArray(scenes) || scenes.length === 0) {
    res.status(400).json({ error: "scenes array is required" });
    return;
  }

  // Preserve the existing storyboard wrapper structure
  const existingScenes = typeof existing.scenes === "string"
    ? JSON.parse(existing.scenes)
    : (existing.scenes ?? {});
  const storyboardWrapper = Array.isArray(existingScenes)
    ? { scenes: existingScenes }
    : existingScenes;
  // Update the scenes array inside the wrapper
  storyboardWrapper.scenes = scenes;

  // Create new revision: insert a fresh row with incremented revision number
  const [updated] = await db
    .insert(storyboardsTable)
    .values({
      lessonId: existing.lessonId,
      revision: existing.revision + 1,
      briefText: existing.briefText ?? "",
      status: "validated",
      scenes: storyboardWrapper,
      safetyFlags: existing.safetyFlags ?? [],
    })
    .returning();

  res.json({
    id: updated.id,
    lessonId: updated.lessonId,
    revision: updated.revision,
    status: updated.status,
    briefText: updated.briefText,
    scenes: scenes,
    safetyFlags: existing.safetyFlags ?? [],
    createdAt: updated.createdAt,
  });
});

/**
 * PATCH /storyboards/:id/reorder
 *
 * Reorders scenes in a storyboard.
 * Body: { sceneIds: number[] } (ordered array of scene IDs)
 */
router.patch("/storyboards/:id/reorder", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const storyboardId = parseInt(raw, 10);

  if (Number.isNaN(storyboardId)) {
    res.status(400).json({ error: "Invalid storyboard ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));

  if (!existing) {
    res.status(404).json({ error: "Storyboard not found" });
    return;
  }

  const [lesson] = await db
    .select({ id: lessonTable.id })
    .from(lessonTable)
    .where(
      and(
        eq(lessonTable.id, existing.lessonId),
        eq(lessonTable.creatorId, creatorId),
      ),
    );

  if (!lesson) {
    res.status(404).json({ error: "Storyboard not found" });
    return;
  }

  const { sceneIds } = req.body;
  if (!Array.isArray(sceneIds) || sceneIds.length === 0) {
    res.status(400).json({ error: "sceneIds array is required" });
    return;
  }

  const rawCurrentScenes: Record<string, unknown> | Array<Record<string, unknown>> = 
    typeof existing.scenes === "string" ? JSON.parse(existing.scenes) : (existing.scenes ?? {});
  // Extract the scenes array (could be flat array or nested in storyboard object)
  const currentScenes: Array<{ id: number } & Record<string, unknown>> = 
    Array.isArray(rawCurrentScenes) ? rawCurrentScenes : (rawCurrentScenes.scenes as any ?? []);
  const storyboardWrapper = Array.isArray(rawCurrentScenes) ? { scenes: rawCurrentScenes } : rawCurrentScenes;

  // Build a map for quick lookup
  const sceneMap = new Map<number, Record<string, unknown>>();
  for (const s of currentScenes) {
    sceneMap.set(s.id, s);
  }

  // Build new ordered array
  const reordered = sceneIds
    .filter((id: number) => sceneMap.has(id))
    .map((id: number, idx: number) => ({
      ...sceneMap.get(id)!,
      order: idx + 1,
    }));

  if (reordered.length === 0) {
    res.status(400).json({ error: "No valid scenes to reorder" });
    return;
  }

  // Preserve the wrapper structure
  storyboardWrapper.scenes = reordered;

  // Create new revision with reordered scenes
  const [updated] = await db
    .insert(storyboardsTable)
    .values({
      lessonId: existing.lessonId,
      revision: existing.revision + 1,
      briefText: existing.briefText ?? "",
      status: "validated",
      scenes: storyboardWrapper,
      safetyFlags: existing.safetyFlags ?? [],
    })
    .returning();

  res.json({
    id: updated.id,
    lessonId: updated.lessonId,
    revision: updated.revision,
    status: updated.status,
    briefText: updated.briefText,
    scenes: reordered,
    safetyFlags: existing.safetyFlags ?? [],
    createdAt: updated.createdAt,
  });
});

export default router;
