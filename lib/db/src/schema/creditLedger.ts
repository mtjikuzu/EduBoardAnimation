import { pgTable, serial, integer, text, timestamp, jsonb, numeric, index } from "drizzle-orm/pg-core";
import { creatorsTable } from "./creators";

export const creditLedgerTable = pgTable(
  "credit_ledger",
  {
    id: serial("id").primaryKey(),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creatorsTable.id, { onDelete: "cascade" }),
    entryType: text("entry_type", {
      enum: ["grant", "hold", "consume", "release", "refund", "expire"],
    }).notNull(),
    amount: numeric("amount").notNull().default("0"),
    balanceAfter: numeric("balance_after").notNull().default("0"),
    description: text("description").default(""),
    referenceType: text("reference_type"),
    referenceId: integer("reference_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    creatorIdx: index("ledger_creator_idx").on(table.creatorId),
  }),
);

export type CreditLedgerEntry = typeof creditLedgerTable.$inferSelect;
export type InsertCreditLedgerEntry = typeof creditLedgerTable.$inferInsert;
