import { describe, expect, it } from "vitest";

import {
  EvaluationRequestSchema,
  EvaluationResultSchema,
} from "@/lib/schemas";

const VALID_RESULT = {
  overallScore: 24,
  verdict: "fail",
  summary: "The agent dismissed a documented duplicate charge without checking.",
  scores: { goalCompletion: 15, communication: 30, accuracy: 20, professionalism: 30 },
  issues: [
    {
      severity: "critical",
      quote: "you must be mistaken.",
      explanation: "Dismisses evidence the customer is holding.",
      recommendation: "Verify the charges before concluding anything.",
    },
  ],
  betterResponse: "Let me verify both charges before changing anything.",
};

describe("EvaluationRequestSchema", () => {
  it("trims values and accepts a well-formed request", () => {
    const parsed = EvaluationRequestSchema.parse({
      category: "sales",
      agentGoal: "  Book a demo with qualified leads.  ",
      transcript: "  Agent: Hello.\nProspect: I need pricing.  ",
    });
    expect(parsed.agentGoal).toBe("Book a demo with qualified leads.");
    expect(parsed.transcript.startsWith("Agent:")).toBe(true);
  });

  it("rejects unsupported categories", () => {
    const result = EvaluationRequestSchema.safeParse({
      category: "billing",
      agentGoal: "Resolve the issue.",
      transcript: "x".repeat(30),
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only and out-of-range lengths", () => {
    const cases = [
      { agentGoal: "   ", transcript: "x".repeat(30) },
      { agentGoal: "g".repeat(501), transcript: "x".repeat(30) },
      { agentGoal: "Valid goal.", transcript: "too short" },
      { agentGoal: "Valid goal.", transcript: "x".repeat(50_001) },
    ];
    for (const patch of cases) {
      expect(
        EvaluationRequestSchema.safeParse({ category: "sales", ...patch }).success,
      ).toBe(false);
    }
  });

  it("accepts the exact boundary lengths", () => {
    expect(
      EvaluationRequestSchema.safeParse({
        category: "sales",
        agentGoal: "g".repeat(500),
        transcript: "x".repeat(50_000),
      }).success,
    ).toBe(true);
  });
});

describe("EvaluationResultSchema", () => {
  it("accepts a valid result and an empty issues array", () => {
    expect(EvaluationResultSchema.safeParse(VALID_RESULT).success).toBe(true);
    expect(
      EvaluationResultSchema.safeParse({ ...VALID_RESULT, issues: [] }).success,
    ).toBe(true);
  });

  it("requires integer scores within 0-100", () => {
    for (const overallScore of [24.5, -1, 101]) {
      expect(
        EvaluationResultSchema.safeParse({ ...VALID_RESULT, overallScore }).success,
      ).toBe(false);
    }
    for (const accuracy of [19.9, -1, 101]) {
      expect(
        EvaluationResultSchema.safeParse({
          ...VALID_RESULT,
          scores: { ...VALID_RESULT.scores, accuracy },
        }).success,
      ).toBe(false);
    }
  });

  it("derives the verdict from the overall score", () => {
    const cases: [number, string][] = [
      [0, "fail"], [49, "fail"], [50, "needs_improvement"],
      [79, "needs_improvement"], [80, "pass"], [100, "pass"],
    ];
    for (const [overallScore, verdict] of cases) {
      expect(
        EvaluationResultSchema.safeParse({ ...VALID_RESULT, overallScore, verdict }).success,
      ).toBe(true);
    }
    const mismatch = EvaluationResultSchema.safeParse({
      ...VALID_RESULT,
      overallScore: 90,
      verdict: "fail",
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mismatch.error.issues[0].path).toEqual(["verdict"]);
    }
  });

  it("rejects unknown fields at every level", () => {
    expect(
      EvaluationResultSchema.safeParse({ ...VALID_RESULT, confidence: 0.9 }).success,
    ).toBe(false);
    expect(
      EvaluationResultSchema.safeParse({
        ...VALID_RESULT,
        scores: { ...VALID_RESULT.scores, helpfulness: 80 },
      }).success,
    ).toBe(false);
    expect(
      EvaluationResultSchema.safeParse({
        ...VALID_RESULT,
        issues: [{ ...VALID_RESULT.issues[0], turnIndex: 4 }],
      }).success,
    ).toBe(false);
  });
});
