/**
 * @module api/routes/profile.routes
 *
 *   GET   /api/profile   → StudentProfileResponse
 *   PATCH /api/profile   → UpdateProfileRequest → StudentProfileResponse
 */

import { Router, Request, Response, NextFunction } from "express";
import { z }                 from "zod";
import { getProfile, updateProfile } from "../services/profileService";
import { NotFoundError }     from "../middlewares/error.middleware";

const router = Router();

// ── GET /api/profile ──────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }
    const profile = await getProfile(userId);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// ── PATCH /api/profile ────────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  name:                      z.string().min(1).max(80).optional(),
  preferredTheme:            z.string().max(32).optional(),
  learningPace:              z.enum(["slow", "standard", "fast"]).optional(),
  preferredExplanationStyle: z.enum(["visual", "step_by_step", "story", "analogy", "direct"]).optional(),
});

router.patch("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const updated = await updateProfile(userId, parsed.data);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
