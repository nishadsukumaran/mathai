/**
 * @module api/services/questService
 *
 * Daily quest retrieval and progress — backed by Prisma.
 * Generates fresh quest assignments from DailyQuest templates if none exist for today.
 */

import { StudentQuestProgress, QuestStatus } from "@/types";
import { prisma } from "../lib/prisma";

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getDailyQuests(userId: string): Promise<StudentQuestProgress[]> {
  const now     = new Date();
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);

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

  // No active quests — assign 3 random templates for today
  const templates = await prisma.dailyQuest.findMany({
    where:   { questType: "daily" },
    take:    20,
  });

  if (templates.length === 0) return [];

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
    } : undefined,
  };
}
