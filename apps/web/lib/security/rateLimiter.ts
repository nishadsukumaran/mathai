/**
 * @module lib/security/rateLimiter
 *
 * Lightweight in-memory rate limiter for auth endpoints.
 *
 * DESIGN:
 *   - Per-key sliding window counter
 *   - Configurable max attempts and window duration
 *   - Auto-cleanup of expired entries
 *   - Interface-based for future Redis replacement
 *
 * PRODUCTION NOTE:
 *   This in-memory store is per-process. In a multi-instance deployment
 *   (e.g., Vercel serverless), each function instance has its own counter.
 *   For true production rate limiting, replace with Redis/Upstash.
 *   The interface is designed to make this swap trivial.
 */

interface RateLimitEntry {
  count:   number;
  resetAt: number; // epoch ms
}

interface RateLimiterConfig {
  /** Max attempts allowed within the window */
  maxAttempts: number;
  /** Window duration in milliseconds */
  windowMs:   number;
}

/** In-memory store — keyed by composite string (e.g., "signup:192.168.1.1") */
const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * Check and consume a rate limit attempt.
 *
 * @param key    - Composite key (e.g., "signup:ip:1.2.3.4" or "pin:user:aryan-472")
 * @param config - { maxAttempts, windowMs }
 * @returns { allowed: true } or { allowed: false, retryAfterMs }
 */
export function checkRateLimit(
  key: string,
  config: RateLimiterConfig,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now   = Date.now();
  const entry = store.get(key);

  // No entry or window expired → fresh start
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  // Within window — check count
  if (entry.count >= config.maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  // Increment and allow
  entry.count++;
  return { allowed: true };
}

// ─── Pre-configured limiters for common flows ────────────────────────────────

/** Signup: 5 attempts per 15 minutes per IP */
export const SIGNUP_LIMIT: RateLimiterConfig = {
  maxAttempts: 5,
  windowMs:    15 * 60 * 1000,
};

/** Email login: 10 attempts per 15 minutes per IP */
export const LOGIN_LIMIT: RateLimiterConfig = {
  maxAttempts: 10,
  windowMs:    15 * 60 * 1000,
};

/** PIN login: 5 attempts per 10 minutes per username */
export const PIN_LOGIN_LIMIT: RateLimiterConfig = {
  maxAttempts: 5,
  windowMs:    10 * 60 * 1000,
};

/** Email verification resend: 3 attempts per 15 minutes per email */
export const VERIFY_RESEND_LIMIT: RateLimiterConfig = {
  maxAttempts: 3,
  windowMs:    15 * 60 * 1000,
};

/**
 * Extract client IP from request headers (works with Vercel, Cloudflare, proxies).
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
