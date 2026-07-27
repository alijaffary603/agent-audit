import type { EvaluationFieldErrors } from "./request-validation";

/**
 * The client-safe error contract for POST /api/evaluate, shared by the route
 * and the form client. Messages are always safe for display and never carry
 * internal details.
 */
export type EvaluationApiErrorCode =
  | "invalid_json"
  | "payload_too_large"
  | "invalid_request"
  | "configuration_error"
  | "rate_limited"
  | "rate_limit_exceeded"
  | "evaluation_failed"
  | "service_unavailable"
  | "internal_error";

export type EvaluationApiErrorBody = {
  error: {
    code: EvaluationApiErrorCode;
    message: string;
    fieldErrors?: EvaluationFieldErrors;
  };
};

type ErrorResponseOptions = {
  fieldErrors?: EvaluationFieldErrors;
  /** Extra safe headers, such as rate-limit metadata. */
  headers?: Record<string, string>;
};

/**
 * Builds a consistent JSON error response. Every response is marked
 * `Cache-Control: no-store` — evaluation traffic must never be cached.
 */
export function evaluationErrorResponse(
  status: number,
  code: EvaluationApiErrorCode,
  message: string,
  options: ErrorResponseOptions = {},
): Response {
  const { fieldErrors, headers } = options;
  const body: EvaluationApiErrorBody = {
    error:
      fieldErrors === undefined
        ? { code, message }
        : { code, message, fieldErrors },
  };
  return Response.json(body, {
    status,
    headers: { ...headers, "Cache-Control": "no-store" },
  });
}
