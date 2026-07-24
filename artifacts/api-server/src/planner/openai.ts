import type { LessonPlanner, PlannerResult, PlannerError } from "./types";
import type { BriefInput, Storyboard, SafetyFlag } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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
    model: process.env["OPENAI_MODEL"] || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Create a lesson storyboard for this brief:\n\n${brief}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4096,
  };
}

export function createOpenAiPlanner(): LessonPlanner {
  return {
    name: "openai-planner",

    async plan(input: BriefInput): Promise<PlannerResult> {
      const apiKey = process.env["OPENAI_API_KEY"];
      if (!apiKey) {
        const { PlannerError } = await import("./types");
        throw new PlannerError(
          "OPENAI_API_KEY is not configured",
          "provider",
        );
      }

      const body = buildRequestBody(input.brief);

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        logger.error({ status: response.status, body: text }, "OpenAI API error");
        const { PlannerError } = await import("./types");
        throw new PlannerError(
          `OpenAI API returned ${response.status}: ${text.slice(0, 200)}`,
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
      const { Storyboard, SafetyFlag } = await import("@workspace/api-zod");

      const storyboardResult = Storyboard.safeParse(parsed);
      if (!storyboardResult.success) {
        const { PlannerError } = await import("./types");
        throw new PlannerError(
          `OpenAI output failed schema validation: ${storyboardResult.error.message.slice(0, 500)}`,
          "schema",
        );
      }

      return {
        storyboard: storyboardResult.data,
        safetyFlags: [],
        rawOutput,
        modelUsed: data.model || body.model,
      };
    },
  };
}
