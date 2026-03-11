/**
 * @module api/routes/tutor.routes
 *
 * Ask MathAI — standalone open-ended Q&A endpoint.
 * All requests go through Vercel AI Gateway via askMathAIService.
 *
 *   POST /api/tutor/ask
 *   body: { question, grade?, context?, studentName? }
 *
 * This replaces the old session-bound tutorService stub.
 * For in-session hints/explanations, see practiceController.getPracticeHint().
 */

import { Router, Request, Response, NextFunction } from "express";
import { z }                   from "zod";
import { askMathAIService }    from "../../ai/services/askMathAIService";
import { getProfile }          from "../services/profileService";
import type { Grade, ExplanationStyle, LearningPace } from "@mathai/shared-types";

const router = Router();

const AskSchema = z.object({
  question:    z.string().min(1).max(1000),
  grade:       z.string().regex(/^G\d+$/).optional(), // falls back to student's profile grade
  context:     z.string().max(500).optional(),
  studentName: z.string().max(50).optional(),
  /** Optional profile fields for personalisation */
  profile: z.object({
    confidenceLevel:           z.number().min(0).max(100).optional(),
    preferredExplanationStyle: z.enum(["visual", "step_by_step", "story", "analogy", "direct"]).optional(),
    learningPace:              z.enum(["slow", "standard", "fast"]).optional(),
  }).optional(),
});

router.post("/ask", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const parsed = AskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const { question, grade, context, studentName, profile } = parsed.data;

    // Resolve grade: use body grade if provided, otherwise fall back to student profile
    let resolvedGrade = grade as Grade | undefined;
    if (!resolvedGrade) {
      try {
        const studentProfile = await getProfile(userId);
        resolvedGrade = studentProfile.grade as Grade;
      } catch {
        resolvedGrade = "G4" as Grade; // last resort default
      }
    }

    const response = await askMathAIService.answer({
      question,
      grade:       resolvedGrade,
      context,
      studentName,
      userId,       // injects full learning memory into the AI prompt
      profile: profile ? {
        confidenceLevel:           profile.confidenceLevel           ?? 50,
        preferredExplanationStyle: (profile.preferredExplanationStyle ?? "step_by_step") as ExplanationStyle,
        learningPace:              (profile.learningPace              ?? "standard") as LearningPace,
      } : undefined,
    });

    res.json({ success: true, data: response });
  } catch (err) { next(err); }
});

export default router;
