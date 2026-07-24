import type { Storyboard, SafetyFlag, BriefInput } from "@workspace/api-zod";

/**
 * Result of a planning attempt.
 */
export interface PlannerResult {
  storyboard: Storyboard;
  safetyFlags: SafetyFlag[];
  rawOutput: string;
  modelUsed: string;
}

/**
 * Error returned when the planner itself fails (network, schema, policy).
 */
export class PlannerError extends Error {
  constructor(
    message: string,
    public readonly code: "schema" | "policy" | "provider" | "timeout",
  ) {
    super(message);
    this.name = "PlannerError";
  }
}

/**
 * Provider-agnostic port for generating lesson storyboards.
 *
 * In the beta, swap the implementation by changing which adapter is wired
 * in the route handler. The adapter receives a `LessonPlannerConfig` and
 * returns a validated `PlannerResult`.
 */
export interface LessonPlanner {
  name: string;
  plan(input: BriefInput): Promise<PlannerResult>;
}
