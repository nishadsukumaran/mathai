/**
 * @module api/services/gamificationService
 *
 * Assembles the gamification dashboard by combining data from the
 * XP engine, streak engine, badge registry, and quest engine.
 *
 * This is a read service — it never mutates state.
 * Mutations (awarding XP, updating streaks) happen in practiceService
 * after answer submission.
 */

import {
  GamificationDashboard,
  EarnedBadge,
  StudentQuestProgress,
  QuestStatus,
} from "@/types";
import {
  findProfile,
  findStreak,
  findEarnedBadges,
  findStudentQuests,
} from "../mock/data";
import { xpEngine } from "../../services/gamification/xp_engine";
import { NotFoundError } from "../middlewares/error.middleware";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the full gamification dashboard for a student.
 */
export async function getGamificationDashboard(
  userId: string
): Promise<GamificationDashboard> {
  const profile = findProfile(userId);
  if (!profile) throw new NotFoundError("StudentProfile", userId);

  const streak = findStreak(userId);
  const earnedBadges = findEarnedBadges(userId);
  const questProgress = findStudentQuests(userId);

  const totalXp = profile.totalXp;
  const levelInfo = xpEngine.getLevelForXP(totalXp);
  const xpProgress = xpEngine.getLevelProgress(totalXp);
  const xpToNext = xpEngine.xpToNextLevel(totalXp);

  // Most recent 3 badges
  const recentBadges: EarnedBadge[] = [...earnedBadges]
    .sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime())
    .slice(0, 3);

  // Active quests only
  const activeQuests: StudentQuestProgress[] = questProgress.filter(
    (q) => q.status === QuestStatus.Active
  );

  return {
    xp:             totalXp,
    level:          levelInfo.level,
    xpToNextLevel:  xpToNext,
    xpProgress,
    streak:         streak?.currentStreak ?? 0,
    hasStreakShield: streak?.hasShield ?? false,
    recentBadges,
    activeQuests,
  };
}

/**
 * Returns all earned badges for a student, sorted by most recent first.
 */
export async function getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  return [...findEarnedBadges(userId)].sort(
    (a, b) => b.awardedAt.getTime() - a.awardedAt.getTime()
  );
}

/**
 * Returns current XP, level, and progress within the current level.
 */
export async function getXPSummary(userId: string) {
  const profile = findProfile(userId);
  if (!profile) throw new NotFoundError("StudentProfile", userId);

  const levelInfo = xpEngine.getLevelForXP(profile.totalXp);
  return {
    totalXp:       profile.totalXp,
    level:         levelInfo.level,
    levelTitle:    levelInfo.label,
    xpProgress:    xpEngine.getLevelProgress(profile.totalXp),
    xpToNextLevel: xpEngine.xpToNextLevel(profile.totalXp),
  };
}
