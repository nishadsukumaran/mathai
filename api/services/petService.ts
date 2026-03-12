/**
 * @module api/services/petService
 *
 * Database operations and behaviour-score computation for the pet system.
 *
 * Public API
 * ───────────
 *   getPetForUser(userId)                  → StudentPet (upserts if missing)
 *   evaluateAndUpdatePersonality(userId)   → updated StudentPet | null (skips if not due)
 *   adoptPet(userId, petId, name?)         → StudentPet
 *   getPetResponse(userId)                 → full PetResponse including effects + insight
 *
 * Personality evaluation runs when questionsAnswered crosses a new
 * PERSONALITY_EVAL_INTERVAL multiple (currently every 50 questions).
 */

import { prisma } from "../lib/prisma";
import {
  PetPersonality,
  PersonalityHistoryEntry,
  PetBehaviorMetrics,
  PetResponse,
  StudentPet,
} from "@/types";
import {
  petPersonalityEngine,
  PET_CATALOG,
  PERSONALITY_EVAL_INTERVAL,
} from "../../services/gamification/pet_personality_engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Serialise DB row → typed StudentPet. */
function rowToPet(row: {
  id:                  string;
  userId:              string;
  petId:               string;
  petName:             string | null;
  personality:         string;
  personalityScore:    number;
  personalityHistory:  unknown;
  accuracyRate:        number;
  avgTimeSeconds:      number;
  hintUsageRate:       number;
  retrySuccessRate:    number;
  questionsAnswered:   number;
  conceptMasteryScore: number;
  lastEvaluatedAt:     Date | null;
  createdAt:           Date;
  updatedAt:           Date;
}): StudentPet {
  return {
    id:                  row.id,
    userId:              row.userId,
    petId:               row.petId,
    petName:             row.petName ?? undefined,
    personality:         row.personality as PetPersonality,
    personalityScore:    row.personalityScore,
    personalityHistory:  (row.personalityHistory as PersonalityHistoryEntry[]) ?? [],
    accuracyRate:        row.accuracyRate,
    avgTimeSeconds:      row.avgTimeSeconds,
    hintUsageRate:       row.hintUsageRate,
    retrySuccessRate:    row.retrySuccessRate,
    questionsAnswered:   row.questionsAnswered,
    conceptMasteryScore: row.conceptMasteryScore,
    lastEvaluatedAt:     row.lastEvaluatedAt ?? undefined,
    createdAt:           row.createdAt,
    updatedAt:           row.updatedAt,
  };
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Returns the student's pet, creating a default one if none exists yet.
 */
export async function getPetForUser(userId: string): Promise<StudentPet> {
  const row = await prisma.studentPet.upsert({
    where:  { userId },
    create: {
      userId,
      petId:       "spark-owl",
      personality: PetPersonality.CarefulLearner,
    },
    update: {},
  });
  return rowToPet(row);
}

/**
 * Adopts (or re-names) a pet for the student.
 * If the petId doesn't exist in the catalog, throws.
 */
export async function adoptPet(
  userId:  string,
  petId:   string,
  petName?: string
): Promise<StudentPet> {
  const catalogEntry = PET_CATALOG.find((p) => p.id === petId);
  if (!catalogEntry) {
    throw new Error(`Pet "${petId}" does not exist in the catalog.`);
  }

  const row = await prisma.studentPet.upsert({
    where:  { userId },
    create: {
      userId,
      petId,
      petName:     petName ?? null,
      personality: PetPersonality.CarefulLearner,
    },
    update: {
      petId,
      ...(petName !== undefined && { petName }),
    },
  });
  return rowToPet(row);
}

/**
 * Computes fresh behaviour metrics for a user by aggregating from:
 *   - QuestionAttempt (accuracy, time, hints, retries)
 *   - TopicProgress   (concept mastery score)
 *   - Streak          (current streak length)
 */
async function computeBehaviorMetrics(userId: string): Promise<PetBehaviorMetrics> {
  // ── Question-level metrics ──────────────────────────────────────────────────
  const [attemptAgg, streak, topicProgress] = await Promise.all([
    prisma.questionAttempt.aggregate({
      where: { userId },
      _count: { id: true },
      _avg:   { timeSpentSeconds: true, hintsUsed: true },
    }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.topicProgress.findMany({
      where:  { userId, lastPracticedAt: { not: null } },
      select: { masteryScore: true },
    }),
  ]);

  const total = attemptAgg._count.id;

  // Accuracy — count correct answers separately
  const correctCount = await prisma.questionAttempt.count({
    where: { userId, isCorrect: true },
  });

  // Hint usage — questions where hintsUsed > 0
  const hintUsedCount = await prisma.questionAttempt.count({
    where: { userId, hintsUsed: { gt: 0 } },
  });

  // Retry success — first attempt incorrect but later correct
  // Approximate: count retrySuccess events via XP reason proxy
  const retrySuccessCount = await prisma.xPEvent.count({
    where: { userId, reason: "retry_success" },
  });
  const firstAttemptWrong = await prisma.questionAttempt.count({
    where: { userId, isCorrect: false },
  });

  const accuracyRate       = total > 0 ? correctCount / total : 0;
  const avgTimeSeconds     = attemptAgg._avg.timeSpentSeconds ?? 0;
  const hintUsageRate      = total > 0 ? hintUsedCount / total : 0;
  const retrySuccessRate   = firstAttemptWrong > 0 ? retrySuccessCount / firstAttemptWrong : 0;
  const conceptMasteryScore = topicProgress.length > 0
    ? topicProgress.reduce((sum, tp) => sum + tp.masteryScore, 0) / topicProgress.length
    : 0;

  return {
    accuracyRate:        Math.min(1, accuracyRate),
    avgTimeSeconds:      avgTimeSeconds,
    hintUsageRate:       Math.min(1, hintUsageRate),
    retrySuccessRate:    Math.min(1, retrySuccessRate),
    questionsAnswered:   total,
    conceptMasteryScore: Math.min(1, conceptMasteryScore),
    streakLength:        streak?.currentStreak ?? 0,
  };
}

/**
 * Evaluates whether personality should be updated, computes metrics,
 * and persists the new personality if it changed.
 *
 * Should be called after every session completes (practiceService triggers this).
 *
 * Returns the updated StudentPet, or null if evaluation was skipped
 * (not enough new questions since the last evaluation).
 */
export async function evaluateAndUpdatePersonality(
  userId: string
): Promise<StudentPet | null> {
  const pet = await getPetForUser(userId);

  // Check if we've crossed a new evaluation milestone
  const newTotal = await prisma.questionAttempt.count({ where: { userId } });
  const prevTotal = pet.questionsAnswered;

  const shouldEval = petPersonalityEngine.shouldEvaluate(prevTotal, newTotal);
  if (!shouldEval && newTotal < PERSONALITY_EVAL_INTERVAL) {
    return null; // Not yet due
  }

  // Compute fresh metrics
  const metrics = await computeBehaviorMetrics(userId);

  // Detect new personality
  const { personality, dominantScore, reason } = petPersonalityEngine.detect(metrics);

  // Build updated history (append only if changed)
  const history: PersonalityHistoryEntry[] = Array.isArray(pet.personalityHistory)
    ? pet.personalityHistory as PersonalityHistoryEntry[]
    : [];

  const changed = personality !== pet.personality;
  if (changed) {
    history.push({
      personality,
      score:     dominantScore,
      changedAt: new Date().toISOString(),
      reason,
    });
  }

  // Persist regardless of personality change — always update metrics cache
  const updated = await prisma.studentPet.update({
    where: { userId },
    data: {
      personality,
      personalityScore:    dominantScore,
      personalityHistory:  history,
      accuracyRate:        metrics.accuracyRate,
      avgTimeSeconds:      metrics.avgTimeSeconds,
      hintUsageRate:       metrics.hintUsageRate,
      retrySuccessRate:    metrics.retrySuccessRate,
      questionsAnswered:   metrics.questionsAnswered,
      conceptMasteryScore: metrics.conceptMasteryScore,
      lastEvaluatedAt:     new Date(),
    },
  });

  if (changed) {
    console.info(
      `[petService] User ${userId}: personality changed ${pet.personality} → ${personality} (score: ${dominantScore.toFixed(1)}, reason: ${reason})`
    );
  }

  return rowToPet(updated);
}

/**
 * Full API response for the frontend — pet + catalog entry + effects + parent insight.
 */
export async function getPetResponse(userId: string, studentName: string): Promise<PetResponse> {
  const pet = await getPetForUser(userId);
  const catalog = PET_CATALOG.find((p) => p.id === pet.petId) ?? PET_CATALOG[0]!;
  const effects = petPersonalityEngine.getEffects(pet.personality);
  const insight = petPersonalityEngine.formatInsight(
    pet.personality,
    studentName,
    pet.petName ?? catalog.name
  );

  return {
    pet,
    catalog: { ...catalog },
    effects,
    insight,
  };
}
