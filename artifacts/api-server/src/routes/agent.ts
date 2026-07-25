/**
 * Chat revision agent — conversational scene editing.
 *
 * POST /agent/revision
 *   Body: { storyboardId: number, edit: string }
 *   Response: { revision: number, updatedScenes: Scene[], changedSceneIds: number[], explanation: string }
 *
 * The agent calls an LLM with the current storyboard and the user's edit
 * instruction, validates the output with Zod, and persists a new revision.
 * Only changed scenes are flagged for re-render via content-hash cache.
 */
import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, storyboardsTable, lessonsTable as lessonTable } from "@workspace/db";
import { Storyboard, Scene } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();
router.use("/agent", requireAuth);

const LLM_API_BASE =
  process.env["LLM_API_BASE"] ?? "https://api.openai.com/v1";
const LLM_API_KEY =
  process.env["LLM_API_KEY"] ||
  process.env["OPENAI_API_KEY"] ||
  "";
const LLM_MODEL =
  process.env["LLM_MODEL"] ?? process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";

const REVISION_SYSTEM_PROMPT = `You are an expert educational video editor.
You receive a storyboard (array of scenes) and a natural-language edit instruction.
Your task is to modify the scenes to satisfy the edit instruction.

Each scene has: id, order, title, narration, durationSec, elements[].

Element types: text, icon, math (LaTeX), table (markdown), shape, handPointer.

Rules:
- Keep the lesson pedagogically sound (intro → explanation → example → summary)
- Narration must be grade-appropriate spoken word
- Math content must use LaTeX notation
- Tables must use markdown pipe format
- Adjust durationSec to match narration length (approx 4 words per second)
- Return the FULL updated scenes array (not just the changed ones)
- Include a "changedSceneIds" array listing the scene ids that were modified
- Include a brief "explanation" of what changed

Respond ONLY with valid JSON matching this schema:
{
  "updatedScenes": Scene[],
  "changedSceneIds": number[],
  "explanation": string
}`;

/**
 * POST /agent/revision — edit a storyboard via natural language
 */
router.post("/agent/revision", async (req: AuthenticatedRequest, res): Promise<void> => {
  const creatorId = req.creator!.id;
  const { storyboardId, edit } = req.body as {
    storyboardId?: number;
    edit?: string;
  };

  if (!storyboardId || !edit?.trim()) {
    res.status(400).json({ error: "storyboardId and edit are required" });
    return;
  }

  // Fetch the latest storyboard revision
  const [storyboard] = await db
    .select()
    .from(storyboardsTable)
    .where(eq(storyboardsTable.id, storyboardId))
    .orderBy(storyboardsTable.revision)
    .limit(1);

  if (!storyboard) {
    res.status(404).json({ error: "Storyboard not found" });
    return;
  }

  // Verify creator ownership
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

  // Parse current scenes
  const currentScenes = storyboard.scenes as unknown as Scene[];
  if (!Array.isArray(currentScenes) || currentScenes.length === 0) {
    res.status(400).json({ error: "Storyboard has no scenes to edit" });
    return;
  }

  // Check for API key
  if (!LLM_API_KEY) {
    res.status(500).json({
      error: "No LLM API key configured. Set LLM_API_KEY or OPENAI_API_KEY.",
    });
    return;
  }

  // Safety check: block prohibited edits
  const prohibitedPatterns = [
    /violent/i, /explicit/i, /nsfw/i, /inappropriate/i,
    /gore/i, /porn/i, /hate/i, /discriminat/i,
  ];
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(edit)) {
      res.status(400).json({
        error: "Edit request contains prohibited content",
        safetyFlag: "blocked",
      });
      return;
    }
  }

  logger.info(
    { storyboardId, revision: storyboard.revision, editLen: edit.length },
    "Agent revision requested",
  );

  try {
    // Call LLM
    const response = await fetch(
      `${LLM_API_BASE.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: "system", content: REVISION_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Current storyboard scenes:\n${JSON.stringify(currentScenes, null, 2)}\n\nEdit instruction: ${edit}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
          max_tokens: 4096,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      logger.error(
        { status: response.status, body: text.slice(0, 300) },
        "Revision LLM API error",
      );
      res.status(502).json({ error: "LLM API error", detail: text.slice(0, 200) });
      return;
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const rawOutput = data.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(rawOutput);

    // Validate structure
    const { updatedScenes, changedSceneIds, explanation } = parsed as {
      updatedScenes: unknown[];
      changedSceneIds: unknown[];
      explanation: string;
    };

    if (
      !Array.isArray(updatedScenes) ||
      updatedScenes.length === 0 ||
      !Array.isArray(changedSceneIds)
    ) {
      res.status(502).json({
        error: "LLM returned invalid structure",
        raw: rawOutput.slice(0, 500),
      });
      return;
    }

    // Validate scenes against the Zod schema (partial — just scenes)
    // We validate each scene individually
    const validatedScenes: Scene[] = [];
    for (const scene of updatedScenes) {
      const result = Scene.safeParse(scene);
      if (!result.success) {
        res.status(502).json({
          error: `Scene validation failed: ${result.error.message.slice(0, 300)}`,
          raw: rawOutput.slice(0, 500),
        });
        return;
      }
      validatedScenes.push(result.data);
    }

    // Create new revision
    const newRevision = storyboard.revision + 1;
    const [updated] = await db
      .insert(storyboardsTable)
      .values({
        lessonId: storyboard.lessonId,
        briefText: storyboard.briefText,
        scenes: validatedScenes as unknown as any,
        revision: newRevision,
        status: "validated",
        safetyFlags: storyboard.safetyFlags,
        validationErrors: storyboard.validationErrors,
      })
      .returning();

    // Count elements for the response
    const elementCount = validatedScenes.reduce(
      (sum, s) => sum + (s.elements?.length ?? 0),
      0,
    );

    logger.info(
      {
        storyboardId,
        fromRevision: storyboard.revision,
        toRevision: newRevision,
        changedScenes: changedSceneIds.length,
        totalScenes: validatedScenes.length,
        totalElements: elementCount,
      },
      "Agent revision persisted",
    );

    res.json({
      revision: newRevision,
      id: updated.id,
      updatedScenes: validatedScenes,
      changedSceneIds: changedSceneIds.map(Number),
      explanation: explanation ?? "Scenes were updated based on your request.",
      elementCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err: message }, "Agent revision failed");
    res.status(500).json({ error: "Revision agent error", detail: message });
  }
});

export default router;
