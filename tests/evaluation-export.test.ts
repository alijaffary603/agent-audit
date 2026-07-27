import { describe, expect, it } from "vitest";

import { formatEvaluationResult } from "@/lib/evaluation-export";
import type { EvaluationResult } from "@/lib/schemas";

const RESULT: EvaluationResult = {
  overallScore: 34,
  verdict: "fail",
  summary: "The agent skipped discovery and leaned on invented urgency.",
  scores: { goalCompletion: 20, communication: 45, accuracy: 30, professionalism: 40 },
  issues: [
    {
      severity: "critical",
      quote: "Every team needs this.",
      explanation: "A universal claim with zero discovery behind it.",
      recommendation: "Ask about the team's needs first.",
    },
    {
      severity: "low",
      quote: "All of them.",
      explanation: "A vague answer to a specific question.",
      recommendation: "Name the supported integrations.",
    },
  ],
  betterResponse: "What matters most to your team?\nLet's confirm fit before pricing.",
};

describe("formatEvaluationResult", () => {
  it("is deterministic and does not mutate the result", () => {
    const snapshot = structuredClone(RESULT);
    expect(formatEvaluationResult(RESULT)).toBe(formatEvaluationResult(RESULT));
    expect(RESULT).toEqual(snapshot);
  });

  it("includes every section", () => {
    const text = formatEvaluationResult(RESULT);
    for (const section of [
      "AgentAudit conversation audit",
      "Score: 34/100",
      "Verdict: Fail",
      "SUMMARY",
      "Goal completion: 20/100",
      "Communication: 45/100",
      "Accuracy: 30/100",
      "Professionalism: 40/100",
      "EVIDENCE-BACKED FINDINGS",
      "STRONGER RESPONSE",
    ]) {
      expect(text).toContain(section);
    }
  });

  it("preserves issue order and exact quotes", () => {
    const text = formatEvaluationResult(RESULT);
    expect(text.indexOf("1. Critical")).toBeLessThan(text.indexOf("2. Low"));
    for (const issue of RESULT.issues) {
      expect(text).toContain(`Quote: ${issue.quote}`);
    }
  });

  it("preserves line breaks in the stronger response", () => {
    expect(formatEvaluationResult(RESULT)).toContain(
      "What matters most to your team?\nLet's confirm fit before pricing.",
    );
  });

  it("uses the required sentence when there are no issues", () => {
    const text = formatEvaluationResult({ ...RESULT, issues: [] });
    expect(text).toContain("No evidence-backed issues were found.");
  });
});
