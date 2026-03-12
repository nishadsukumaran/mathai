/**
 * @module api/controllers/practiceController
 *
 * POST /api/practice/start       — start a session
 * POST /api/practice/submit      — submit an answer
 * POST /api/practice/hint        — get a hint from the AI tutor
 * POST /api/practice/explanation — get a full explanation
 */

import { Request, Response, NextFunction } from "express";
import {
  StartPracticeSchema,
  SubmitAnswerSchema,
  GetHintSchema,
  GetExplanationSchema,
} from "../validators/shared.validators";
import {
  startSession,
  submitAnswer,
  getNextQuestion,
  getTutorHelp,
} from "../services/practiceService";
import { send, sendCreated } from "../lib/response";
import { HelpMode, Grade } from "@/types";

/** POST /api/practice/start */
export async function startPractice(req: Request, res: Response, next: NextFunction) {
  try {
    const body   = StartPracticeSchema.parse(req.body);
    const userId = req.student!.id;
    const grade  = (req.student!.grade ?? "G4") as Grade;

    const result = await startSession({
      userId,
      topicId:       body.topicId,
      lessonId:      body.lessonId,
      practiceSetId: body.practiceSetId,
      mode:          body.mode as any,
      difficulty:    body.difficulty as any,
      questionCount: body.questionCount,
      grade,
    });

    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

/** POST /api/practice/submit */
export async function submitPracticeAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const body = SubmitAnswerSchema.parse(req.body);

    const result = await submitAnswer({
      sessionId:        body.sessionId,
      questionId:       body.questionId,
      studentAnswer:    body.answer,
      timeSpentSeconds: body.timeSpentSeconds,
      hintsUsed:        body.hintsUsed,
      hintMaxLevel:     body.hintMaxLevel,
      confidenceBefore: body.confidenceBefore,
    });

    let nextQuestion = null;
    if (!result.sessionComplete) {
      nextQuestion = await getNextQuestion(body.sessionId).catch(() => null);
    }

    send(res, { ...result, nextQuestion });
  } catch (err) {
    next(err);
  }
}

/** POST /api/practice/hint */
export async function getPracticeHint(req: Request, res: Response, next: NextFunction) {
  try {
    const body   = GetHintSchema.parse(req.body);
    const userId = req.student!.id;
    const grade  = (req.student!.grade ?? "G4") as Grade;

    const hintsUsed = body.hintsUsedSoFar;
    const helpMode  = hintsUsed === 0
      ? HelpMode.Hint1
      : hintsUsed === 1
        ? HelpMode.Hint2
        : HelpMode.NextStep;

    const response = await getTutorHelp({
      sessionId:     body.sessionId,
      userId,
      topicId:       body.topicId,
      grade,
      questionText:  body.questionText,
      studentAnswer: body.currentAnswer,
      helpMode,
      hintsUsed:     body.hintsUsedSoFar,
    });

    send(res, response);
  } catch (err) {
    next(err);
  }
}

/** POST /api/practice/explanation */
export async function getPracticeExplanation(req: Request, res: Response, next: NextFunction) {
  try {
    const body   = GetExplanationSchema.parse(req.body);
    const userId = req.student!.id;
    const grade  = (req.student!.grade ?? "G4") as Grade;

    const response = await getTutorHelp({
      sessionId:    body.sessionId,
      userId,
      topicId:      body.topicId,
      grade,
      questionText: body.questionText,
      helpMode:     HelpMode.ExplainFully,
      hintsUsed:    3,
    });

    send(res, response);
  } catch (err) {
    next(err);
  }
}
