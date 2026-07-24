import { db, creditLedgerTable, creatorsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Credit estimation: each scene costs a base amount plus per-element cost.
 * Cache hits cost 0. Final export assembly costs a flat fee.
 */
export function estimateRenderCost(sceneCount: number, totalElements: number): number {
  const SCENE_BASE_COST = 10;
  const ELEMENT_COST = 2;
  const ASSEMBLY_COST = 15;
  return sceneCount * SCENE_BASE_COST + totalElements * ELEMENT_COST + ASSEMBLY_COST;
}

/**
 * Get the current available balance for a creator.
 */
export async function getBalance(creatorId: number): Promise<number> {
  const [row] = await db
    .select({
      balance: sql<string>`COALESCE(
        (SELECT balance_after FROM ${creditLedgerTable}
         WHERE creator_id = ${creatorId}
         ORDER BY id DESC LIMIT 1),
        '0'
      )`,
    })
    .from(creditLedgerTable)
    .where(eq(creditLedgerTable.creatorId, creatorId))
    .limit(1);

  if (!row) return 0;

  // Also subtract active holds
  const [holdRow] = await db
    .select({
      totalHolds: sql<string>`COALESCE(SUM(
        CASE WHEN entry_type = 'hold' THEN amount::numeric
             ELSE 0 END
      ), 0) -
      COALESCE(SUM(
        CASE WHEN entry_type = 'release' THEN amount::numeric
             ELSE 0 END
      ), 0)`,
    })
    .from(creditLedgerTable)
    .where(
      sql`${creditLedgerTable.creatorId} = ${creatorId}
        AND ${creditLedgerTable.entryType} IN ('hold', 'release')`,
    );

  const balance = Number(row.balance);
  const activeHolds = holdRow ? Number(holdRow.totalHolds) : 0;
  return balance - activeHolds;
}

/**
 * Add a credit ledger entry and return the new running balance.
 */
export async function addLedgerEntry(
  creatorId: number,
  entryType: "grant" | "hold" | "consume" | "release" | "refund" | "expire",
  amount: number,
  description: string,
  reference?: { type: string; id: number },
  metadata?: Record<string, unknown>,
): Promise<number> {
  const [lastEntry] = await db
    .select({
      balanceAfter: creditLedgerTable.balanceAfter,
    })
    .from(creditLedgerTable)
    .where(eq(creditLedgerTable.creatorId, creatorId))
    .orderBy(sql`${creditLedgerTable.id} DESC`)
    .limit(1);

  const currentBalance = lastEntry ? Number(lastEntry.balanceAfter) : 0;
  let balanceAfter: number;

  switch (entryType) {
    case "grant":
    case "refund":
      balanceAfter = currentBalance + amount;
      break;
    case "hold":
      balanceAfter = currentBalance - amount;
      break;
    case "release":
      balanceAfter = currentBalance + amount;
      break;
    case "consume":
      balanceAfter = currentBalance - amount;
      break;
    case "expire":
      balanceAfter = currentBalance - amount;
      break;
    default:
      balanceAfter = currentBalance;
  }

  await db.insert(creditLedgerTable).values({
    creatorId,
    entryType,
    amount: String(amount),
    balanceAfter: String(Math.max(0, balanceAfter)),
    description,
    referenceType: reference?.type ?? null,
    referenceId: reference?.id ?? null,
    metadata: metadata ?? null,
  });

  return Math.max(0, balanceAfter);
}

/**
 * Grant trial credits to a creator on first project creation.
 */
export async function grantTrialCredits(creatorId: number): Promise<void> {
  const [existing] = await db
    .select({ id: creditLedgerTable.id })
    .from(creditLedgerTable)
    .where(
      sql`${creditLedgerTable.creatorId} = ${creatorId} AND ${creditLedgerTable.entryType} = 'grant'`,
    )
    .limit(1);

  if (!existing) {
    await addLedgerEntry(creatorId, "grant", 100, "Trial credits for new creator");
    logger.info({ creatorId }, "Granted trial credits");
  }
}
