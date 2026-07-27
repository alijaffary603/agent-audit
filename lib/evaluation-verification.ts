import type { EvaluationResult, IssueSeverity } from "./schemas";

/**
 * Thrown when a model result fails evidence verification. Messages are
 * deliberately generic: they must never contain transcript content, issue
 * quotes, prompts, or model output.
 */
export class EvaluationEvidenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationEvidenceError";
  }
}

/**
 * Severity ranking, highest first. Typed as a complete Record over the
 * IssueSeverity union from the contract, so a severity change in
 * lib/schemas.ts is a compile error here rather than silent drift.
 */
const SEVERITY_RANK: Record<IssueSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/**
 * Enforces the contract's evidence rules on a model result:
 *
 * - every issue quote must be an exact, case-sensitive substring of the
 *   original transcript (the mechanical hallucination guard), and
 * - issues must be ordered from highest to lowest severity (equal adjacent
 *   severities are valid).
 *
 * The result is never trimmed, normalized, altered, or repaired: a valid
 * result is returned unchanged (same object), and an invalid one throws
 * EvaluationEvidenceError. Pure function — no Next.js, no OpenAI, no I/O.
 */
export function verifyEvaluationEvidence(
  result: EvaluationResult,
  transcript: string,
): EvaluationResult {
  for (const issue of result.issues) {
    if (!transcript.includes(issue.quote)) {
      throw new EvaluationEvidenceError(
        "An issue quote is not an exact substring of the transcript.",
      );
    }
  }

  for (let index = 1; index < result.issues.length; index += 1) {
    const previous = SEVERITY_RANK[result.issues[index - 1].severity];
    const current = SEVERITY_RANK[result.issues[index].severity];
    if (current > previous) {
      throw new EvaluationEvidenceError(
        "Issues are not ordered from highest to lowest severity.",
      );
    }
  }

  return result;
}
