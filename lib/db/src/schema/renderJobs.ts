import { pgTable, serial, integer, text, timestamp, jsonb, numeric, index } from "drizzle-orm/pg-core";
import { storyboardsTable } from "./storyboards";

export const renderJobsTable = pgTable(
  "render_jobs",
  {
    id: serial("id").primaryKey(),
    storyboardId: integer("storyboard_id")
      .notNull()
      .references(() => storyboardsTable.id, { onDelete: "cascade" }),
    jobType: text("job_type", { enum: ["scene_preview", "full_export", "scene_regen"] })
      .notNull()
      .default("full_export"),
    sceneIndex: integer("scene_index"),
    status: text("status", {
      enum: ["queued", "rendering", "completed", "failed"],
    })
      .notNull()
      .default("queued"),
    progress: numeric("progress").default("0"),
    estimatedCost: numeric("estimated_cost"),
    actualCost: numeric("actual_cost"),
    outputUrl: text("output_url"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    storyboardIdx: index("render_job_storyboard_idx").on(table.storyboardId),
  }),
);

export type RenderJob = typeof renderJobsTable.$inferSelect;
export type InsertRenderJob = typeof renderJobsTable.$inferInsert;
