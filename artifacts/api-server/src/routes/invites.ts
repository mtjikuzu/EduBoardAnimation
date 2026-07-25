import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, invitesTable, waitlistTable, creatorsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { randomBytes } from "node:crypto";

const router: IRouter = Router();

/**
 * POST /invites/join-waitlist
 * Public — anyone can join the waitlist.
 * Body: { email: string, name?: string, reason?: string }
 */
router.post("/invites/join-waitlist", async (req, res): Promise<void> => {
  const { email, name, reason } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    // Check if already on waitlist
    const [existing] = await db
      .select()
      .from(waitlistTable)
      .where(eq(waitlistTable.email, email));

    if (existing) {
      res.json({ message: "You're already on the waitlist!", status: existing.status });
      return;
    }

    const [entry] = await db
      .insert(waitlistTable)
      .values({
        email,
        name: name ?? "",
        reason: reason ?? "",
        status: "pending",
      })
      .returning();

    logger.info({ email, waitlistId: entry.id }, "New waitlist signup");
    res.status(201).json({ message: "Added to waitlist", id: entry.id });
  } catch (err) {
    logger.error({ err }, "Waitlist signup failed");
    res.status(500).json({ error: "Failed to join waitlist" });
  }
});

/**
 * GET /invites/waitlist
 * Admin — list all waitlist entries (requires auth).
 */
router.get("/invites/waitlist", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const entries = await db
    .select()
    .from(waitlistTable)
    .orderBy(desc(waitlistTable.createdAt));
  res.json(entries);
});

/**
 * POST /invites/create
 * Admin — create an invite code (requires auth).
 * Body: { maxUses?: number }
 */
router.post("/invites/create", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const maxUses = Math.max(1, Math.min(req.body.maxUses ?? 1, 100));

  const code = randomBytes(4).toString("hex").toUpperCase();

  const [invite] = await db
    .insert(invitesTable)
    .values({ code, createdBy: creatorId, maxUses })
    .returning();

  res.status(201).json({ code: invite.code, maxUses: invite.maxUses });
});

/**
 * POST /invites/redeem
 * Redeem an invite code (no auth required - happens during signup).
 * Body: { code: string, email: string }
 */
router.post("/invites/redeem", async (req, res): Promise<void> => {
  const { code, email } = req.body;

  if (!code || !email) {
    res.status(400).json({ error: "Code and email are required" });
    return;
  }

  const [invite] = await db
    .select()
    .from(invitesTable)
    .where(eq(invitesTable.code, code.toUpperCase()));

  if (!invite) {
    res.status(404).json({ error: "Invalid invite code" });
    return;
  }

  if (!invite.isActive) {
    res.status(410).json({ error: "Invite code has been deactivated" });
    return;
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    res.status(410).json({ error: "Invite code has expired" });
    return;
  }

  if (invite.useCount >= invite.maxUses) {
    res.status(410).json({ error: "Invite code has reached its maximum uses" });
    return;
  }

  // Increment use count
  await db
    .update(invitesTable)
    .set({ useCount: invite.useCount + 1 })
    .where(eq(invitesTable.id, invite.id));

  // Update waitlist entry if exists
  await db
    .update(waitlistTable)
    .set({ status: "invited" })
    .where(eq(waitlistTable.email, email));

  res.json({ valid: true, code: invite.code });
});

/**
 * GET /invites/list
 * Admin — list all invite codes (requires auth).
 */
router.get("/invites/list", requireAuth, async (_req: AuthenticatedRequest, res): Promise<void> => {
  const invites = await db
    .select()
    .from(invitesTable)
    .orderBy(desc(invitesTable.createdAt));
  res.json(invites);
});

export default router;
