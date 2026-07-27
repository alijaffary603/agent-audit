import { describe, expect, it } from "vitest";

import { validateEvaluationRequest } from "@/lib/request-validation";

describe("validateEvaluationRequest", () => {
  it("returns trimmed data for a valid request", () => {
    const result = validateEvaluationRequest({
      category: "recruiting",
      agentGoal: "  Screen candidates fairly.  ",
      transcript: "  Recruiter: Hello there.\nCandidate: Hi.  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.agentGoal).toBe("Screen candidates fairly.");
    }
  });

  it("maps each invalid field to exactly one message", () => {
    const result = validateEvaluationRequest({
      category: "nope",
      agentGoal: " ",
      transcript: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "agentGoal",
        "category",
        "transcript",
      ]);
      for (const message of Object.values(result.errors)) {
        expect(typeof message).toBe("string");
        expect(message!.length).toBeGreaterThan(0);
      }
    }
  });

  it("reports only the offending field", () => {
    const result = validateEvaluationRequest({
      category: "sales",
      agentGoal: "hi",
      transcript: "x".repeat(30),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.errors)).toEqual(["agentGoal"]);
    }
  });

  it("fails safely on non-object input", () => {
    for (const input of [42, null, "text", []]) {
      expect(validateEvaluationRequest(input).success).toBe(false);
    }
  });
});
