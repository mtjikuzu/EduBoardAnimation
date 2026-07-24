import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { lessonsTable } from "./lessons";

export const storyboardsTable = pgTable("storyboards", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessonsTable.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull().default(1),
  briefText: text("brief_text").notNull().default(""),
  status: text("status", {
    enum: ["draft", "validated", "approved", "rejected"],
  })
    .notNull()
    .default("draft"),
  scenes: jsonb("scenes").notNull().default("[]"),
  validationErrors: jsonb("validation_errors").default("[]"),
  safetyFlags: jsonb("safety_flags").default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Storyboard = typeof storyboardsTable.$inferSelect;
export type InsertStoryboard = typeof storyboardsTable.$inferInsert;
