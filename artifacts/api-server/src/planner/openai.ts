/**
 * OpenAI-compatible LLM planner adapter.
 *
 * Works with any OpenAI-compatible API including:
 *   - OpenAI (default)
 *   - CrofAI (api.crof.ai) — glm-5.2, greg-2-super, greg-2-ultra, kimi-k2.7-code
 *   - Any other provider with /v1/chat/completions endpoint
 *
 * Configure via environment variables:
 *   LLM_API_KEY       — API key (default: OPENAI_API_KEY)
 *   LLM_API_BASE      — API base URL (default: https://api.openai.com/v1)
 *   LLM_MODEL         — Model name (default: gpt-4o-mini)
 *   LLM_MAX_TOKENS    — Max tokens for response (default: 4096)
 */
import type { LessonPlanner, PlannerResult, PlannerError } from "./types";
import type { BriefInput, Storyboard, SafetyFlag } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const API_BASE = process.env["LLM_API_BASE"] ?? "https://api.openai.com/v1";
const API_KEY_ENV = process.env["LLM_API_KEY"] ? "LLM_API_KEY" : "OPENAI_API_KEY";
const API_KEY = process.env["LLM_API_KEY"] || process.env["OPENAI_API_KEY"] || "";
const MODEL = process.env["LLM_MODEL"] ?? process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";
const MAX_TOKENS = parseInt(process.env["LLM_MAX_TOKENS"] ?? "4096", 10);

// Known CrofAI model names for validation
export const CROF_MODELS = [
  "glm-5.2",
  "greg-2-super",
  "greg-2-ultra",
  "kimi-k2.7-code",
] as const;

const SYSTEM_PROMPT = `You are an expert educational lesson planner. 
Given a teacher's brief, produce a structured JSON storyboard for a hand-drawn whiteboard video.

The storyboard must include:
- title, grade, language
- A series of scenes (3-8), each with:
  - order, title
  - narration text (spoken by the voiceover)
  - durationSec (estimate based on narration length)
  - elements array: { type, content, x, y, width?, height?, drawOrder? }
    Types: text, icon, math (LaTeX), table (markdown), shape, handPointer
- An estimated total duration

Rules:
- Scenes must be pedagogically sequenced (intro → explanation → example → summary)
- Narration must be grade-appropriate and spoken-word natural
- Math content must use LaTeX notation
- Tables must use markdown pipe format
- Keep the lesson 3-8 minutes total

Respond ONLY with valid JSON matching the schema.`;

function buildRequestBody(brief: string) {
  return {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Create a lesson storyboard for this brief:\n\n${brief}` },
    ],
    response_format: { type: "json_object" } as const,
    temperature: 0.7,
    max_tokens: MAX_TOKENS,
  };
}

export function createOpenAiPlanner(): LessonPlanner {
  return {
    name: MODEL,

    async plan(input: BriefInput): Promise<PlannerResult> {
      if (!API_KEY) {
        const { PlannerError } = await import("./types");
        throw new PlannerError(
          `No API key configured. Set ${API_KEY_ENV} environment variable.`,
          "provider",
        );
      }

      const body = buildRequestBody(input.brief);
      const url = `${API_BASE.replace(/\/+$/, "")}/chat/completions`;

      logger.info({ model: MODEL, apiBase: API_BASE, maxTokens: MAX_TOKENS }, "Calling LLM planner");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        logger.error({ status: response.status, body: text.slice(0, 300) }, "LLM API error");
        const { PlannerError } = await import("./types");
        throw new PlannerError(
          `LLM API returned ${response.status}: ${text.slice(0, 200)}`,
          "provider",
        );
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        model: string;
      };

      const rawOutput = data.choices[0]?.message?.content ?? "{}";

      // Parse and validate the structured output
      const parsed = JSON.parse(rawOutput);
      const { Storyboard } = await import("@workspace/api-zod");

      const storyboardResult = Storyboard.safeParse(parsed);
      if (!storyboardResult.success) {
        const { PlannerError } = await import("./types");
        throw new PlannerError(
          `LLM output failed schema validation: ${storyboardResult.error.message.slice(0, 500)}`,
          "schema",
        );
      }

      return {
        storyboard: storyboardResult.data,
        safetyFlags: [],
        rawOutput,
        modelUsed: data.model || MODEL,
      };
    },
  };
}
