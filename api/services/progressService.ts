/**
 * @module api/services/progressService
 *
 * Student learning progress summary — backed by Prisma.
 */

import { ProgressSummary, TopicProgress } from "@/types";
import { prisma } from "../lib/prisma";
import { xpEngine } from "../../services/gamification/xp_engine";
import { NotFoundError } from "../middlewares/error.middleware";

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  // Upsert profile so new users get defaults
  const profile = await prisma.studentProfile.upsert({
    where:  { userId },
    create: { userId },
    update: {},
  });

  const streak         = await prisma.streak.findUnique({ where: { userId } });
  const topicProgressRows = await prisma.topicProgress.findMany({ where: { userId } });
  const totalTopics    = await prisma.topic.count();

  const totalXp        = profile.totalXp;
  const levelInfo      = xpEngine.getLevelForXP(totalXp);
  const xpToNext       = xpEngine.xpToNextLevel(totalXp);
  const masteredTopics = topicProgressRows.filter((t) => t.isMastered).length;

  // Weak areas: in progress, lowest mastery first
  const weakAreas = topicProgressRows
    .filter((t) => !t.isMastered && t.completionPercent > 0)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map((t) => t.topicId);

  return {
    userId,
    totalXp,
    level:          levelInfo.level,
    levelTitle:     levelInfo.label,
    xpToNextLevel:  xpToNext,
    streak:         streak?.currentStreak ?? 0,
    masteredTopics,
    totalTopics,
    weakAreas,
    recentActivity: [], // populated on demand by practice history query
  };
}

export async function getTopicProgressList(
  userId: string,
  options?: { onlyMastered?: boolean; onlyInProgress?: boolean }
): Promise<TopicProgress[]> {
  const rows = await prisma.topicProgress.findMany({
    where:   { userId },
    orderBy: { lastPracticedAt: "desc" },
  });

  let filtered = rows;
  if (options?.onlyMastered)    filtered = rows.filter((t) => t.isMastered);
  if (options?.onlyInProgress)  filtered = rows.filter((t) => !t.isMastered && t.completionPercent > 0);

  return filtered.map((tp) => ({
    id:                tp.id,
    userId:            tp.userId,
    topicId:           tp.topicId,
    masteryScore:      tp.masteryScore,
    isMastered:        tp.isMastered,
    completionPercent: tp.completionPercent,
    attemptCount:      tp.attemptCount,
    correctCount:      tp.correctCount,
    lastPracticedAt:   tp.lastPracticedAt ?? undefined,
    updatedAt:         tp.updatedAt,
  }));
}
