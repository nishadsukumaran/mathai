/**
 * @module api/routes/tutor.routes
 *
 * Standalone "Ask MathAI" endpoint — not tied to a practice session.
 *
 *   POST /api/tutor/ask
 *   body: { question, helpMode, grade?, context? }
 */

import { Router, Request, Response, NextFunction } from "express";
import { z }               from "zod";
import { tutorService }    from "../../ai/tutor/tutor_service";
import { HelpMode, Grade } from "../../types/index";

const router = Router();

const HELP_MODE_MAP: Record<string, HelpMode> = {
  hint_1:          HelpMode.Hint1,
  hint_2:          HelpMode.Hint2,
  next_step:       HelpMode.NextStep,
  explain_fully:   HelpMode.ExplainFully,
  teach_concept:   HelpMode.TeachConcept,
  similar_example: HelpMode.SimilarExample,
};

const AskSchema = z.object({
  question: z.string().min(1).max(1000),
  helpMode: z.enum(["hint_1", "hint_2", "next_step", "explain_fully", "teach_concept", "similar_example"]),
  grade:    z.string().regex(/^G\d+$/).optional().default("G4"),
  context:  z.string().max(500).optional(),
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

    const { question, helpMode, grade, context } = parsed.data;
    const internalMode = HELP_MODE_MAP[helpMode] ?? HelpMode.TeachConcept;

    const response = await tutorService.handleHelpRequest({
      sessionId:    "ask-standalone",
      userId,
      topicId:      "general",
      questionText: question,
      helpMode:     internalMode,
      grade:        grade as Grade,
      hintsUsed:    0,
      studentAnswer: context,
    });

    res.json({
      success: true,
      data: {
        helpMode,
        encouragement:  response.encouragement,
        content:        response.content,
        visualPlan:     response.visualPlan,
        similarExample: response.similarExample,
      },
    });
  } catch (err) { next(err); }
});

export default router;
