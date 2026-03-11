/**
 * @module apps/web/lib/mappers/dashboard
 *
 * Transforms raw API responses from GET /api/dashboard/:userId
 * and GET /api/curriculum into the DashboardViewData contract.
 *
 * All `any` casts are intentional — the API layer returns untyped JSON and
 * this is the explicit boundary where we validate + shape the data.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  XPStatus,
  StreakStatus,
  EarnedBadge,
  DailyQuest,
  TopicSummary,
  MasteryLevel,
} from "@mathai/shared-types";

import type {
  DashboardViewData,
  ContinueLearningItem,
  DailyMissionData,
  ProgressSummaryData,
} from "@/types/contracts";

// ─── Individual mappers ────────────────────────────────────────────────────────

export function mapXP(gamification: any, progress: any): XPStatus | null {
  if (!gamification) return null;
  const xpInLevel = gamification.xp ?? 0;
  const xpToNext  = gamification.xpToNextLevel ?? 500;
  return {
    level:        gamification.level ?? 1,
    levelTitle:   progress?.levelTitle ?? "Explorer",
    xpInLevel,
    xpToNextLevel: xpToNext,
    progressPct:  gamification.xpProgress
      ? Math.round(gamification.xpProgress * 100)
      : Math.round((xpInLevel / Math.max(xpToNext, 1)) * 100),
    totalXP: gamification.xp ?? 0,
  };
}

export function mapStreak(gamification: any): StreakStatus | null {
  if (!gamification) return null;
  return {
    currentStreak:  gamification.streak ?? 0,
    longestStreak:  gamification.longestStreak ?? gamification.streak ?? 0,
    lastActiveDate: gamification.lastActiveDate ?? new Date().toISOString().split("T")[0]!,
    shieldActive:   gamification.hasStreakShield ?? false,
  };
}

/** Midnight tonight as ISO string — used as default expiresAt for quests */
const questExpiresAt = (): string => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

export function mapQuests(quests: any[]): DailyQuest[] {
  return quests.map((q) => ({
    id:           q.id,
    title:        q.quest?.title ?? "Quest",
    description:  q.quest?.description ?? "",
    currentCount: q.progressValue ?? 0,
    targetCount:  q.quest?.targetValue ?? 1,
    xpReward:     q.quest?.xpReward ?? 0,
    expiresAt:    q.expiresAt ?? questExpiresAt(),
    completedAt:  q.status === "completed" ? new Date().toISOString() : undefined,
  }));
}

export function mapBadges(badges: any[]): EarnedBadge[] {
  return badges.map((b) => ({
    id:          b.id,
    name:        b.title ?? b.name ?? "Badge",
    description: b.description ?? `${b.category} badge`,
    category:    b.category ?? "mastery",
    iconUrl:     b.iconUrl ?? undefined,
    earnedAt:    b.earnedAt ?? new Date().toISOString(),
    xpBonus:     b.xpBonus ?? 10,
  }));
}

export function mapTopics(curriculum: any[]): TopicSummary[] {
  const topics: TopicSummary[] = [];
  for (const strand of curriculum) {
    if (!strand?.topics) continue;
    for (const topic of strand.topics) {
      topics.push({
        id:           topic.id,
        name:         topic.name,
        description:  topic.description ?? `${strand.strand?.name ?? ""} topic`,
        grade:        topic.grade ?? "G4",
        strand:       strand.strand?.name ?? "",
        iconSlug:     topic.iconSlug ?? topic.id,
        masteryLevel: (topic.masteryLevel ?? "not_started") as MasteryLevel,
        isUnlocked:   topic.isUnlocked ?? true,
        lessonCount:  topic.lessonCount ?? 5,
      });
    }
  }
  return topics;
}

// ─── Derived view-data builders ────────────────────────────────────────────────

/**
 * "Continue Learning" — picks the least-mastered unlocked topic.
 * MasteryLevel order: not_started → emerging → developing → mastered → extended
 * Prefers "emerging" or "developing" (already started, not finished).
 */
export function deriveContinueLearning(
  topics: TopicSummary[]
): ContinueLearningItem | null {
  const ORDER: MasteryLevel[] = ["emerging", "developing", "not_started"];
  let candidate: TopicSummary | undefined;
  for (const level of ORDER) {
    candidate = topics.find((t) => t.masteryLevel === level && t.isUnlocked);
    if (candidate) break;
  }
  if (!candidate) return null;

  const isStarted = candidate.masteryLevel === "emerging" || candidate.masteryLevel === "developing";
  return {
    topicId:      candidate.id,
    topicName:    candidate.name,
    icon:         "📚",
    masteryLevel: candidate.masteryLevel,
    ctaLabel:     isStarted ? "Continue →" : "Start Learning →",
  };
}

export function deriveDailyMission(quests: DailyQuest[]): DailyMissionData {
  return {
    quests,
    completedCount: quests.filter((q) => q.completedAt !== undefined).length,
    totalCount:     quests.length,
  };
}

export function deriveProgressSummary(
  gamification: any,
  progress:     any,
  topics:       TopicSummary[]
): ProgressSummaryData | null {
  if (!gamification && !progress) return null;
  const mastered = topics.filter((t) => t.masteryLevel === "mastered" || t.masteryLevel === "extended").length;
  return {
    level:          gamification?.level ?? progress?.level ?? 1,
    levelTitle:     progress?.levelTitle ?? gamification?.levelTitle ?? "Explorer",
    totalXP:        gamification?.xp ?? progress?.totalXp ?? 0,
    masteredTopics: mastered,
    totalTopics:    topics.length,
  };
}

// ─── Composite mapper ──────────────────────────────────────────────────────────

/**
 * Maps raw dashboard + curriculum API payloads → DashboardViewData.
 * Called by DashboardContainer.
 */
export function mapDashboardViewData(
  dashboard:  any,
  curriculum: any[]
): DashboardViewData {
  const student      = dashboard?.student;
  const gamification = dashboard?.gamification;
  const progress     = dashboard?.progress;
  const rawQuests    = dashboard?.quests ?? [];

  const xp     = mapXP(gamification, progress);
  const streak = mapStreak(gamification);
  const quests = mapQuests(rawQuests);
  const topics = mapTopics(curriculum);

  return {
    student: {
      name:  student?.name ?? "Explorer",
      grade: student?.grade ?? "—",
    },
    xp,
    streak,
    continueLearning: deriveContinueLearning(topics),
    dailyMission:     deriveDailyMission(quests),
    progressSummary:  deriveProgressSummary(gamification, progress, topics),
  };
}
