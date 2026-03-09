/**
 * @module api/services/questService
 *
 * Manages daily/weekly quest retrieval and progress updates.
 * Generates fresh quests if none exist for the current day.
 */

import {
  StudentQuestProgress,
  QuestStatus,
  DailyQuest,
  QuestType,
  Difficulty,
} from "@/types";
import { findStudentQuests, MOCK_QUESTS } from "../mock/data";
import { questEngine } from "../../services/gamification/quest_engine";
import { NotFoundError } from "../middlewares/error.middleware";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns today's active quests for a student.
 * If no quests exist for today, generates fresh ones.
 *
 * TODO: Replace with Prisma query + upsert logic:
 *   1. Check student_quest_progress WHERE userId=$1 AND expiresAt > NOW()
 *   2. If none, call questEngine.generateDailyQuests() and persist
 */
export async function getDailyQuests(
  userId: string
): Promise<StudentQuestProgress[]> {
  const existing = findStudentQuests(userId);
  const today = new Date();

  // Filter to quests that haven't expired
  const activeToday = existing.filter(
    (q) => q.status === QuestStatus.Active && q.expiresAt > today
  );

  if (activeToday.length > 0) {
    return activeToday;
  }

  // No active quests — generate fresh ones (in-memory for now)
  const freshQuests = generateFreshQuests(userId);
  return freshQuests;
}

/**
 * Returns all quest progress records (including completed and expired).
 */
export async function getAllQuestProgress(
  userId: string
): Promise<StudentQuestProgress[]> {
  return findStudentQuests(userId);
}

/**
 * Updates quest progress after a practice event.
 *
 * @param userId   - student ID
 * @param metric   - the event metric (e.g., "correct_answers")
 * @param amount   - how much to increment
 *
 * Returns a list of quests that were just completed.
 */
export async function updateQuestProgress(
  userId: string,
  metric: string,
  amount: number
): Promise<StudentQuestProgress[]> {
  // TODO: Implement with Prisma:
  //   1. Find active quests matching the metric
  //   2. Increment progressValue
  //   3. If progressValue >= quest.targetValue → mark complete, award XP
  //   4. Return newly completed quests

  const quests = findStudentQuests(userId).filter(
    (q) => q.status === QuestStatus.Active && q.quest?.trackingKey === metric
  );

  const justCompleted: StudentQuestProgress[] = [];

  for (const q of quests) {
    if (!q.quest) continue;
    const newValue = Math.min(q.progressValue + amount, q.quest.targetValue);
    if (newValue >= q.quest.targetValue && q.status === QuestStatus.Active) {
      justCompleted.push({ ...q, progressValue: newValue, status: QuestStatus.Completed, completedAt: new Date() });
    }
  }

  return justCompleted;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateFreshQuests(userId: string): StudentQuestProgress[] {
  // Pick 3 random quest templates from MOCK_QUESTS
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);

  const shuffled = [...MOCK_QUESTS].sort(() => Math.random() - 0.5).slice(0, 3);

  return shuffled.map((quest, i) => ({
    id:            `sqp-generated-${userId}-${i}`,
    userId,
    questId:       quest.id,
    quest,
    status:        QuestStatus.Active,
    progressValue: 0,
    expiresAt:     midnight,
    createdAt:     new Date(),
  }));
}
