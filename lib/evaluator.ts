import "server-only";

import { zodTextFormat } from "openai/helpers/zod";

import { buildEvaluatorPrompt } from "./evaluator-prompt";
import { getOpenAIClient, getOpenAIModel } from "./openai";
import {
  EvaluationResultSchema,
  type EvaluationRequest,
  type EvaluationResult,
} from "./schemas";

/**
 * Thrown when the model response contains no parsed evaluation result. The
 * message is deliberately generic: it must never carry transcript content,
 * prompts, or model output.
 */
/** Upstream request budget, kept below the route's own maxDuration. */
const EVALUATION_TIMEOUT_MS = 30_000;

export class EvaluationResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationResponseError";
  }
}

/**
 * Runs one conversation evaluation through the OpenAI Responses API.
 *
 * Security and privacy properties:
 * - Trusted instructions and untrusted input stay in separate request fields
 *   (`instructions` vs `input`) — they are never concatenated back together.
 * - Output is constrained by a strict Zod-backed text format generated from
 *   EvaluationResultSchema, and the SDK parses/validates the reply against
 *   that same schema; no free-form JSON.parse of model text.
 * - `store: false` disables Responses API application-state storage for this
 *   request. Separate OpenAI platform abuse-monitoring and organizational
 *   data-retention policies may still apply, so zero data retention must not
 *   be claimed on the basis of this flag alone.
 * - AgentAudit itself does not log or persist the request, prompt,
 *   transcript, or response — no keys, goals, transcripts, prompts, or
 *   response bodies are written anywhere by this module.
 *
 * Upstream OpenAI errors are not normalized here; the API route owns that
 * boundary.
 */
export async function evaluateConversation(
  request: EvaluationRequest,
): Promise<EvaluationResult> {
  const prompt = buildEvaluatorPrompt(request);

  const response = await getOpenAIClient().responses.parse(
    {
      model: getOpenAIModel(),
      instructions: prompt.instructions,
      input: prompt.input,
      store: false,
      text: {
        format: zodTextFormat(EvaluationResultSchema, "agent_audit_evaluation"),
      },
    },
    // Aborts the upstream request rather than holding the route open; the
    // SDK surfaces this as a connection timeout, which the route maps to its
    // temporary-unavailability response.
    { timeout: EVALUATION_TIMEOUT_MS },
  );

  const result = response.output_parsed;
  if (result === null || result === undefined) {
    throw new EvaluationResponseError(
      "The evaluator returned no parsable result.",
    );
  }
  return result;
}
