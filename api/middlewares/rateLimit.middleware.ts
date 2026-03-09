/**
 * api/middlewares/rateLimit.middleware.ts
 *
 * Lightweight rate-limiting stub.
 * Replace with `express-rate-limit` + Redis store before going to production.
 *
 * Current behaviour: pass-through in all environments.
 * TODO: wire up express-rate-limit once Redis is provisioned.
 */

import type { Request, Response, NextFunction } from "express";

// Placeholder — swap this for:
// import rateLimit from "express-rate-limit";
// export const rateLimitMiddleware = rateLimit({ windowMs: 60_000, max: 100 });

export function rateLimitMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  // No-op until Redis is available
  next();
}
