/**
 * @module api/services/questService
 *
 * Daily quest retrieval and progress — backed by Prisma.
 * Generates fresh quest assignments from DailyQuest templates if none exist for today.
 *
 * Safety: if no quest templates exist in the database (e.g. seed was never run),
 * the service auto-inserts a default set of 7 daily + 3 weekly templates before
 * assigning quests. This guarantees every student always sees daily quests.
 *
 * All date arithmetic uses explicit UTC to avoid server-timezone drift.
 */

import { StudentQuestProgress, QuestStatus } from "@/types";
import { prisma } from "../lib/prisma";

// ─── UTC date helpers ────────────────────────────────────────────────────────

/** Returns midnight UTC of the current day */
function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Returns midnight UTC of the next day */
function tomorrowUTC(): Date {
  return new Date(todayUTC().getTime() + 86_400_000);
}

// ─── Default quest templates (fallback if DB is empty) ───────────────────────

const DEFAULT_DAILY_TEMPLATES = [
  { title: "Answer 5 Questions Correctly", description: "Get 5 answers right today across any topic.", xpReward: 20, questType: "daily" as const, difficulty: "beginner" as const, targetValue: 5, trackingKey: "correct_answers" },
  { title: "Practise for 10 Minutes", description: "Spend at least 10 minutes practising today.", xpReward: 15, questType: "daily" as const, difficulty: "beginner" as const, targetValue: 10, trackingKey: "minutes_practiced" },
  { title: "Complete a Full Practice Set", description: "Finish one complete practice set from start to finish.", xpReward: 25, questType: "daily" as const, difficulty: "intermediate" as const, targetValue: 1, trackingKey: "sessions_completed" },
  { title: "Answer 10 Correctly in a Row", description: "Get 10 correct answers without a wrong answer in between.", xpReward: 40, questType: "daily" as const, difficulty: "advanced" as const, targetValue: 10, trackingKey: "correct_streak" },
  { title: "Try a New Topic", description: "Attempt at least one question in a topic you haven't practised before.", xpReward: 20, questType: "daily" as const, difficulty: "beginner" as const, targetValue: 1, trackingKey: "new_topics_attempted" },
  { title: "No Hints Today", description: "Complete a full session without using any hints.", xpReward: 30, questType: "daily" as const, difficulty: "advanced" as const, targetValue: 1, trackingKey: "hintless_sessions" },
  { title: "Log In Today", description: "Simply show up! Open MathAI and complete at least one question.", xpReward: 5, questType: "daily" as const, difficulty: "beginner" as const, targetValue: 1, trackingKey: "daily_login" },
];

const DEFAULT_WEEKLY_TEMPLATES = [
  { title: "Master a Topic This Week", description: "Reach Mastered status on any topic by Sunday.", xpReward: 100, questType: "weekly" as const, difficulty: "advanced" as const, targetValue: 1, trackingKey: "topics_mastered" },
  { title: "Answer 50 Questions This Week", description: "Answer at least 50 questions across any topics this week.", xpReward: 75, questType: "weekly" as const, difficulty: "intermediate" as const, targetValue: 50, trackingKey: "correct_answers" },
  { title: "Practise 5 Different Topics This Week", description: "Spread your practice! Attempt questions in 5 different topics this week.", xpReward: 60, questType: "weekly" as const, difficulty: "intermediate" as const, targetValue: 5, trackingKey: "topics_attempted" },
];

/**
 * Ensures at least one quest template exists in the database.
 * If the table is empty (seed was never run, or was wiped), auto-inserts defaults.
 */
async function ensureTemplatesExist(): Promise<void> {
  const count = await prisma.dailyQuest.count();
  if (count > 0) return;

  console.warn("[questService] No quest templates found in DB — auto-seeding defaults");
  const all = [...DEFAULT_DAILY_TEMPLATES, ...DEFAULT_WEEKLY_TEMPLATES];
  await prisma.dailyQuest.createMany({ data: all as never[] });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getDailyQuests(userId: string): Promise<StudentQuestProgress[]> {
  const now      = new Date();
  const tomorrow = tomorrowUTC();

  // Active quests that expire in the future
  const existing = await prisma.studentQuestProgress.findMany({
    where: {
      userId,
      expiresAt: { gt: now },
      status:    "active",
    },
    include: { quest: true },
  });

  if (existing.length > 0) {
    return existing.map(mapQuestProgress);
  }

  // No active quests — ensure templates exist, then assign 3 random daily ones
  await ensureTemplatesExist();

  const templates = await prisma.dailyQuest.findMany({
    where:   { questType: "daily" },
    take:    20,
  });

  if (templates.length === 0) {
    // Should never happen after ensureTemplatesExist, but guard anyway
    console.error("[questService] Failed to create quest templates — returning empty");
    return [];
  }

  // Pick 3 shuffled templates
  const picks = [...templates].sort(() => Math.random() - 0.5).slice(0, 3);

  const created = await prisma.$transaction(
    picks.map((quest) =>
      prisma.studentQuestProgress.create({
        data: {
          userId,
          questId:   quest.id,
          status:    "active",
          expiresAt: tomorrow,
        },
        include: { quest: true },
      })
    )
  );

  return created.map(mapQuestProgress);
}

export async function getAllQuestProgress(userId: string): Promise<StudentQuestProgress[]> {
  const rows = await prisma.studentQuestProgress.findMany({
    where:   { userId },
    include: { quest: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapQuestProgress);
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuestProgress(row: any): StudentQuestProgress {
  return {
    id:            row.id,
    userId:        row.userId,
    questId:       row.questId,
    status:        row.status as QuestStatus,
    progressValue: row.progressValue,
    expiresAt:     row.expiresAt,
    completedAt:   row.completedAt ?? undefined,
    createdAt:     row.createdAt,
    quest: row.quest ? {
      id:           row.quest.id,
      title:        row.quest.title,
      description:  row.quest.description,
      questType:    row.quest.questType,
      targetValue:  row.quest.targetValue,
      trackingKey:  row.quest.trackingKey,
      xpReward:     row.quest.xpReward,
      difficulty:   row.quest.difficulty,
      createdAt:    row.quest.createdAt,
    } : undefined,
  };
}
