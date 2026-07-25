import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { creatorsTable } from "./creators";

export const invitesTable = pgTable("invites", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdBy: integer("created_by").references(() => creatorsTable.id),
  maxUses: integer("max_uses").notNull().default(1),
  useCount: integer("use_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const waitlistTable = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").default(""),
  reason: text("reason").default(""),
  status: text("status", { enum: ["pending", "invited", "joined", "declined"] })
    .notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Invite = typeof invitesTable.$inferSelect;
export type WaitlistEntry = typeof waitlistTable.$inferSelect;
