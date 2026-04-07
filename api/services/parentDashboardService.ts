/**
 * @module api/services/parentDashboardService
 *
 * Aggregates student data from multiple services and transforms it
 * into the parent portal dashboard format.
 *
 * This is the single entry point for the parent dashboard API endpoint.
 * It calls existing services (no duplicate queries) and delegates to
 * parentInsightsService for intelligence generation.
 */

import { prisma }              from "../lib/prisma";
import { NotFoundError }       from "../middlewares/error.middleware";
import { studentMemoryService } from "../../ai/services/studentMemoryService";
import { getNextLearningAction } from "./learningBrain";
import {
  computeLearningScore,
  computeLearningStatus,
  computeConfidenceSignal,
  computeConfidenceExplanation,
  computeSupportNeed,
  computeLearningPersonality,
  computeInsightBasis,
  buildMasteryMap,
  buildMasteryClusters,
  generateInsights,
  buildRecentHighlights,
  computeBiggestWin,
  computeNextSteps,
  type ParentDashboardData,
  type StudentDataInput,
} from "./parentInsightsService";

/**
 * Build the complete parent dashboard for a child.
 *
 * @param childId - The student's user ID
 */
export async function getParentDashboard(childId: string): Promise<ParentDashboardData> {
  // ── Parallel data fetch ─────────────────────────────────────────────────
  const [user, profile, streak, topicProgress, memorySnapshot, recentBadgeRows, brainAction] = await Promise.all([
    prisma.user.findUnique({ where: { id: childId }, select: { name: true, gradeLevel: true } }),
    prisma.studentProfile.findUnique({ where: { userId: childId } }),
    prisma.streak.findFirst({ where: { userId: childId } }),
    prisma.topicProgress.findMany({ where: { userId: childId } }),
    studentMemoryService.getSnapshot(childId).catch(() => undefined),
    prisma.studentBadge.findMany({
      where:   { userId: childId },
      include: { badge: { select: { title: true } } },
      orderBy: { awardedAt: "desc" },
      take:    5,
    }).catch(() => []),
    getNextLearningAction(childId).catch(() => null),
  ]);

  if (!user) throw new NotFoundError("User", childId);

  const grade = (user.gradeLevel as string) ?? "G4";

  // ── Build topic name lookup ─────────────────────────────────────────────
  const topicNames = new Map<string, string>();
  if (memorySnapshot) {
    for (const t of memorySnapshot.weakTopics)   topicNames.set(t.topicId, t.topicName);
    for (const t of memorySnapshot.strongTopics)  topicNames.set(t.topicId, t.topicName);
    for (const p of memorySnapshot.activeMistakePatterns) {
      if (p.topicName) topicNames.set(p.topicId, p.topicName);
    }
  }
  // Fill from DB
  const missingIds = topicProgress.filter((t) => !topicNames.has(t.topicId)).map((t) => t.topicId);
  if (missingIds.length > 0) {
    try {
      const dbTopics = await prisma.topic.findMany({
        where:  { id: { in: missingIds } },
        select: { id: true, name: true },
      });
      for (const t of dbTopics) topicNames.set(t.id, t.name);
    } catch { /* topic table may not exist */ }
  }

  // ── Assemble student data input ─────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileAny = profile as any;

  const studentData: StudentDataInput = {
    userId: childId,
    name:   user.name ?? "Student",
    grade,
    profile: {
      totalXp:                  profile?.totalXp ?? 0,
      currentLevel:             profile?.currentLevel ?? 1,
      confidenceLevel:          profile?.confidenceLevel ?? 50,
      learningPace:             profile?.learningPace ?? "standard",
      totalHintsUsed:           Number(profileAny?.totalHintsUsed ?? 0),
      totalQuestionsAttempted:  Number(profileAny?.totalQuestionsAttempted ?? 0),
      avgConfidenceScore:       Number(profileAny?.avgConfidenceScore ?? 50),
    },
    streak: {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    },
    topicProgress: topicProgress.map((t) => ({
      topicId:          t.topicId,
      masteryScore:     t.masteryScore,
      accuracyRate:     t.accuracyRate,
      completionPercent: t.completionPercent,
      isMastered:       t.isMastered,
      lastPracticedAt:  t.lastPracticedAt,
    })),
    memorySnapshot: memorySnapshot ?? undefined,
    recentBadges: recentBadgeRows.map((r: any) => ({
      name:     r.badge?.title ?? "Badge",
      earnedAt: r.awardedAt?.toISOString() ?? new Date().toISOString(),
    })),
  };

  // ── Compute insights ────────────────────────────────────────────────────
  const learningScore          = computeLearningScore(studentData);
  const learningStatus         = computeLearningStatus(learningScore);
  const confidenceSignal       = computeConfidenceSignal(studentData);
  const confidenceExplanation  = computeConfidenceExplanation(studentData);
  const supportNeed            = computeSupportNeed(studentData);
  const learningPersonality    = computeLearningPersonality(studentData);
  const insightBasis           = computeInsightBasis(studentData);
  const insights               = generateInsights(studentData);
  const masteryMap             = buildMasteryMap(studentData, topicNames);
  const masteryClusters        = buildMasteryClusters(masteryMap);
  const recentHighlights       = buildRecentHighlights(studentData);

  // ── Today's + This Week's activity ──────────────────────────────────────
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart.getTime() - 6 * 86_400_000);

  let sessionsToday = 0;
  let questionsToday = 0;
  let sessionsThisWeek = 0;
  let questionsThisWeek = 0;
  let topicsThisWeek = 0;
  let daysActiveThisWeek = 0;
  try {
    const weekSessions = await prisma.practiceSession.findMany({
      where: { userId: childId, startedAt: { gte: weekStart } },
      select: { questionsCount: true, startedAt: true, topicId: true },
    });
    const todaySessions = weekSessions.filter((s) => s.startedAt >= todayStart);
    sessionsToday = todaySessions.length;
    questionsToday = todaySessions.reduce((s, r) => s + (r.questionsCount ?? 0), 0);
    sessionsThisWeek = weekSessions.length;
    questionsThisWeek = weekSessions.reduce((s, r) => s + (r.questionsCount ?? 0), 0);
    topicsThisWeek = new Set(weekSessions.map((s) => s.topicId).filter(Boolean)).size;
    daysActiveThisWeek = new Set(weekSessions.map((s) => s.startedAt.toISOString().slice(0, 10))).size;
  } catch { /* table may not exist */ }

  // ── Current focus (from Learning Brain) ─────────────────────────────────
  const currentFocus = brainAction
    ? { topicName: brainAction.topicName, reason: brainAction.reason }
    : (memorySnapshot?.suggestedFocusTopics?.[0]
        ? { topicName: topicNames.get(memorySnapshot.suggestedFocusTopics[0]) ?? memorySnapshot.suggestedFocusTopics[0], reason: "Focus area based on recent learning" }
        : null);

  // ── Next recommendation ─────────────────────────────────────────────────
  const nextRecommendation = brainAction
    ? { topicName: brainAction.topicName, reason: brainAction.reason, actionType: brainAction.type }
    : null;

  // ── New intelligence ─────────────────────────────────────────────────────
  const biggestWin = computeBiggestWin(studentData);
  const nextSteps  = computeNextSteps(studentData, topicNames);

  return {
    childId,
    childName:             studentData.name,
    childGrade:            grade.replace("G", "Grade "),
    learningScore,
    learningStatus,
    confidenceSignal,
    confidenceExplanation,
    supportNeed,
    currentFocus,
    todayActivity: {
      questionsAnswered: questionsToday,
      minutesActive:     Math.round(questionsToday * 0.5),
      sessionsCompleted: sessionsToday,
    },
    thisWeek: {
      questionsAnswered: questionsThisWeek,
      sessionsCompleted: sessionsThisWeek,
      topicsPracticed:   topicsThisWeek,
      minutesActive:     Math.round(questionsThisWeek * 0.5),
      daysActive:        daysActiveThisWeek,
    },
    streak: studentData.streak,
    biggestWin,
    insights,
    insightBasis,
    learningPersonality,
    masteryClusters,
    masteryMap,
    recentHighlights,
    nextSteps,
    nextRecommendation,
  };
}
