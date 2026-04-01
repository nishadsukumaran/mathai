/**
 * @module api/services/learningBrain
 *
 * The Learning Brain Engine — central decision layer for MathAI.
 *
 * Evaluates the student's complete learning state and produces a single
 * structured recommendation for what the student should do next.
 *
 * Connects: memory, mastery, performance, recommendation, and motivation.
 *
 * USAGE:
 *   import { getNextLearningAction } from "./learningBrain";
 *   const action = await getNextLearningAction(userId);
 */

import { prisma }              from "../../lib/prisma";
import { studentMemoryService } from "../../../ai/services/studentMemoryService";
import { extractSignals }      from "./signals";
import { decideLearningAction } from "./scorer";
import type { TopicProgressRow } from "./signals";
import type { LearningNextAction } from "@mathai/shared-types";

/**
 * Fetch all inputs, extract signals, and produce the next best learning action.
 *
 * This is the single entry point for the Learning Brain. It:
 *   1. Loads the student's memory snapshot (cached, max 2h old)
 *   2. Fetches all TopicProgress rows
 *   3. Resolves topic display names
 *   4. Extracts typed signals from raw data
 *   5. Runs the decision scorer
 *   6. Returns a fully-formed LearningNextAction
 *
 * Returns null if there's genuinely nothing to recommend (no topics available).
 */
export async function getNextLearningAction(
  userId: string,
): Promise<LearningNextAction | null> {
  // ── 1. Parallel data fetch ──────────────────────────────────────────────
  const [snapshot, allProgress] = await Promise.all([
    studentMemoryService.getSnapshot(userId),
    prisma.topicProgress.findMany({ where: { userId } }),
  ]);

  // ── 2. Build topic name lookup ──────────────────────────────────────────
  // Combine names from snapshot (already resolved) with DB fallback
  const topicNames = new Map<string, string>();

  // Names from snapshot's weak/strong topics
  for (const t of snapshot.weakTopics) {
    topicNames.set(t.topicId, t.topicName);
  }
  for (const t of snapshot.strongTopics) {
    topicNames.set(t.topicId, t.topicName);
  }
  for (const p of snapshot.activeMistakePatterns) {
    if (p.topicName) topicNames.set(p.topicId, p.topicName);
  }
  for (const s of snapshot.recentSessions) {
    if (s.topicName) topicNames.set(s.topicId, s.topicName);
  }

  // Fill gaps from DB Topic table
  const missingIds = allProgress
    .filter((p) => !topicNames.has(p.topicId))
    .map((p) => p.topicId);

  if (missingIds.length > 0) {
    try {
      const dbTopics = await prisma.topic.findMany({
        where:  { id: { in: missingIds } },
        select: { id: true, name: true },
      });
      for (const t of dbTopics) {
        topicNames.set(t.id, t.name);
      }
    } catch {
      // Topic table may not exist in all environments
    }
  }

  // ── 3. Map Prisma rows to signal-compatible shape ───────────────────────
  const progressRows: TopicProgressRow[] = allProgress.map((p) => ({
    topicId:          p.topicId,
    masteryScore:     p.masteryScore,
    accuracyRate:     p.accuracyRate,
    lastPracticedAt:  p.lastPracticedAt,
    isUnlocked:       p.isUnlocked,
    isMastered:       p.isMastered,
    completionPercent: p.completionPercent,
  }));

  // ── 4. Extract typed signals ────────────────────────────────────────────
  const signals = extractSignals(progressRows, topicNames, snapshot);

  // ── 5. Run decision scorer ──────────────────────────────────────────────
  return decideLearningAction(signals);
}

// Re-exports for testing
export { extractSignals } from "./signals";
export { decideLearningAction } from "./scorer";
export type { ExtractedSignals, TopicSignal, StudentSignals, TopicProgressRow } from "./signals";
