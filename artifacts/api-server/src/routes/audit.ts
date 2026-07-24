import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, auditEventsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.use("/audit", requireAuth);

// GET /audit/events — list recent audit events for the authenticated creator
router.get("/audit/events", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const events = await db
    .select()
    .from(auditEventsTable)
    .where(eq(auditEventsTable.creatorId, creatorId))
    .orderBy(desc(auditEventsTable.createdAt))
    .limit(limit);

  res.json(events);
});

export default router;
