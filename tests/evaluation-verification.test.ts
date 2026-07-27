import { describe, expect, it } from "vitest";

import {
  EvaluationEvidenceError,
  verifyEvaluationEvidence,
} from "@/lib/evaluation-verification";
import type { EvaluationResult } from "@/lib/schemas";

const TRANSCRIPT = [
  "Customer: I was charged twice this month.",
  "Agent: I don't see a duplicate charge, so you must be mistaken.",
  "Agent: Our billing system never makes duplicate charges.",
].join("\n");

function result(issues: EvaluationResult["issues"]): EvaluationResult {
  return {
    overallScore: 24,
    verdict: "fail",
    summary: "The agent dismissed the customer's documented duplicate charge.",
    scores: { goalCompletion: 15, communication: 30, accuracy: 20, professionalism: 30 },
    issues,
    betterResponse: "Let me verify both charges before changing anything.",
  };
}

const issue = (severity: EvaluationResult["issues"][number]["severity"], quote: string) => ({
  severity,
  quote,
  explanation: "Explanation of the problem in this moment.",
  recommendation: "What the agent should have done instead.",
});

describe("verifyEvaluationEvidence", () => {
  it("returns the original object untouched when every rule holds", () => {
    const input = result([
      issue("critical", "you must be mistaken."),
      issue("medium", "Our billing system never makes duplicate charges."),
    ]);
    expect(verifyEvaluationEvidence(input, TRANSCRIPT)).toBe(input);
  });

  it("accepts an empty issues array", () => {
    const input = result([]);
    expect(verifyEvaluationEvidence(input, TRANSCRIPT)).toBe(input);
  });

  it("rejects the whole evaluation when a quote is fabricated", () => {
    const input = result([issue("critical", "THIS WAS NEVER SAID.")]);
    expect(() => verifyEvaluationEvidence(input, TRANSCRIPT)).toThrow(
      EvaluationEvidenceError,
    );
  });

  it("matches quotes case-sensitively", () => {
    const input = result([issue("critical", "YOU MUST BE MISTAKEN.")]);
    expect(() => verifyEvaluationEvidence(input, TRANSCRIPT)).toThrow(
      EvaluationEvidenceError,
    );
  });

  it("rejects issues that are not ordered by descending severity", () => {
    const input = result([
      issue("medium", "you must be mistaken."),
      issue("critical", "Our billing system never makes duplicate charges."),
    ]);
    expect(() => verifyEvaluationEvidence(input, TRANSCRIPT)).toThrow(
      EvaluationEvidenceError,
    );
  });

  it("allows equal adjacent severities", () => {
    const input = result([
      issue("high", "you must be mistaken."),
      issue("high", "Our billing system never makes duplicate charges."),
    ]);
    expect(() => verifyEvaluationEvidence(input, TRANSCRIPT)).not.toThrow();
  });

  it("never leaks transcript content in the error message", () => {
    const input = result([issue("critical", "THIS WAS NEVER SAID.")]);
    try {
      verifyEvaluationEvidence(input, TRANSCRIPT);
      throw new Error("expected a rejection");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain("mistaken");
      expect(message).not.toContain("THIS WAS NEVER SAID.");
    }
  });
});
