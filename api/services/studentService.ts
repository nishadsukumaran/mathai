/**
 * @module api/services/studentService
 *
 * Student identity and profile retrieval — backed by Prisma.
 */

import { MasteryLevel, TopicProgress } from "@/types";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../middlewares/error.middleware";

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getStudentById(studentId: string) {
  const user = await prisma.user.findUnique({ where: { id: studentId } });
  if (!user) throw new NotFoundError("Student", studentId);
  return user;
}

export async function getStudentWithProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("Student", userId);

  // Upsert profile — new users get defaults on first dashboard load
  const profile = await prisma.studentProfile.upsert({
    where:  { userId },
    create: { userId },
    update: {},
  });

  const topicProgressRows = await prisma.topicProgress.findMany({
    where: { userId },
  });

  const topicProgressList: TopicProgress[] = topicProgressRows.map((tp) => ({
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

  const masteryMap = buildMasteryMap(topicProgressList);

  const weakAreas = topicProgressList
    .filter((tp) => !tp.isMastered && tp.completionPercent > 0)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .map((tp) => tp.topicId);

  const strongAreas = topicProgressList
    .filter((tp) => tp.isMastered)
    .map((tp) => tp.topicId);

  return {
    id:        user.id,
    email:     user.email,
    name:      user.name,
    role:      user.role,
    grade:     user.gradeLevel ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: {
      id:              profile.id,
      userId:          profile.userId,
      totalXp:         profile.totalXp,
      currentLevel:    profile.currentLevel,
      streakCount:     profile.streakCount,
      confidenceLevel: profile.confidenceLevel,
      learningPace:    profile.learningPace,
      preferredTheme:  profile.preferredTheme,
      updatedAt:       profile.updatedAt,
    },
    masteryMap,
    weakAreas,
    strongAreas,
  };
}

export async function getStreakForStudent(userId: string) {
  const streak = await prisma.streak.findUnique({ where: { userId } });
  return streak ?? {
    id:             `streak-${userId}`,
    userId,
    currentStreak:  0,
    longestStreak:  0,
    lastActiveDate: undefined,
    hasShield:      false,
    updatedAt:      new Date(),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMasteryMap(list: TopicProgress[]): Record<string, MasteryLevel> {
  const map: Record<string, MasteryLevel> = {};
  for (const tp of list) {
    if (tp.isMastered) {
      map[tp.topicId] = tp.masteryScore >= 0.95 ? MasteryLevel.Extended : MasteryLevel.Mastered;
    } else if (tp.completionPercent > 0) {
      map[tp.topicId] = tp.masteryScore >= 0.5 ? MasteryLevel.Developing : MasteryLevel.Emerging;
    } else {
      map[tp.topicId] = MasteryLevel.NotStarted;
    }
  }
  return map;
}
