import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, creatorsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

/**
 * POST /creators/signup
 *
 * Dev-only signup endpoint. In production this is triggered by the
 * Clerk webhook when a new user registers. For the beta, a creator
 * must exist in the database before they can use the workspace.
 *
 * Body: { email, name, clerkId? }
 */
router.post("/creators/signup", async (req, res): Promise<void> => {
  const { email, name, clerkId } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(creatorsTable)
      .where(sql`${creatorsTable.email} = ${email}`);

    if (existing) {
      res.json({
        id: existing.id,
        email: existing.email,
        name: existing.name,
        createdAt: existing.createdAt,
      });
      return;
    }

    const [creator] = await db
      .insert(creatorsTable)
      .values({
        clerkId: clerkId ?? `dev_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email,
        name: name ?? email.split("@")[0],
      })
      .returning();

    res.status(201).json({
      id: creator.id,
      email: creator.email,
      name: creator.name,
      createdAt: creator.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "Creator signup error");
    res.status(500).json({ error: "Failed to create creator" });
  }
});

/**
 * GET /creators/me
 *
 * Returns the authenticated creator's profile.
 */
router.get("/creators/me", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  res.json({
    id: req.creator!.id,
    email: req.creator!.email,
    name: req.creator!.name,
  });
});

/**
 * PATCH /creators/me
 *
 * Updates the authenticated creator's profile.
 */
router.patch("/creators/me", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { name } = req.body;

  if (name && typeof name === "string") {
    const [creator] = await db
      .update(creatorsTable)
      .set({ name, updatedAt: new Date() })
      .where(eq(creatorsTable.id, req.creator!.id))
      .returning();

    res.json({
      id: creator.id,
      email: creator.email,
      name: creator.name,
    });
  } else {
    res.status(400).json({ error: "Name is required" });
  }
});

export default router;
