/**
 * api/middlewares/rateLimit.middleware.ts
 *
 * In-memory rate limiting using express-rate-limit.
 * For production with multiple instances, swap to a Redis store.
 */

import rateLimit from "express-rate-limit";

// General API rate limit: 200 requests per minute per IP
export const rateLimitMiddleware = rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
  },
});

// Stricter limit for auth endpoints: 10 requests per minute per IP
export const authRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many authentication attempts. Please wait." },
  },
});
