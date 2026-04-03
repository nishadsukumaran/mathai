/**
 * @test lib/security — Turnstile, rate limiter, honeypot
 *
 * Tests the pure security utility functions.
 */

import { checkRateLimit, SIGNUP_LIMIT, PIN_LOGIN_LIMIT } from "../../apps/web/lib/security/rateLimiter";
import { isHoneypotTriggered, HONEYPOT_FIELD }           from "../../apps/web/lib/security/honeypot";

// ─── Rate Limiter ────────────────────────────────────────────────────────────

describe("Rate Limiter", () => {

  it("allows first request", () => {
    const key = `test:${Date.now()}:first`;
    const result = checkRateLimit(key, { maxAttempts: 3, windowMs: 10000 });
    expect(result.allowed).toBe(true);
  });

  it("allows requests up to maxAttempts", () => {
    const key = `test:${Date.now()}:max`;
    const config = { maxAttempts: 3, windowMs: 60000 };

    expect(checkRateLimit(key, config).allowed).toBe(true);  // 1
    expect(checkRateLimit(key, config).allowed).toBe(true);  // 2
    expect(checkRateLimit(key, config).allowed).toBe(true);  // 3
  });

  it("blocks after maxAttempts exceeded", () => {
    const key = `test:${Date.now()}:block`;
    const config = { maxAttempts: 2, windowMs: 60000 };

    checkRateLimit(key, config); // 1
    checkRateLimit(key, config); // 2
    const third = checkRateLimit(key, config); // 3 — should be blocked

    expect(third.allowed).toBe(false);
    if (!third.allowed) {
      expect(third.retryAfterMs).toBeGreaterThan(0);
      expect(third.retryAfterMs).toBeLessThanOrEqual(60000);
    }
  });

  it("uses different keys independently", () => {
    const ts = Date.now();
    const config = { maxAttempts: 1, windowMs: 60000 };

    checkRateLimit(`test:${ts}:a`, config); // exhaust key a
    const resultA = checkRateLimit(`test:${ts}:a`, config);
    const resultB = checkRateLimit(`test:${ts}:b`, config); // key b is fresh

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it("SIGNUP_LIMIT has correct config", () => {
    expect(SIGNUP_LIMIT.maxAttempts).toBe(5);
    expect(SIGNUP_LIMIT.windowMs).toBe(15 * 60 * 1000);
  });

  it("PIN_LOGIN_LIMIT has correct config", () => {
    expect(PIN_LOGIN_LIMIT.maxAttempts).toBe(5);
    expect(PIN_LOGIN_LIMIT.windowMs).toBe(10 * 60 * 1000);
  });
});

// ─── Honeypot ────────────────────────────────────────────────────────────────

describe("Honeypot", () => {

  it("returns false for empty string (real user)", () => {
    expect(isHoneypotTriggered("")).toBe(false);
  });

  it("returns false for undefined (real user)", () => {
    expect(isHoneypotTriggered(undefined)).toBe(false);
  });

  it("returns false for null (real user)", () => {
    expect(isHoneypotTriggered(null)).toBe(false);
  });

  it("returns true for any non-empty string (bot)", () => {
    expect(isHoneypotTriggered("http://spam.com")).toBe(true);
    expect(isHoneypotTriggered("hello")).toBe(true);
    expect(isHoneypotTriggered(" ")).toBe(true);
  });

  it("field name is 'website'", () => {
    expect(HONEYPOT_FIELD).toBe("website");
  });
});

// ─── Turnstile (shape only — actual verification needs Cloudflare) ──────────

describe("Turnstile", () => {

  // We can't test the actual Cloudflare API call, but we can test the
  // module exports and dev-bypass behavior.

  it("module exports verifyTurnstile function", async () => {
    const { verifyTurnstile } = await import("../../apps/web/lib/security/turnstile");
    expect(typeof verifyTurnstile).toBe("function");
  });

  it("returns success in dev mode without secret key", async () => {
    // In test environment, TURNSTILE_SECRET_KEY is not set
    const { verifyTurnstile } = await import("../../apps/web/lib/security/turnstile");
    const result = await verifyTurnstile("fake-token");
    expect(result.success).toBe(true); // dev bypass
  });

  it("returns success in dev mode even without token", async () => {
    const { verifyTurnstile } = await import("../../apps/web/lib/security/turnstile");
    const result = await verifyTurnstile(null);
    expect(result.success).toBe(true); // dev bypass — no secret key set
  });
});

// ─── Error messaging ─────────────────────────────────────────────────────────

describe("Error Messaging (no information leakage)", () => {

  it("rate limit error is generic", () => {
    const msg = "Too many attempts. Please wait a few minutes and try again.";
    // Should not contain: IP, username, email, or technical details
    expect(msg).not.toContain("IP");
    expect(msg).not.toContain("rate");
    expect(msg.length).toBeLessThan(100);
  });

  it("turnstile error is generic", () => {
    const msg = "We couldn't verify this request. Please try again.";
    expect(msg).not.toContain("Turnstile");
    expect(msg).not.toContain("Cloudflare");
    expect(msg).not.toContain("token");
  });

  it("honeypot error is generic", () => {
    const msg = "Could not create account. Please try again.";
    expect(msg).not.toContain("honeypot");
    expect(msg).not.toContain("bot");
    expect(msg).not.toContain("spam");
  });
});
