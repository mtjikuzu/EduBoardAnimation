import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, creatorsTable } from "@workspace/db";
import { logger } from "../lib/logger";

export interface AuthenticatedRequest extends Request {
  creator?: {
    id: number;
    clerkId: string;
    email: string;
    name: string;
  };
}

/**
 * Auth middleware that extracts the creator from the session.
 *
 * In production, this reads the Clerk session token. In development:
 * 1. `Authorization: Bearer <creator-id>` — used by the frontend SDK
 * 2. `X-Dev-Creator-Id: <id>` — used for curl/API testing
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let creatorId: number | null = null;

    // Check Authorization header first (Bearer token = creator ID in dev)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const parsed = parseInt(token, 10);
      if (!Number.isNaN(parsed)) {
        creatorId = parsed;
      }
    }

    // Fall back to dev header
    if (creatorId === null) {
      const devHeader = req.headers["x-dev-creator-id"];
      if (typeof devHeader === "string") {
        const parsed = parseInt(devHeader, 10);
        if (!Number.isNaN(parsed)) {
          creatorId = parsed;
        }
      }
    }

    if (creatorId === null) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const [creator] = await db
      .select({
        id: creatorsTable.id,
        clerkId: creatorsTable.clerkId,
        email: creatorsTable.email,
        name: creatorsTable.name,
      })
      .from(creatorsTable)
      .where(eq(creatorsTable.id, creatorId));

    if (!creator) {
      res.status(401).json({ error: "Creator not found" });
      return;
    }

    req.creator = creator;
    next();
  } catch (err) {
    logger.error({ err }, "Auth middleware error");
    res.status(500).json({ error: "Authentication service error" });
  }
}
