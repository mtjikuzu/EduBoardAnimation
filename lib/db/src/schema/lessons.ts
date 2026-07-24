import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { creatorsTable } from "./creators";

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id")
    .notNull()
    .references(() => creatorsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  grade: text("grade").notNull(),
  language: text("language").notNull(),
  durationMinutes: integer("duration_minutes"),
  status: text("status", {
    enum: ["in_progress", "completed", "pending", "rendering"],
  })
    .notNull()
    .default("pending"),
  thumbnailUrl: text("thumbnail_url"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectLessonSchema = z.object({
  id: z.number(),
  creatorId: z.number(),
  title: z.string(),
  grade: z.string(),
  language: z.string(),
  durationMinutes: z.number().nullable(),
  status: z.enum(["in_progress", "completed", "pending", "rendering"]),
  thumbnailUrl: z.string().nullable(),
  isDeleted: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;
