/**
 * @module api/validators/shared
 *
 * Reusable Zod atoms shared across multiple route validators.
 * Import these instead of duplicating inline — keeps validation consistent.
 */

import { z } from "zod";
import { Grade, Strand, Difficulty, PracticeMode } from "@/types";

// ─── Path param atoms ─────────────────────────────────────────────────────────

export const StudentIdParamSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
});

export const TopicIdParamSchema = z.object({
  topicId: z.string().min(1, "topicId is required"),
});

export const SessionIdParamSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
});

// ─── Query string atoms ───────────────────────────────────────────────────────

export const GradeQuerySchema = z.object({
  grade: z.nativeEnum(Grade).optional(),
});

export const PaginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Shared field schemas ─────────────────────────────────────────────────────

export const GradeSchema     = z.nativeEnum(Grade);
export const StrandSchema    = z.nativeEnum(Strand);
export const DifficultySchema = z.nativeEnum(Difficulty);
export const ModeSchema      = z.nativeEnum(PracticeMode);

// ─── Curriculum validators ────────────────────────────────────────────────────

export const CurriculumQuerySchema = z.object({
  grade:           z.nativeEnum(Grade).optional(),
  strand:          z.nativeEnum(Strand).optional(),
  includeProgress: z.coerce.boolean().default(false),
});
export type CurriculumQuery = z.infer<typeof CurriculumQuerySchema>;

export const WeakAreasQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
export type WeakAreasQuery = z.infer<typeof WeakAreasQuerySchema>;

// ─── Practice validators ──────────────────────────────────────────────────────

export const StartPracticeSchema = z.object({
  practiceSetId: z.string().min(1, "practiceSetId is required"),
  topicId:       z.string().min(1, "topicId is required"),
  lessonId:      z.string().optional(),
  mode:          ModeSchema.default(PracticeMode.Guided),
  difficulty:    DifficultySchema.optional(),
  questionCount: z.number().int().min(1).max(20).default(10),
});
export type StartPracticeInput = z.infer<typeof StartPracticeSchema>;

export const SubmitAnswerSchema = z.object({
  sessionId:        z.string().min(1),
  questionId:       z.string().min(1),
  answer:           z.string().min(1, "answer cannot be empty"),
  timeSpentSeconds: z.number().int().min(0).max(3600),
  hintsUsed:        z.number().int().min(0).default(0),
  confidenceBefore: z.number().int().min(1).max(5).optional(),
});
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;

export const GetHintSchema = z.object({
  sessionId:      z.string().min(1),
  questionId:     z.string().min(1),
  questionText:   z.string().min(1),
  studentMessage: z.string().max(500).default(""),
  currentAnswer:  z.string().optional(),
  hintsUsedSoFar: z.number().int().min(0).default(0),
  topicId:        z.string().min(1),
  // grade is read from the auth token server-side; client may omit it
  grade:          GradeSchema.optional(),
});
export type GetHintInput = z.infer<typeof GetHintSchema>;

export const GetExplanationSchema = z.object({
  sessionId:       z.string().min(1),
  questionId:      z.string().min(1),
  questionText:    z.string().min(1),
  studentQuestion: z.string().max(500).default(""),
  topicId:         z.string().min(1),
  // grade is read from the auth token server-side; client may omit it
  grade:           GradeSchema.optional(),
});
export type GetExplanationInput = z.infer<typeof GetExplanationSchema>;
