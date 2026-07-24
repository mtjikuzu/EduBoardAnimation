import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, lessonsTable as lessonTable, storyboardsTable } from "@workspace/db";
import { BriefInput } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import type { LessonPlanner, PlannerResult, PlannerError } from "../planner/types";

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

  res.json({
    ...storyboard,
    scenes: typeof storyboard.scenes === "string"
      ? JSON.parse(storyboard.scenes)
      : storyboard.scenes,
    safetyFlags: typeof storyboard.safetyFlags === "string"
      ? JSON.parse(storyboard.safetyFlags as string)
      : storyboard.safetyFlags,
    validationErrors: typeof storyboard.validationErrors === "string"
      ? JSON.parse(storyboard.validationErrors as string)
      : storyboard.validationErrors,
  });
});

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

  res.json(boards);
});

export default router;
