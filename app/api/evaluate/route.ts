import { APIConnectionError, APIError, RateLimitError } from "openai";

import { evaluationErrorResponse } from "@/lib/evaluation-api";
import {
  EvaluationEvidenceError,
  verifyEvaluationEvidence,
} from "@/lib/evaluation-verification";
import { EvaluationResponseError, evaluateConversation } from "@/lib/evaluator";
import { OpenAIConfigurationError } from "@/lib/openai";
import {
  RateLimitConfigurationError,
  RateLimitUnavailableError,
  checkRateLimits,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { validateEvaluationRequest } from "@/lib/request-validation";

export const runtime = "nodejs";

/** Sits above the evaluator's own upstream timeout so it can abort first. */
export const maxDuration = 40;

/** Maximum request size, measured in UTF-8 bytes. */
const MAX_BODY_BYTES = 256 * 1024;

/** Upstream statuses treated as temporary service failures. */
const TEMPORARY_UPSTREAM_STATUSES = new Set([408, 409, 500, 502, 503, 504]);

/**
 * Maps every failure to a client-safe response. No upstream messages, stack
 * traces, request IDs, configuration values, model identifiers, prompts,
 * transcripts, model responses, or issue quotes ever leave this boundary.
 */
function mapEvaluationError(error: unknown): Response {
  if (
    error instanceof OpenAIConfigurationError ||
    error instanceof RateLimitConfigurationError
  ) {
    return evaluationErrorResponse(
      503,
      "configuration_error",
      "The evaluator is not configured. Please try again later.",
    );
  }
  if (
    error instanceof EvaluationResponseError ||
    error instanceof EvaluationEvidenceError
  ) {
    return evaluationErrorResponse(
      502,
      "evaluation_failed",
      "The evaluator could not produce a valid result. Please try again.",
    );
  }
  if (error instanceof RateLimitUnavailableError) {
    return evaluationErrorResponse(
      503,
      "service_unavailable",
      "The evaluation service is temporarily unavailable. Please try again.",
    );
  }
  if (error instanceof RateLimitError) {
    return evaluationErrorResponse(
      429,
      "rate_limited",
      "The evaluator is busy. Please wait a moment and try again.",
    );
  }
  // APIConnectionTimeoutError extends APIConnectionError, so one check
  // covers connection failures and timeouts.
  if (error instanceof APIConnectionError) {
    return evaluationErrorResponse(
      503,
      "service_unavailable",
      "The evaluation service is temporarily unavailable. Please try again.",
    );
  }
  if (error instanceof APIError) {
    if (
      typeof error.status === "number" &&
      TEMPORARY_UPSTREAM_STATUSES.has(error.status)
    ) {
      return evaluationErrorResponse(
        503,
        "service_unavailable",
        "The evaluation service is temporarily unavailable. Please try again.",
      );
    }
    return evaluationErrorResponse(
      502,
      "evaluation_failed",
      "The evaluator could not complete the request. Please try again.",
    );
  }
  return evaluationErrorResponse(
    500,
    "internal_error",
    "Something went wrong while evaluating the conversation.",
  );
}

export async function POST(request: Request): Promise<Response> {
  // Reject unsupported media types before touching the body, rate limiter,
  // or evaluator. Parameters such as a charset are allowed.
  const contentType = request.headers.get("content-type");
  const mediaType = contentType?.split(";")[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    return evaluationErrorResponse(
      415,
      "invalid_json",
      "The request must use application/json.",
    );
  }

  // Reject oversized payloads from the declared length before reading the
  // body — but never trust Content-Length as the only size check.
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null && /^\d+$/.test(declaredLength)) {
    if (Number(declaredLength) > MAX_BODY_BYTES) {
      return evaluationErrorResponse(
        413,
        "payload_too_large",
        "The request is too large.",
      );
    }
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return evaluationErrorResponse(
      400,
      "invalid_json",
      "The request body could not be read.",
    );
  }

  // Actual size check in UTF-8 bytes, not JavaScript characters.
  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return evaluationErrorResponse(
      413,
      "payload_too_large",
      "The request is too large.",
    );
  }

  // Empty and whitespace-only bodies fail JSON.parse, so they map to
  // invalid_json here. The malformed text itself is never echoed anywhere.
  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return evaluationErrorResponse(
      400,
      "invalid_json",
      "The request body must be valid JSON.",
    );
  }

  const validation = validateEvaluationRequest(payload);
  if (!validation.success) {
    return evaluationErrorResponse(
      400,
      "invalid_request",
      "Check the highlighted fields and try again.",
      { fieldErrors: validation.errors },
    );
  }

  // Only well-formed, schema-valid requests consume the allowance, and every
  // limit must pass before the evaluator is reached.
  try {
    const decision = await checkRateLimits(getClientIdentifier(request));
    if (!decision.allowed) {
      return evaluationErrorResponse(
        429,
        "rate_limit_exceeded",
        "You have reached the audit limit. Please try again later.",
        { headers: decision.headers },
      );
    }
  } catch (error) {
    return mapEvaluationError(error);
  }

  try {
    const result = await evaluateConversation(validation.data);
    const verified = verifyEvaluationEvidence(
      result,
      validation.data.transcript,
    );
    return Response.json(verified, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return mapEvaluationError(error);
  }
}
