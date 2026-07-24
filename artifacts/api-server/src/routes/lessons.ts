import { Router, type IRouter } from "express";
import { eq, ilike, desc, and } from "drizzle-orm";
import { db, lessonsTable, auditEventsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// All lesson routes require authentication
router.use("/lessons", requireAuth);

async function recordAudit(
  creatorId: number,
  action: string,
  entityType: string,
  entityId?: number,
  metadata?: Record<string, unknown>,
) {
  try {
    await db.insert(auditEventsTable).values({
      creatorId,
      action,
      entityType,
      entityId,
      metadata: metadata ?? null,
    });
  } catch (err) {
    logger.error({ err, action, entityType, entityId }, "Failed to record audit event");
  }
}

// GET /lessons/stats — must be before /:id to avoid param collision
router.get("/lessons/stats", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const all = await db
    .select()
    .from(lessonsTable)
    .where(
      and(eq(lessonsTable.creatorId, creatorId), eq(lessonsTable.isDeleted, false)),
    );
  const stats = {
    total: all.length,
    byStatus: {
      in_progress: all.filter((l) => l.status === "in_progress").length,
      completed: all.filter((l) => l.status === "completed").length,
      pending: all.filter((l) => l.status === "pending").length,
      rendering: all.filter((l) => l.status === "rendering").length,
    },
  };
  res.json(stats);
});

// GET /lessons
router.get("/lessons", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const search = req.query.search as string | undefined;

  let lessons;
  if (search) {
    lessons = await db
      .select()
      .from(lessonsTable)
      .where(
        and(
          eq(lessonsTable.creatorId, creatorId),
          eq(lessonsTable.isDeleted, false),
          ilike(lessonsTable.title, `%${search}%`),
        ),
      )
      .orderBy(desc(lessonsTable.updatedAt));
  } else {
    lessons = await db
      .select()
      .from(lessonsTable)
      .where(
        and(
          eq(lessonsTable.creatorId, creatorId),
          eq(lessonsTable.isDeleted, false),
        ),
      )
      .orderBy(desc(lessonsTable.updatedAt));
  }

  res.json(lessons);
});

// POST /lessons
router.post("/lessons", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { title, grade, language, status } = req.body;

  if (!title || !grade || !language) {
    res.status(400).json({ error: "title, grade, and language are required" });
    return;
  }

  try {
    const [lesson] = await db
      .insert(lessonsTable)
      .values({
        creatorId,
        title,
        grade,
        language,
        status: status ?? "in_progress",
      })
      .returning();

    await recordAudit(creatorId, "create", "lesson", lesson.id, {
      title: lesson.title,
    });

    res.status(201).json(lesson);
  } catch (err) {
    logger.error({ err }, "Failed to create lesson");
    res.status(500).json({ error: "Failed to create lesson" });
  }
});

// GET /lessons/:id
router.get("/lessons/:id", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lessonId = parseInt(raw, 10);

  if (Number.isNaN(lessonId)) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(
      and(
        eq(lessonsTable.id, lessonId),
        eq(lessonsTable.creatorId, creatorId),
        eq(lessonsTable.isDeleted, false),
      ),
    );

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.json(lesson);
});

// PATCH /lessons/:id
router.patch("/lessons/:id", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lessonId = parseInt(raw, 10);

  if (Number.isNaN(lessonId)) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const allowedFields = ["title", "grade", "language", "status", "thumbnailUrl", "durationMinutes"];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [lesson] = await db
    .update(lessonsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(lessonsTable.id, lessonId),
        eq(lessonsTable.creatorId, creatorId),
        eq(lessonsTable.isDeleted, false),
      ),
    )
    .returning();

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  await recordAudit(creatorId, "update", "lesson", lesson.id, { updates });

  res.json(lesson);
});

// DELETE /lessons/:id (soft delete with audit trail)
router.delete("/lessons/:id", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lessonId = parseInt(raw, 10);

  if (Number.isNaN(lessonId)) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  // Soft delete: mark as deleted
  const [lesson] = await db
    .update(lessonsTable)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(
      and(
        eq(lessonsTable.id, lessonId),
        eq(lessonsTable.creatorId, creatorId),
        eq(lessonsTable.isDeleted, false),
      ),
    )
    .returning();

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  await recordAudit(creatorId, "delete", "lesson", lesson.id, {
    title: lesson.title,
  });

  res.sendStatus(204);
});

export default router;
