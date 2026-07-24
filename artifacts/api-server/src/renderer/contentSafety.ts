import type { SafetyFlag } from "@workspace/api-zod";

/**
 * Content safety checks for lesson briefs and storyboards.
 *
 * In the beta, this is a lightweight keyword/pattern-based filter.
 * It rejects clearly prohibited content and flags high-risk topics
 * for human review. The thresholds are tuned conservatively for
 * the secondary-school audience.
 */

// Topics that block generation entirely
const BLOCKED_PATTERNS = [
  /violence\s*against/i,
  /explicit\s*sexual/i,
  /illegal\s+drug\s+sale/i,
  /weapon\s+manufactur/i,
  /hate\s+speech/i,
  /self[- ]harm/i,
  /suicide\s*method/i,
];

// Topics that flag for review but don't block
const WARNING_PATTERNS = [
  /evolution/i,
  /human\s+reproduction/i,
  /climate\s+change\s+debate/i,
  /political\s+party/i,
  /religious\s+belief/i,
  /controvers/i,
];

/**
 * Check a lesson brief for safety concerns.
 * Returns a list of safety flags. A "block" severity means
 * the brief should not be submitted to the planner.
 */
export function checkBriefSafety(brief: string): SafetyFlag[] {
  const flags: SafetyFlag[] = [];

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(brief)) {
      flags.push({
        category: "content_policy",
        severity: "block",
        message: `Brief contains content prohibited by our content policy (matched: "${pattern.source.slice(0, 40)}").`,
      });
    }
  }

  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(brief)) {
      flags.push({
        category: "sensitive_topic",
        severity: "warning",
        message: `This brief touches on a sensitive topic that may require review (matched: "${pattern.source.slice(0, 40)}").`,
      });
    }
  }

  return flags;
}

/**
 * Check a storyboard for calculation errors by running
 * a simple expression evaluator over math elements.
 * Returns warnings for potentially incorrect math.
 */
export function checkMathElements(
  elements: Array<{ type: string; content: string }>,
): SafetyFlag[] {
  const flags: SafetyFlag[] = [];

  for (const el of elements) {
    if (el.type === "math" && el.content.includes("=")) {
      const parts = el.content.split("=");
      if (parts.length === 2) {
        const expr = parts[0].trim();
        const claimed = parts[1].trim();
        // Simple numeric check
        try {
          const evalResult = evaluateSimpleExpression(expr);
          const claimedNum = parseFloat(claimed);
          if (!isNaN(evalResult) && !isNaN(claimedNum)) {
            const diff = Math.abs(evalResult - claimedNum);
            if (diff > 0.01) {
              flags.push({
                category: "calculation_error",
                severity: "warning",
                message: `Potential calculation error: "${expr}" evaluates to approximately ${evalResult.toFixed(4)}, not "${claimed}".`,
              });
            }
          }
        } catch {
          // Complex expressions are skipped; they need SymPy in production
        }
      }
    }
  }

  return flags;
}

function evaluateSimpleExpression(expr: string): number {
  // Safe arithmetic evaluator for basic expressions
  const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, "");
  if (!sanitized) throw new Error("Empty expression");
  // Use Function constructor for evaluation (safe due to sanitization)
  return new Function(`return (${sanitized})`)();
}
