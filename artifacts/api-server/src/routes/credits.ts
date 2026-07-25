import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, creditLedgerTable, storyboardsTable, lessonsTable as lessonTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { estimateRenderCost, getBalance, addLedgerEntry, grantTrialCredits } from "../lib/credits";

const router: IRouter = Router();
router.use("/credits", requireAuth);

/**
 * GET /credits/balance — returns current available balance and active holds.
 */
router.get("/credits/balance", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const balance = await getBalance(creatorId);

  const [holdRow] = await db
    .select({
      holds: sql<string>`COALESCE(SUM(CASE WHEN entry_type = 'hold' THEN amount::numeric ELSE 0 END), 0)`,
      releases: sql<string>`COALESCE(SUM(CASE WHEN entry_type = 'release' THEN amount::numeric ELSE 0 END), 0)`,
    })
    .from(creditLedgerTable)
    .where(
      and(
        eq(creditLedgerTable.creatorId, creatorId),
        sql`${creditLedgerTable.entryType} IN ('hold', 'release')`,
      ),
    );

  const holds = Number(holdRow?.holds ?? 0);
  const releases = Number(holdRow?.releases ?? 0);

  res.json({
    available: balance,
    held: Math.max(0, holds - releases),
    totalGrants: 0,
  });
});

/**
 * GET /credits/ledger — returns the full credit ledger for the creator.
 */
router.get("/credits/ledger", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const entries = await db
    .select()
    .from(creditLedgerTable)
    .where(eq(creditLedgerTable.creatorId, creatorId))
    .orderBy(desc(creditLedgerTable.createdAt))
    .limit(limit);

  res.json(entries);
});

/**
 * POST /credits/approve-render
 *
 * Approves a storyboard for rendering. Creates a credit hold for the
 * estimated cost. Returns the hold details and available balance after hold.
 *
 * Body: { storyboardId: number }
 */
router.post("/credits/approve-render", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { storyboardId } = req.body;

  if (!storyboardId || typeof storyboardId !== "number") {
    res.status(400).json({ error: "storyboardId is required" });
    return;
  }

  // Fetch the storyboard and verify ownership
  const [storyboard] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId));

  if (!storyboard) {
    res.status(404).json({ error: "Storyboard not found" });
    return;
  }

  const [lesson] = await db
    .select({ id: lessonTable.id })
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

  // Grant trial credits if first usage
  await grantTrialCredits(creatorId);

  // Check balance
  const balance = await getBalance(creatorId);

  // Parse scenes and estimate cost
  const rawScenes = typeof storyboard.scenes === "string"
    ? JSON.parse(storyboard.scenes)
    : (storyboard.scenes ?? {});
  // The planner output wraps scenes inside a top-level object
  const scenes = Array.isArray(rawScenes) ? rawScenes : (Array.isArray((rawScenes as Record<string, unknown>).scenes) ? (rawScenes as Record<string, unknown>).scenes : []);
  const totalElements = scenes.reduce(
    (sum: number, s: { elements?: unknown[] }) => sum + (s.elements?.length ?? 0),
    0,
  );
  const estimatedCost = estimateRenderCost(scenes.length, totalElements);

  if (balance < estimatedCost) {
    res.status(402).json({
      error: "Insufficient credits",
      available: balance,
      required: estimatedCost,
      shortfall: estimatedCost - balance,
    });
    return;
  }

  // Create the hold
  const balanceAfter = await addLedgerEntry(
    creatorId,
    "hold",
    estimatedCost,
    `Render hold for storyboard #${storyboardId} (${scenes.length} scenes, ${totalElements} elements)`,
    { type: "storyboard", id: storyboardId },
    { estimatedCost, sceneCount: scenes.length, elementCount: totalElements },
  );

  // Update storyboard status
  await db
    .update(storyboardsTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(storyboardsTable.id, storyboardId));

  res.json({
    approved: true,
    storyboardId,
    estimatedCost,
    availableAfterHold: balanceAfter,
    holdDescription: `Hold of ${estimatedCost} credits for rendering`,
  });
});

// --- Mock Polar commerce (dev mode) ---

/**
 * POST /credits/mock-checkout
 *
 * Dev-only endpoint that simulates buying credits.
 * In production, this creates a Polar Checkout Session and returns its URL.
 * For now, it directly grants credits.
 */
router.post("/credits/mock-checkout", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { amount } = req.body;

  const creditAmount = typeof amount === "number" && amount > 0 ? amount : 50;

  const balanceAfter = await addLedgerEntry(
    creatorId,
    "grant",
    creditAmount,
    `Mock purchase of ${creditAmount} credits (dev mode)`,
    undefined,
    { mock: true },
  );

  logger.info({ creatorId, creditAmount, balanceAfter }, "Mock credit purchase");

  res.json({
    success: true,
    creditsAdded: creditAmount,
    newBalance: balanceAfter,
    note: "Dev mode: credits granted directly. Production uses Polar Checkout.",
  });
});

export default router;
