/**
 * @module services/gamification/quest_engine
 *
 * Manages daily and weekly quests to keep students engaged.
 *
 * QUEST TYPES:
 *   Daily Quests  — reset at midnight, 3 quests per day
 *   Weekly Quests — reset on Monday, 2 quests per week (harder, more XP)
 *
 * EXAMPLE DAILY QUESTS:
 *   "Answer 5 questions correctly today"                    → 20 XP
 *   "Complete a full practice session without any hints"    → 25 XP
 *   "Practice 2 different topics"                           → 15 XP
 *   "Log in and do at least 10 minutes of math"             → 10 XP
 *
 * EXAMPLE WEEKLY QUESTS:
 *   "Master a new topic this week"                          → 50 XP
 *   "Complete 3 challenge mode sessions"                    → 60 XP
 *
 * QUEST GENERATION:
 *   Quests are generated fresh daily/weekly, personalised to the student's
 *   current curriculum position and known weak areas.
 *
 * DESIGN:
 *   - Quest progress is tracked incrementally (not just pass/fail)
 *   - Quest completion is idempotent
 *   - Students can see quest progress in real time
 */

import { DailyQuest } from "@/types";

/**
 * An in-memory quest instance with live progress tracking.
 * Derived from a DailyQuest template; NOT persisted as-is — progress is
 * written to the `student_quest_progress` table via questService.
 */
export interface QuestInstance {
  id:           string;
  title:        string;
  description:  string;
  xpReward:     number;
  targetCount:  number;
  currentCount: number;
  expiresAt:    Date;
  completedAt?: Date;
}

// ─── Quest Templates ───────────────────────────────────────────────────────────

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  xpReward: number;
  type: "daily" | "weekly";
  metric: QuestMetric;
}

export enum QuestMetric {
  CorrectAnswers = "correct_answers",
  QuestionsAttempted = "questions_attempted",
  NoHintSession = "no_hint_session",
  TopicsVisited = "topics_visited",
  SessionsCompleted = "sessions_completed",
  ChallengesCompleted = "challenges_completed",
  TopicsMastered = "topics_mastered",
  MinutesActive = "minutes_active",
}

export const DAILY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: "dq-correct-5",
    title: "Answer 5 Questions Correctly",
    description: "Get 5 answers right today — you can do it!",
    targetCount: 5,
    xpReward: 20,
    type: "daily",
    metric: QuestMetric.CorrectAnswers,
  },
  {
    id: "dq-no-hints",
    title: "Fly Solo",
    description: "Complete a full session without using any hints.",
    targetCount: 1,
    xpReward: 25,
    type: "daily",
    metric: QuestMetric.NoHintSession,
  },
  {
    id: "dq-two-topics",
    title: "Topic Hopper",
    description: "Practice 2 different math topics today.",
    targetCount: 2,
    xpReward: 15,
    type: "daily",
    metric: QuestMetric.TopicsVisited,
  },
  {
    id: "dq-session",
    title: "Daily Practice",
    description: "Complete a full practice session today.",
    targetCount: 1,
    xpReward: 10,
    type: "daily",
    metric: QuestMetric.SessionsCompleted,
  },
  {
    id: "dq-ten-questions",
    title: "On A Roll",
    description: "Answer 10 questions (any result) — just keep going!",
    targetCount: 10,
    xpReward: 12,
    type: "daily",
    metric: QuestMetric.QuestionsAttempted,
  },
];

export const WEEKLY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: "wq-master-topic",
    title: "Topic Master",
    description: "Achieve mastery on a new topic this week.",
    targetCount: 1,
    xpReward: 50,
    type: "weekly",
    metric: QuestMetric.TopicsMastered,
  },
  {
    id: "wq-3-challenges",
    title: "Challenge Accepted",
    description: "Complete 3 challenge mode sessions this week.",
    targetCount: 3,
    xpReward: 60,
    type: "weekly",
    metric: QuestMetric.ChallengesCompleted,
  },
];

// ─── Engine ────────────────────────────────────────────────────────────────────

export class QuestEngine {
  /**
   * Generates today's quests for a student.
   * Selects 3 daily quests (personalised by weak areas in future).
   */
  generateDailyQuests(studentId: string): QuestInstance[] {
    const templates = this.selectTemplates(DAILY_QUEST_TEMPLATES, 3);
    const expiresAt = this.getMidnight();

    return templates.map((t) => this.templateToQuest(t, studentId, expiresAt));
  }

  /**
   * Generates this week's quests.
   */
  generateWeeklyQuests(studentId: string): QuestInstance[] {
    const templates = this.selectTemplates(WEEKLY_QUEST_TEMPLATES, 2);
    const expiresAt = this.getNextMonday();

    return templates.map((t) => this.templateToQuest(t, studentId, expiresAt));
  }

  /**
   * Increments quest progress by a given amount.
   * Returns the updated quest and whether it was completed.
   */
  updateProgress(
    quest: QuestInstance,
    incrementBy: number
  ): { quest: QuestInstance; justCompleted: boolean } {
    if (quest.completedAt) {
      return { quest, justCompleted: false }; // already done
    }

    const newCount = Math.min(quest.currentCount + incrementBy, quest.targetCount);
    const justCompleted = newCount >= quest.targetCount;

    const updated: QuestInstance = {
      ...quest,
      currentCount: newCount,
      completedAt: justCompleted ? new Date() : undefined,
    };

    return { quest: updated, justCompleted };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private templateToQuest(
    template: QuestTemplate,
    _studentId: string,
    expiresAt: Date
  ): QuestInstance {
    return {
      id:           `${template.id}-${Date.now()}`,
      title:        template.title,
      description:  template.description,
      targetCount:  template.targetCount,
      currentCount: 0,
      xpReward:     template.xpReward,
      expiresAt,
    };
  }

  private selectTemplates<T>(templates: T[], count: number): T[] {
    // Shuffle and take N — in production, weight by student's weak areas
    return [...templates].sort(() => Math.random() - 0.5).slice(0, count);
  }

  private getMidnight(): Date {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private getNextMonday(): Date {
    const d = new Date();
    const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

export const questEngine = new QuestEngine();
