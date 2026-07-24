import { Router, type IRouter } from "express";
import { eq, ilike, desc } from "drizzle-orm";
import { db, lessonsTable } from "@workspace/db";
import {
  GetLessonsQueryParams,
  CreateLessonBody,
  GetLessonParams,
  GetLessonResponse,
  UpdateLessonParams,
  UpdateLessonBody,
  UpdateLessonResponse,
  DeleteLessonParams,
  GetLessonsResponse,
  CreateLessonResponse,
  GetLessonStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /lessons/stats — must be before /:id to avoid param collision
router.get("/lessons/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(lessonsTable);
  const stats = {
    total: all.length,
    byStatus: {
      in_progress: all.filter((l) => l.status === "in_progress").length,
      completed: all.filter((l) => l.status === "completed").length,
      pending: all.filter((l) => l.status === "pending").length,
      rendering: all.filter((l) => l.status === "rendering").length,
    },
  };
  res.json(GetLessonStatsResponse.parse(stats));
});

// GET /lessons
router.get("/lessons", async (req, res): Promise<void> => {
  const query = GetLessonsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let lessons;
  if (query.data.search) {
    lessons = await db
      .select()
      .from(lessonsTable)
      .where(ilike(lessonsTable.title, `%${query.data.search}%`))
      .orderBy(desc(lessonsTable.updatedAt));
  } else if (query.data.status) {
    lessons = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.status, query.data.status as "in_progress" | "completed" | "pending" | "rendering"))
      .orderBy(desc(lessonsTable.updatedAt));
  } else {
    lessons = await db
      .select()
      .from(lessonsTable)
      .orderBy(desc(lessonsTable.updatedAt));
  }

  res.json(GetLessonsResponse.parse(lessons));
});

// POST /lessons
router.post("/lessons", async (req, res): Promise<void> => {
  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      ...parsed.data,
      status: parsed.data.status ?? "pending",
    })
    .returning();

  res.status(201).json(CreateLessonResponse.parse(lesson));
});

// GET /lessons/:id
router.get("/lessons/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetLessonParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, params.data.id));

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.json(GetLessonResponse.parse(lesson));
});

// PATCH /lessons/:id
router.patch("/lessons/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateLessonParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lesson] = await db
    .update(lessonsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(lessonsTable.id, params.data.id))
    .returning();

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.json(UpdateLessonResponse.parse(lesson));
});

// DELETE /lessons/:id
router.delete("/lessons/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteLessonParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db
    .delete(lessonsTable)
    .where(eq(lessonsTable.id, params.data.id))
    .returning();

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
