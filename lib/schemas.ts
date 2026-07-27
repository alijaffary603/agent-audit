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
