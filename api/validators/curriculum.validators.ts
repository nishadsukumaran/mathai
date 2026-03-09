/**
 * @module api/validators/curriculum.validators
 *
 * Zod schemas for curriculum and progress API requests.
 */

import { z } from "zod";
import { Grade, Strand } from "@/types";

export const GradeParamSchema = z.object({
  grade: z.nativeEnum(Grade),
});

export const TopicParamSchema = z.object({
  topicId: z.string().min(1, "topicId is required"),
});

export const CurriculumQuerySchema = z.object({
  grade: z.nativeEnum(Grade).optional(),
  strand: z.nativeEnum(Strand).optional(),
  includeProgress: z.coerce.boolean().optional().default(false),
});

export const WeakAreasQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
});

export type GradeParam = z.infer<typeof GradeParamSchema>;
export type TopicParam = z.infer<typeof TopicParamSchema>;
export type CurriculumQuery = z.infer<typeof CurriculumQuerySchema>;
export type WeakAreasQuery = z.infer<typeof WeakAreasQuerySchema>;
