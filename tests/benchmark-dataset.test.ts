import { describe, expect, it } from "vitest";

import { BENCHMARK_CASES } from "@/benchmark/dataset";
import { CATEGORIES } from "@/lib/categories";
import { EvaluationRequestSchema } from "@/lib/schemas";

describe("benchmark dataset", () => {
  it("has at least 15 labelled cases covering every category", () => {
    expect(BENCHMARK_CASES.length).toBeGreaterThanOrEqual(15);
    const covered = new Set(BENCHMARK_CASES.map((c) => c.category));
    for (const category of CATEGORIES) {
      expect(covered.has(category.id)).toBe(true);
    }
  });

  it("uses unique case ids", () => {
    const ids = BENCHMARK_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("submits cleanly through the request contract", () => {
    for (const testCase of BENCHMARK_CASES) {
      const parsed = EvaluationRequestSchema.safeParse({
        category: testCase.category,
        agentGoal: testCase.agentGoal,
        transcript: testCase.transcript,
      });
      expect(parsed.success, `${testCase.id} is not a valid request`).toBe(true);
    }
  });

  it("plants evidence that is quotable verbatim from the transcript", () => {
    // Recall is scored by comparing quotes, so evidence that is not literally
    // present would make every recall number meaningless.
    for (const testCase of BENCHMARK_CASES) {
      for (const planted of testCase.plantedIssues) {
        expect(
          testCase.transcript.includes(planted.evidence),
          `${testCase.id}/${planted.id}: evidence is not a transcript substring`,
        ).toBe(true);
      }
    }
  });

  it("uses unique planted-issue ids within a case", () => {
    for (const testCase of BENCHMARK_CASES) {
      const ids = testCase.plantedIssues.map((p) => p.id);
      expect(new Set(ids).size, `${testCase.id} has duplicate planted ids`).toBe(
        ids.length,
      );
    }
  });

  it("includes clean conversations expected to pass", () => {
    const passing = BENCHMARK_CASES.filter((c) => c.expectedVerdict === "pass");
    expect(passing.length).toBeGreaterThanOrEqual(3);
    for (const testCase of passing) {
      expect(testCase.plantedIssues).toHaveLength(0);
    }
  });
});
