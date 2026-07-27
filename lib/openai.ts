import "server-only";

import OpenAI from "openai";

/**
 * Thrown when required OpenAI server configuration is missing or blank, so
 * the API route can distinguish configuration problems from upstream OpenAI
 * failures.
 */
export class OpenAIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIConfigurationError";
  }
}

function requireEnv(name: "OPENAI_API_KEY" | "OPENAI_MODEL"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new OpenAIConfigurationError(
      `${name} is not configured. Set it in the server environment (see .env.example).`,
    );
  }
  return value;
}

let client: OpenAI | null = null;

/**
 * Returns the process-wide OpenAI client, creating it on first call.
 *
 * Initialization is deliberately lazy: the key is read only when a request
 * actually needs the client, so builds and module imports succeed without a
 * configured key. The key is never exported or logged. No API request is made
 * here — constructing the client performs no network activity.
 */
export function getOpenAIClient(): OpenAI {
  if (client === null) {
    // SDK logging stays off: transcripts are potentially sensitive, so no
    // request/response bodies may ever reach logs. Future error handling may
    // log safe metadata (e.g. a request ID) but never prompts, transcripts,
    // keys, or complete model responses.
    client = new OpenAI({
      apiKey: requireEnv("OPENAI_API_KEY"),
      logLevel: "off",
    });
  }
  return client;
}

/**
 * Returns the configured evaluator model identifier. Read from the server
 * environment on every call — no model id is hardcoded in application code.
 */
export function getOpenAIModel(): string {
  return requireEnv("OPENAI_MODEL");
}
