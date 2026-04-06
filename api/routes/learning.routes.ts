/**
 * @module api/routes/learning
 *
 * Learning loop endpoints:
 *   GET  /api/learning/next           — Learning Brain recommendation
 *   POST /api/learning/record-attempt — Record any learning attempt (non-session)
 *   POST /api/learning/next-action    — Post-attempt next-step recommendation
 */

import { Router, Request, Response, NextFunction } from "express";
import { z }                    from "zod";
import { getNextAction as getNextBrainAction } from "../controllers/learningController";
import { recordAttempt }        from "../services/attemptRecorder";
import { getNextAction }        from "../services/nextActionService";

const router = Router();

// ─── Existing: Learning Brain recommendation ─────────────────────────────────

router.get("/next", getNextBrainAction);

// ─── New: Record a learning attempt from any source ──────────────────────────

const RecordAttemptSchema = z.object({
  topicId:          z.string().min(1),
  questionText:     z.string().min(1).max(1000),
  studentAnswer:    z.string().max(200),
  correctAnswer:    z.string().min(1).max(200),
  timeSpentSeconds: z.number().min(0).max(600).default(0),
  hintsUsed:        z.number().min(0).max(10).default(0),
  source:           z.enum(["ask_similar", "post_animation", "recommendation", "quick_practice"]),
});

router.post("/record-attempt", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const parsed = RecordAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const result = await recordAttempt({ userId, ...parsed.data });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ─── New: Post-attempt next action recommendation ────────────────────────────

const NextActionSchema = z.object({
  topicId:             z.string().min(1),
  isCorrect:           z.boolean(),
  consecutiveCorrect:  z.number().min(0).max(100).default(0),
  consecutiveWrong:    z.number().min(0).max(100).default(0),
  hasSceneTemplate:    z.boolean().default(false),
  source:              z.string().min(1).max(60),
});

router.post("/next-action", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const parsed = NextActionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const action = await getNextAction(userId, parsed.data);
    res.json({ success: true, data: action });
  } catch (err) { next(err); }
});

export default router;
