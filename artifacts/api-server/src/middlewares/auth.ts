/**
 * Auth middleware — supports Clerk production auth + dev-mode fallback.
 *
 * Production (Clerk):
 *   Set CLERK_SECRET_KEY env var. The middleware verifies the session
 *   token from the Authorization header and looks up/create the creator.
 *
 * Dev mode:
 *   Use X-Dev-Creator-Id: <id> header or Authorization: Bearer <id>.
 *
 * When CLERK_SECRET_KEY is set, dev headers are ignored.
 */
import type { Request, Response, NextFunction } from "express";
import { eq, sql } from "drizzle-orm";
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

let clerkClient: any = null;

async function getClerk() {
  if (clerkClient) return clerkClient;
  try {
    const { clerkClient: cc } = await import("@clerk/clerk-sdk-node");
    clerkClient = cc;
    return clerkClient;
  } catch {
    return null;
  }
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const clerk = await getClerk();
    const clerkSecretKey = process.env["CLERK_SECRET_KEY"];

    // ---- Clerk production path ----
    if (clerk && clerkSecretKey) {
      const token = extractBearerToken(req);
      if (!token) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      try {
        const session = await clerk.sessions.verifySession(token);
        const clerkId = session.userId;

        // Find or create creator
        let [creator] = await db
          .select()
          .from(creatorsTable)
          .where(eq(creatorsTable.clerkId, clerkId));

        if (!creator) {
          // Fetch user details from Clerk
          const user = await clerk.users.getUser(clerkId);
          [creator] = await db
            .insert(creatorsTable)
            .values({
              clerkId,
              email: user.emailAddresses?.[0]?.emailAddress ?? `user_${clerkId}@clerk.dev`,
              name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Creator",
            })
            .returning();
        }

        req.creator = {
          id: creator.id,
          clerkId: creator.clerkId,
          email: creator.email,
          name: creator.name,
        };
        next();
        return;
      } catch (clerkErr) {
        logger.error({ err: clerkErr }, "Clerk session verification failed");
        res.status(401).json({ error: "Invalid or expired session" });
        return;
      }
    }

    // ---- Dev mode fallback ----
    const token = extractBearerToken(req) || (typeof req.headers["x-dev-creator-id"] === "string" ? req.headers["x-dev-creator-id"] : null);
    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const creatorId = parseInt(token, 10);
    if (Number.isNaN(creatorId)) {
      res.status(401).json({ error: "Invalid authentication" });
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
