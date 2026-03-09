/**
 * @module api/services/studentService
 *
 * Handles student identity and profile retrieval.
 * All reads go through api/mock/data until Prisma is wired.
 * Replacing each function with a Prisma query requires zero changes
 * to the controller or route layers.
 */

import {
  User,
  StudentProfile,
  StudentWithProfile,
  MasteryLevel,
  TopicProgress,
} from "@/types";
import {
  findUser,
  findProfile,
  findStreak,
  findTopicProgress,
} from "../mock/data";
import { NotFoundError } from "../middlewares/error.middleware";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a User record by ID. Throws NotFoundError if missing.
 */
export async function getStudentById(studentId: string): Promise<User> {
  const user = findUser(studentId);
  if (!user) throw new NotFoundError("Student", studentId);
  return user;
}

/**
 * Returns a StudentProfile by userId. Throws NotFoundError if missing.
 */
export async function getProfileByUserId(userId: string): Promise<StudentProfile> {
  const profile = findProfile(userId);
  if (!profile) throw new NotFoundError("StudentProfile", userId);
  return profile;
}

/**
 * Returns a fully-enriched StudentWithProfile for the given userId.
 * Computes masteryMap, weakAreas, and strongAreas from TopicProgress records.
 *
 * TODO: Replace findUser + findProfile + findTopicProgress with a single
 * Prisma query that includes student_profiles and topic_progress relations.
 */
export async function getStudentWithProfile(userId: string): Promise<StudentWithProfile> {
  const user = findUser(userId);
  if (!user) throw new NotFoundError("Student", userId);

  const profile = findProfile(userId);
  if (!profile) throw new NotFoundError("StudentProfile", userId);

  const topicProgressList: TopicProgress[] = findTopicProgress(userId);

  // Build mastery map from topic progress rows
  const masteryMap = buildMasteryMap(topicProgressList);

  // Classify topics
  const weakAreas = topicProgressList
    .filter((tp) => !tp.isMastered && tp.completionPercent > 0)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .map((tp) => tp.topicId);

  const strongAreas = topicProgressList
    .filter((tp) => tp.isMastered)
    .map((tp) => tp.topicId);

  return {
    ...user,
    profile,
    masteryMap,
    weakAreas,
    strongAreas,
  };
}

/**
 * Returns streak data for a student, or a zeroed-out default if not found.
 */
export async function getStreakForStudent(userId: string) {
  return findStreak(userId) ?? {
    id: `streak-${userId}`,
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: undefined,
    hasShield: false,
    updatedAt: new Date(),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMasteryMap(
  topicProgressList: TopicProgress[]
): Record<string, MasteryLevel> {
  const map: Record<string, MasteryLevel> = {};

  for (const tp of topicProgressList) {
    if (tp.isMastered) {
      map[tp.topicId] = tp.masteryScore >= 0.95
        ? MasteryLevel.Extended
        : MasteryLevel.Mastered;
    } else if (tp.completionPercent > 0) {
      map[tp.topicId] = tp.masteryScore >= 0.5
        ? MasteryLevel.Developing
        : MasteryLevel.Emerging;
    } else {
      map[tp.topicId] = MasteryLevel.NotStarted;
    }
  }

  return map;
}
