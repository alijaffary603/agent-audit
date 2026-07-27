import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Thrown when rate limiting cannot be configured on a deployed environment.
 * The evaluator must never run unmetered, so this fails the request closed.
 */
export class RateLimitConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitConfigurationError";
  }
}

/**
 * Thrown when the rate-limit backend itself is unreachable or errors. Also
 * fails closed: an outage must not become unlimited OpenAI spending.
 */
export class RateLimitUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitUnavailableError";
  }
}

/** Per-IP burst allowance. */
const BURST_LIMIT = 5;
/** Per-IP daily allowance. */
const DAILY_IP_LIMIT = 25;
/** Whole-application daily allowance, protecting the API budget. */
const DAILY_GLOBAL_LIMIT = 250;

/** One stable key for the global bucket; it is not derived from the request. */
const GLOBAL_IDENTIFIER = "all";

/** Identifiers are bounded so a hostile header cannot grow a Redis key. */
const MAX_IDENTIFIER_LENGTH = 64;

/** Used only when running locally without credentials. */
const DEVELOPMENT_IDENTIFIER = "local-development";

type Limiters = {
  burst: Ratelimit;
  dailyIp: Ratelimit;
  dailyGlobal: Ratelimit;
};

let limiters: Limiters | null = null;

/**
 * True on Vercel (any environment). Deployments must always be rate limited;
 * only local machines may run without a configured backend.
 */
function isDeployed(): boolean {
  return (
    process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined
  );
}

function readCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

/**
 * Builds the three limiters on first use and reuses them afterwards, so a
 * Redis client is never created per request. Credentials are read lazily,
 * which keeps builds working without them.
 */
function getLimiters(): Limiters {
  if (limiters !== null) return limiters;

  const credentials = readCredentials();
  if (credentials === null) {
    throw new RateLimitConfigurationError(
      "Rate limiting is not configured.",
    );
  }

  const redis = new Redis({
    url: credentials.url,
    token: credentials.token,
  });

  limiters = {
    burst: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(BURST_LIMIT, "60 s"),
      prefix: "agent-audit:burst",
      analytics: false,
    }),
    // Fixed windows for the daily buckets: a 24 hour sliding window would
    // retain every timestamp in the period for no practical benefit here.
    dailyIp: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(DAILY_IP_LIMIT, "24 h"),
      prefix: "agent-audit:daily-ip",
      analytics: false,
    }),
    dailyGlobal: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(DAILY_GLOBAL_LIMIT, "24 h"),
      prefix: "agent-audit:daily-global",
      analytics: false,
    }),
  };
  return limiters;
}

/** Trims a forwarded header to a single, length-bounded address. */
function normalizeAddress(value: string | null): string | null {
  if (value === null) return null;
  const first = value.split(",")[0]?.trim().toLowerCase();
  if (!first) return null;
  // Strip IPv6 brackets and any trailing port, then bound the length.
  const withoutBrackets = first.replace(/^\[|\]$/g, "");
  const withoutPort =
    withoutBrackets.split(":").length === 2
      ? withoutBrackets.split(":")[0]
      : withoutBrackets;
  const address = withoutPort.slice(0, MAX_IDENTIFIER_LENGTH);
  return address.length > 0 ? address : null;
}

/**
 * Resolves the caller's rate-limit identifier from platform-set forwarding
 * headers only. Arbitrary client-supplied identity headers are ignored, and
 * the value is never logged or returned to the client.
 */
export function getClientIdentifier(request: Request): string {
  const vercel = normalizeAddress(
    request.headers.get("x-vercel-forwarded-for"),
  );
  if (vercel !== null) return vercel;

  const forwarded = normalizeAddress(request.headers.get("x-forwarded-for"));
  if (forwarded !== null) return forwarded;

  return DEVELOPMENT_IDENTIFIER;
}

export type RateLimitDecision = {
  allowed: boolean;
  /** Safe response headers; present only when a limit was exceeded. */
  headers?: Record<string, string>;
};

function blockedHeaders(limit: number, reset: number): Record<string, string> {
  const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return {
    "Retry-After": String(retryAfterSeconds),
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
  };
}

/**
 * Applies the burst, per-IP daily, and global daily limits.
 *
 * All three run in parallel and every one must pass; the first exceeded limit
 * (in that fixed order) supplies the response headers, so the outcome is
 * deterministic. Nothing here is retried, and no identifier, key, or backend
 * error is ever exposed.
 *
 * Local development without credentials is allowed through so the project
 * stays runnable; any deployed environment fails closed instead.
 */
export async function checkRateLimits(
  identifier: string,
): Promise<RateLimitDecision> {
  let active: Limiters;
  try {
    active = getLimiters();
  } catch (error) {
    if (error instanceof RateLimitConfigurationError && !isDeployed()) {
      return { allowed: true };
    }
    throw error;
  }

  let burst, dailyIp, dailyGlobal;
  try {
    [burst, dailyIp, dailyGlobal] = await Promise.all([
      active.burst.limit(identifier),
      active.dailyIp.limit(identifier),
      active.dailyGlobal.limit(GLOBAL_IDENTIFIER),
    ]);
  } catch {
    // The backend failed: block rather than allow unmetered evaluations.
    throw new RateLimitUnavailableError(
      "The rate-limit service is unavailable.",
    );
  }

  for (const result of [burst, dailyIp, dailyGlobal]) {
    if (!result.success) {
      return {
        allowed: false,
        headers: blockedHeaders(result.limit, result.reset),
      };
    }
  }
  return { allowed: true };
}
