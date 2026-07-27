import { EvaluationRequestSchema, type EvaluationRequest } from "./schemas";

/**
 * Per-field error messages for the evaluation request form. Keys derive from
 * the request contract itself, so they can never drift from the schema.
 */
export type EvaluationFieldErrors = Partial<
  Record<keyof EvaluationRequest, string>
>;

type ValidationResult =
  | { success: true; data: EvaluationRequest }
  | { success: false; errors: EvaluationFieldErrors };

/** The schema's own shape is the runtime source of truth for valid field names. */
function isRequestField(key: PropertyKey): key is keyof EvaluationRequest {
  return typeof key === "string" && key in EvaluationRequestSchema.shape;
}

/**
 * Validates arbitrary input against the evaluation request contract and maps
 * failures to one clear, UI-ready message per field — raw Zod errors never
 * leave this module. When Zod reports multiple issues for a field, the first
 * message wins.
 */
export function validateEvaluationRequest(input: unknown): ValidationResult {
  const result = EvaluationRequestSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: EvaluationFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field !== undefined && isRequestField(field) && !(field in errors)) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
