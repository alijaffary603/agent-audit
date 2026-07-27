import { z } from "zod";

import { CATEGORIES, type CategoryId } from "./categories";

/**
 * Runtime list of valid category ids, derived from the single source of truth
 * in lib/categories.ts. The tuple assertion is safe because CATEGORIES is a
 * non-empty `as const` array; adding or removing a category there updates
 * this schema automatically.
 */
const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

/**
 * Evaluation request contract — the executable form of section 1 of
 * docs/evaluation-schema.md. Values are trimmed before length checks, so
 * empty and whitespace-only input is rejected.
 */
export const EvaluationRequestSchema = z.object({
  category: z.enum(CATEGORY_IDS, {
    error: "Select a supported conversation category.",
  }),
  agentGoal: z
    .string({ error: "Describe what the agent was supposed to accomplish." })
    .trim()
    .min(5, "Agent goal must be at least 5 characters.")
    .max(500, "Agent goal must be 500 characters or fewer."),
  transcript: z
    .string({ error: "Paste the conversation transcript." })
    .trim()
    .min(20, "Transcript must be at least 20 characters.")
    .max(50_000, "Transcript must be 50,000 characters or fewer."),
});

export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>;

/** Verdict identifiers — single source of truth (docs/evaluation-schema.md, section 3). */
const VERDICTS = ["pass", "needs_improvement", "fail"] as const;

/** Issue severity identifiers in ascending impact order (docs/evaluation-schema.md, section 2). */
const ISSUE_SEVERITIES = ["low", "medium", "high", "critical"] as const;

/** Every score in a result: an integer from 0 through 100. */
const ScoreSchema = z
  .number({ error: "Scores must be numbers." })
  .int("Scores must be whole numbers.")
  .min(0, "Scores cannot be below 0.")
  .max(100, "Scores cannot exceed 100.");

/**
 * Evaluation result contract — the executable form of section 2 of
 * docs/evaluation-schema.md. Unknown fields are rejected at every object
 * level ("exactly the fields below — no additions"). Structural validation
 * only: verdict/score consistency, severity ordering, and verbatim-quote
 * verification are enforced separately, not here.
 */
export const EvaluationResultSchema = z.strictObject({
  overallScore: ScoreSchema,
  verdict: z.enum(VERDICTS, {
    error: "Verdict must be pass, needs_improvement, or fail.",
  }),
  summary: z
    .string({ error: "Summary is required." })
    .trim()
    .min(10, "Summary must be at least 10 characters.")
    .max(1_000, "Summary must be 1,000 characters or fewer."),
  scores: z.strictObject({
    goalCompletion: ScoreSchema,
    communication: ScoreSchema,
    accuracy: ScoreSchema,
    professionalism: ScoreSchema,
  }),
  issues: z.array(
    z.strictObject({
      severity: z.enum(ISSUE_SEVERITIES, {
        error: "Severity must be low, medium, high, or critical.",
      }),
      quote: z
        .string({ error: "Issue quote is required." })
        .trim()
        .min(1, "Issue quotes cannot be empty.")
        .max(2_000, "Issue quotes must be 2,000 characters or fewer."),
      explanation: z
        .string({ error: "Issue explanation is required." })
        .trim()
        .min(5, "Issue explanations must be at least 5 characters.")
        .max(2_000, "Issue explanations must be 2,000 characters or fewer."),
      recommendation: z
        .string({ error: "Issue recommendation is required." })
        .trim()
        .min(5, "Issue recommendations must be at least 5 characters.")
        .max(2_000, "Issue recommendations must be 2,000 characters or fewer."),
    }),
  ),
  betterResponse: z
    .string({ error: "Better response is required." })
    .trim()
    .min(5, "Better response must be at least 5 characters.")
    .max(5_000, "Better response must be 5,000 characters or fewer."),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

/** Verdict union, derived from the single source of truth above. */
export type Verdict = (typeof VERDICTS)[number];

/** Issue severity union, derived from the single source of truth above. */
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];
