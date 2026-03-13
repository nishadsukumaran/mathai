/**
 * @module api/services/progressService
 *
 * Student learning progress summary — backed by Prisma.
 */

import { ProgressSummary, TopicProgress } from "@/types";
import { prisma } from "../lib/prisma";
import { xpEngine } from "../../services/gamification/xp_engine";
import { NotFoundError } from "../middlewares/error.middleware";

// Simple in-memory cache for topic count (changes rarely, queried on every dashboard load)
let _cachedTopicCount: number | null = null;
let _topicCountFetchedAt = 0;
const TOPIC_COUNT_TTL = 10 * 60 * 1000; // 10 minutes

async function getCachedTopicCount(): Promise<number> {
  const now = Date.now();
  if (_cachedTopicCount !== null && now - _topicCountFetchedAt < TOPIC_COUNT_TTL) {
    return _cachedTopicCount;
  }
  _cachedTopicCount = await prisma.topic.count();
  _topicCountFetchedAt = now;
  return _cachedTopicCount;
}

// Pre-fetched data passed from dashboardController to avoid duplicate queries
type ProgressCtx = {
  profile:           Awaited<ReturnType<typeof prisma.studentProfile.upsert>>;
  streak:            Awaited<ReturnType<typeof prisma.streak.findUnique>>;
  topicProgressRows: Awaited<ReturnType<typeof prisma.topicProgress.findMany>>;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getProgressSummary(userId: string, ctx?: ProgressCtx): Promise<ProgressSummary> {
  // When called from dashboard, profile/streak/topicProgress are pre-fetched.
  // When called standalone (e.g. progressController), fall back to parallel queries.
  const [profile, streak, topicProgressRows, totalTopics] = await Promise.all([
    ctx !== undefined ? Promise.resolve(ctx.profile)           : prisma.studentProfile.upsert({ where: { userId }, create: { userId }, update: {} }),
    ctx !== undefined ? Promise.resolve(ctx.streak)            : prisma.streak.findUnique({ where: { userId } }),
    ctx !== undefined ? Promise.resolve(ctx.topicProgressRows) : prisma.topicProgress.findMany({ where: { userId } }),
    getCachedTopicCount(),
  ]);

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
    accuracyRate:      tp.accuracyRate,
    completionPercent: tp.completionPercent,
    isUnlocked:        tp.isUnlocked,
    isMastered:        tp.isMastered,
    lastPracticedAt:   tp.lastPracticedAt ?? undefined,
    updatedAt:         tp.updatedAt,
  }));
}
