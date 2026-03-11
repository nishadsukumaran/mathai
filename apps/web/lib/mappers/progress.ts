/**
 * @module apps/web/lib/mappers/progress
 *
 * Transforms raw API responses from GET /api/progress/:userId
 * and GET /api/curriculum into the ProgressViewData contract.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { XPStatus, StreakStatus, EarnedBadge } from "@mathai/shared-types";
import type { ProgressViewData, CurriculumViewItem } from "@/types/contracts";

export function mapProgressXP(progress: any): XPStatus | null {
  if (!progress) return null;
  const xpInLevel = progress.totalXp ? progress.totalXp % 500 : 0;
  const xpToNext  = progress.xpToNextLevel ?? 500;
  return {
    level:         progress.level ?? 1,
    levelTitle:    progress.levelTitle ?? "Explorer",
    xpInLevel,
    xpToNextLevel: xpToNext,
    progressPct:   Math.round((xpInLevel / Math.max(xpToNext, 1)) * 100),
    totalXP:       progress.totalXp ?? 0,
  };
}

export function mapProgressStreak(progress: any): StreakStatus | null {
  if (!progress) return null;
  return {
    currentStreak:  progress.streak ?? 0,
    longestStreak:  progress.longestStreak ?? progress.streak ?? 0,
    lastActiveDate: progress.lastActiveDate ?? new Date().toISOString().split("T")[0]!,
    shieldActive:   progress.hasStreakShield ?? false,
  };
}

export function mapProgressBadges(progress: any): EarnedBadge[] {
  const badges = progress?.badges ?? progress?.recentBadges ?? [];
  return badges.map((b: any) => ({
    id:          b.id,
    name:        b.title ?? b.name ?? "Badge",
    description: b.description ?? `${b.category} badge`,
    category:    b.category ?? "mastery",
    iconUrl:     b.iconUrl ?? undefined,
    earnedAt:    b.earnedAt ?? new Date().toISOString(),
    xpBonus:     b.xpBonus ?? 10,
  }));
}

export function mapCurriculumView(curriculum: any[]): CurriculumViewItem[] {
  return curriculum.map((strand: any) => ({
    strand: {
      id:        strand.strand?.id ?? "unknown",
      name:      strand.strand?.name ?? "Strand",
      iconEmoji: strand.strand?.iconEmoji,
    },
    topics: (strand.topics ?? []).map((t: any) => ({
      id:           t.id,
      name:         t.name,
      isUnlocked:   t.isUnlocked ?? true,
      grade:        t.grade ?? "—",
      masteryLevel: t.masteryLevel ?? "not_started",
    })),
  }));
}

/**
 * Maps raw progress + curriculum API payloads → ProgressViewData.
 * Called by ProgressContainer.
 */
export function mapProgressViewData(
  progress:   any,
  curriculum: any[]
): ProgressViewData {
  return {
    xp:             mapProgressXP(progress),
    streak:         mapProgressStreak(progress),
    masteredTopics: progress?.masteredTopics ?? 0,
    totalTopics:    progress?.totalTopics ?? 0,
    totalXp:        progress?.totalXp ?? 0,
    weakAreas:      progress?.weakAreas ?? [],
    badges:         mapProgressBadges(progress),
    curriculum:     mapCurriculumView(curriculum),
  };
}
