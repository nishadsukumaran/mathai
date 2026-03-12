/**
 * @module api/routes/internal
 *
 * Internal service-to-service routes.
 * Protected by X-Service-Secret header, NOT by user JWT.
 *
 * Used for server → server calls where no user session exists,
 * e.g. the Next.js signup route kicking off AI topic generation
 * immediately after a new account is created.
 *
 * Env: INTERNAL_SERVICE_SECRET — shared secret between Next.js and Express.
 *      In dev, any non-empty string works (or set a real value in .env).
 */

import { Router, Request, Response, NextFunction } from "express";
import { generateAndStore } from "../services/topicAssignmentService";

const router = Router();

const INTERNAL_SECRET = process.env["INTERNAL_SERVICE_SECRET"] ?? "";

/** Validates the X-Service-Secret header. Returns false (and sends 401) on mismatch. */
function checkSecret(req: Request, res: Response): boolean {
  const provided = req.headers["x-service-secret"];
  if (!INTERNAL_SECRET || provided !== INTERNAL_SECRET) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return false;
  }
  return true;
}

// ── POST /api/internal/generate-topics ────────────────────────────────────────
// Generates and stores an AI-ordered practice topic queue for a brand-new user.
// Called by Next.js signup route immediately after account creation.
router.post(
  "/generate-topics",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!checkSecret(req, res)) return;

      const { userId } = req.body as { userId?: string };
      if (!userId) {
        res.status(400).json({ success: false, error: "userId required" });
        return;
      }

      await generateAndStore(userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
