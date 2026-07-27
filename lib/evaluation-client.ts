import type { EvaluationApiErrorCode } from "./evaluation-api";
import type { EvaluationFieldErrors } from "./request-validation";
import {
  EvaluationRequestSchema,
  EvaluationResultSchema,
  type EvaluationRequest,
  type EvaluationResult,
} from "./schemas";

/**
 * Client-side failure of an evaluation request. Carries only client-safe
 * details: a recognized server error code and field errors when available.
 * The message never contains request content, transcripts, stack traces, or
 * raw response bodies.
 */
export class EvaluationClientError extends Error {
  readonly code?: EvaluationApiErrorCode;
  readonly fieldErrors?: EvaluationFieldErrors;

  constructor(
    message: string,
    details?: { code?: EvaluationApiErrorCode; fieldErrors?: EvaluationFieldErrors },
  ) {
    super(message);
    this.name = "EvaluationClientError";
    this.code = details?.code;
    this.fieldErrors = details?.fieldErrors;
  }
}

/**
 * Every code the API contract defines. `satisfies` keeps each entry valid
 * against the union; an unrecognized code from a malformed response falls
 * back to the generic message rather than being trusted.
 */
const KNOWN_ERROR_CODES = [
  "invalid_json",
  "payload_too_large",
  "invalid_request",
  "configuration_error",
  "rate_limited",
  "rate_limit_exceeded",
  "evaluation_failed",
  "service_unavailable",
  "internal_error",
] as const satisfies readonly EvaluationApiErrorCode[];

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

/**
 * Recognizes the EvaluationApiErrorBody shape at runtime without trusting
 * arbitrary objects: the code must be a known code, the message a non-empty
 * string, and fieldErrors entries are kept only for real request fields
 * (checked against the schema's own shape) with string messages.
 */
function readApiError(payload: unknown): {
  code: EvaluationApiErrorCode;
  message: string;
  fieldErrors?: EvaluationFieldErrors;
} | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;

  const { code, message, fieldErrors } = error as {
    code?: unknown;
    message?: unknown;
    fieldErrors?: unknown;
  };
  if (
    typeof code !== "string" ||
    !(KNOWN_ERROR_CODES as readonly string[]).includes(code)
  ) {
    return null;
  }
  if (typeof message !== "string" || message.length === 0) return null;

  let safeFieldErrors: EvaluationFieldErrors | undefined;
  if (typeof fieldErrors === "object" && fieldErrors !== null) {
    const collected: EvaluationFieldErrors = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (key in EvaluationRequestSchema.shape && typeof value === "string") {
        collected[key as keyof EvaluationFieldErrors] = value;
      }
    }
    if (Object.keys(collected).length > 0) safeFieldErrors = collected;
  }

  return { code: code as EvaluationApiErrorCode, message, fieldErrors: safeFieldErrors };
}

/**
 * Sends a validated evaluation request to POST /api/evaluate and returns the
 * schema-validated EvaluationResult.
 *
 * - No automatic retries; the supplied AbortSignal is passed straight to
 *   fetch, and aborts are re-thrown untouched so cancellation stays
 *   identifiable as an AbortError.
 * - Nothing is logged.
 */
export async function requestEvaluation(
  request: EvaluationRequest,
  signal?: AbortSignal,
): Promise<EvaluationResult> {
  let response: Response;
  try {
    response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new EvaluationClientError(
      "Unable to reach the evaluation service. Please try again.",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    if (isAbortError(error)) throw error;
    payload = undefined;
  }

  if (response.ok) {
    const parsed = EvaluationResultSchema.safeParse(payload);
    if (!parsed.success) {
      throw new EvaluationClientError(
        "The evaluator returned an unexpected response. Please try again.",
      );
    }
    return parsed.data;
  }

  const serverError = readApiError(payload);
  if (serverError !== null) {
    throw new EvaluationClientError(serverError.message, {
      code: serverError.code,
      fieldErrors: serverError.fieldErrors,
    });
  }
  throw new EvaluationClientError(
    "The evaluation request failed. Please try again.",
  );
}
