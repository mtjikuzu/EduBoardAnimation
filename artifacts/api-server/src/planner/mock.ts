import type { LessonPlanner, PlannerResult } from "./types";
import type { BriefInput } from "@workspace/api-zod";

/**
 * Dev-only mock planner that returns a canned storyboard.
 *
 * Used when OPENAI_API_KEY is not set. In the beta, replace with the
 * real OpenAI adapter once the key is provisioned in Secrets Manager.
 */
export const mockPlanner: LessonPlanner = {
  name: "mock-planner",

  async plan(input: BriefInput): Promise<PlannerResult> {
    // Simulate a short delay
    await new Promise((r) => setTimeout(r, 1500));

    const storyboard = {
      title: `Lesson: ${input.brief.slice(0, 60)}`,
      grade: "Grade 10",
      language: "English",
      objectives: "Understand the key concepts from the brief.",
      estimatedDuration: 300,
      scenes: [
        {
          id: 1,
          order: 1,
          title: "Introduction",
          narration: "Welcome to today's lesson. Let's explore this topic together.",
          durationSec: 30,
          elements: [
            {
              type: "text" as const,
              content: input.brief.slice(0, 100),
              x: 100,
              y: 200,
              drawOrder: 0,
            },
            {
              type: "shape" as const,
              content: "circle",
              x: 400,
              y: 150,
              width: 80,
              height: 80,
              drawOrder: 1,
            },
          ],
        },
        {
          id: 2,
          order: 2,
          title: "Main Content",
          narration:
            "Let us examine the main ideas in more detail. We will work through examples step by step.",
          durationSec: 120,
          elements: [
            {
              type: "text" as const,
              content: "Key point: this is the main concept we are learning today.",
              x: 100,
              y: 100,
              drawOrder: 0,
            },
            {
              type: "math" as const,
              content: "E = mc^2",
              x: 100,
              y: 300,
              drawOrder: 1,
            },
            {
              type: "table" as const,
              content: "|Term|Definition|\n|---|---|\n|X|Value A|\n|Y|Value B|",
              x: 300,
              y: 200,
              width: 300,
              height: 150,
              drawOrder: 2,
            },
          ],
        },
        {
          id: 3,
          order: 3,
          title: "Summary",
          narration:
            "To summarise, we have covered the essential concepts. Try the practice questions to test your understanding.",
          durationSec: 30,
          elements: [
            {
              type: "text" as const,
              content: "Summary of key points",
              x: 200,
              y: 200,
              drawOrder: 0,
            },
          ],
        },
      ],
      globalStyle: {
        strokeWidth: 2,
        roughness: 1,
        palette: ["#1a1a2e", "#16213e", "#0f3460", "#e94560"],
      },
    };

    return {
      storyboard,
      safetyFlags: [],
      rawOutput: JSON.stringify(storyboard, null, 2),
      modelUsed: "mock-planner-v1",
    };
  },
};
