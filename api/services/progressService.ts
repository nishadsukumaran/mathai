/**
 * @module api/services/progressService
 *
 * Assembles a student's learning progress summary.
 * Aggregates XP, level, streak, topic mastery, and weak areas
 * into the ProgressSummary shape.
 */

import {
  ProgressSummary,
  PracticeSession,
  TopicProgress,
  AdaptiveRecommendation,
} from "@/types";
import {
  findProfile,
  findStreak,
  findTopicProgress,
  MOCK_TOPICS,
} from "../mock/data";
import { getWeakAreas } from "./curriculumService";
import { xpEngine } from "../../services/gamification/xp_engine";
import { NotFoundError } from "../middlewares/error.middleware";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the full progress summary for a student.
 */
export async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  const profile = findProfile(userId);
  if (!profile) throw new NotFoundError("StudentProfile", userId);

  const streak    = findStreak(userId);
  const topicList = findTopicProgress(userId);

  const totalXp     = profile.totalXp;
  const levelInfo   = xpEngine.getLevelForXP(totalXp);
  const xpToNext    = xpEngine.xpToNextLevel(totalXp);

  const masteredTopics = topicList.filter((t) => t.isMastered).length;
  // Total topics = all topics in the curriculum (static count for now)
  const totalTopics = MOCK_TOPICS.length;

  const weakAreas = await getWeakAreas(userId);

  // Recent activity: last 5 sessions
  // TODO: replace with Prisma query for practice_sessions ORDER BY startedAt DESC LIMIT 5
  const recentActivity: PracticeSession[] = [];

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
    recentActivity,
  };
}

/**
 * Returns topic progress records for a student, optionally filtered.
 */
export async function getTopicProgressList(
  userId: string,
  options?: { onlyMastered?: boolean; onlyInProgress?: boolean }
): Promise<TopicProgress[]> {
  let list = findTopicProgress(userId);

  if (options?.onlyMastered) {
    list = list.filter((t) => t.isMastered);
  } else if (options?.onlyInProgress) {
    list = list.filter((t) => !t.isMastered && t.completionPercent > 0);
  }

  return list.sort((a, b) => (b.lastPracticedAt?.getTime() ?? 0) - (a.lastPracticedAt?.getTime() ?? 0));
}
