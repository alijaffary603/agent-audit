import { afterEach, describe, expect, it } from "vitest";

import {
  RateLimitConfigurationError,
  checkRateLimits,
  getClientIdentifier,
} from "@/lib/rate-limit";

const ENV_KEYS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "VERCEL",
  "VERCEL_ENV",
] as const;

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

afterEach(clearEnv);

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/evaluate", {
    method: "POST",
    headers,
  });
}

describe("getClientIdentifier", () => {
  it("prefers the platform header and uses only the first address", () => {
    expect(
      getClientIdentifier(
        requestWith({
          "x-vercel-forwarded-for": "198.51.100.99, 10.1.1.1",
          "x-forwarded-for": "203.0.113.5",
        }),
      ),
    ).toBe("198.51.100.99");
  });

  it("falls back to x-forwarded-for", () => {
    expect(
      getClientIdentifier(requestWith({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" })),
    ).toBe("203.0.113.5");
  });

  it("ignores arbitrary client-supplied identity headers", () => {
    const identifier = getClientIdentifier(
      requestWith({ "x-real-ip": "8.8.8.8", "x-client-id": "spoofed" }),
    );
    expect(identifier).not.toContain("8.8.8.8");
    expect(identifier).not.toContain("spoofed");
  });

  it("bounds the identifier length", () => {
    const identifier = getClientIdentifier(
      requestWith({ "x-forwarded-for": "a".repeat(500) }),
    );
    expect(identifier.length).toBeLessThanOrEqual(64);
  });
});

describe("checkRateLimits configuration policy", () => {
  it("allows local development through when no credentials are set", async () => {
    clearEnv();
    await expect(checkRateLimits("local")).resolves.toEqual({ allowed: true });
  });

  it("fails closed on a deployed environment without credentials", async () => {
    clearEnv();
    process.env.VERCEL = "1";
    await expect(checkRateLimits("deployed")).rejects.toBeInstanceOf(
      RateLimitConfigurationError,
    );
  });

  it("never puts the identifier in the configuration error", async () => {
    clearEnv();
    process.env.VERCEL_ENV = "production";
    await expect(checkRateLimits("203.0.113.5")).rejects.toSatisfy(
      (error: Error) => !error.message.includes("203.0.113.5"),
    );
  });
});
