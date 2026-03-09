/**
 * @module api/validators/practice.validators
 *
 * Zod schemas for all practice-related API request validation.
 * Every controller uses these schemas before touching any service.
 *
 * PATTERN: parse early, trust throughout.
 * Once a request passes schema validation, downstream code can assume types are correct.
 */

import { z } from "zod";
import { PracticeMode, Difficulty, Grade } from "@/types";

// ─── Shared Atoms ─────────────────────────────────────────────────────────────

const PracticeModeSchema = z.nativeEnum(PracticeMode);
const DifficultySchema = z.nativeEnum(Difficulty);
const GradeSchema = z.nativeEnum(Grade);

// ─── POST /practice/start ──────────────────────────────────────────────────────

export const StartPracticeSchema = z.object({
  lessonId: z.string().min(1, "lessonId is required"),
  topicId: z.string().min(1, "topicId is required"),
  mode: PracticeModeSchema.default(PracticeMode.Guided),
  difficulty: DifficultySchema.optional(),
  questionCount: z.number().int().min(1).max(20).optional(),
});

export type StartPracticeInput = z.infer<typeof StartPracticeSchema>;

// ─── POST /practice/submit ────────────────────────────────────────────────────

export const SubmitAnswerSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  questionId: z.string().min(1, "questionId is required"),
  answer: z.string().min(1, "answer is required"),
  timeSpentSeconds: z.number().min(0).max(3600),
  attemptCount: z.number().int().min(1),
});

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;

// ─── POST /practice/hint ──────────────────────────────────────────────────────

export const GetHintSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  studentMessage: z.string().max(500).optional().default(""),
  currentAnswer: z.string().optional(),
});

export type GetHintInput = z.infer<typeof GetHintSchema>;

// ─── POST /practice/explanation ───────────────────────────────────────────────

export const GetExplanationSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  studentQuestion: z.string().max(500),
});

export type GetExplanationInput = z.infer<typeof GetExplanationSchema>;

// ─── GET /practice/session/:sessionId ─────────────────────────────────────────

export const SessionParamSchema = z.object({
  sessionId: z.string().min(1),
});

export type SessionParam = z.infer<typeof SessionParamSchema>;
