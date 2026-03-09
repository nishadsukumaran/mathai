/**
 * @module services/gamification/badges_engine
 *
 * Manages the badge/achievement system.
 *
 * BADGE CATEGORIES:
 *   Accuracy     — perfect score badges, no-hint badges
 *   Streak       — consecutive day badges (3, 7, 14, 30, 100 days)
 *   Speed        — complete a challenge in under X seconds
 *   Persistence  — completed 5/10/20 retries successfully
 *   Exploration  — visited N different topics
 *
 * BADGE TRIGGER EVENTS:
 *   Badges are evaluated after specific events, not on every action.
 *   Each event type has a defined set of badges it can unlock.
 *
 * DESIGN:
 *   - Badges are idempotent — a student can only earn each badge once
 *   - Badge checks are async (DB reads) so they're non-blocking in the response flow
 *   - New badges are easy to add: create a BadgeDefinition + register it in BADGE_REGISTRY
 */

import { Badge, BadgeCategory } from "@/types";

// ─── Badge Definitions ─────────────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: BadgeCategory;
  xpBonus: number;
  check: (context: BadgeCheckContext) => boolean;
}

export interface BadgeCheckContext {
  event: BadgeTriggerEvent;
  studentStats: StudentStats;
  sessionStats?: SessionStats;
}

export enum BadgeTriggerEvent {
  SessionCompleted = "session_completed",
  StreakUpdated = "streak_updated",
  LessonMastered = "lesson_mastered",
  DailyLogin = "daily_login",
  ChallengeCompleted = "challenge_completed",
}

export interface StudentStats {
  totalSessions: number;
  totalCorrectFirstAttempt: number;
  totalRetrySuccesses: number;
  streakDays: number;
  topicsExplored: number;
  masteredTopics: number;
}

export interface SessionStats {
  accuracy: number;
  hintsUsed: number;
  timeSeconds: number;
  mode: string;
}

// ─── Badge Registry ────────────────────────────────────────────────────────────

export const BADGE_REGISTRY: BadgeDefinition[] = [
  {
    id: "badge-perfect-score",
    name: "Perfect Score!",
    description: "Got every question right in one session with no hints.",
    iconUrl: "/badges/perfect-score.svg",
    category: BadgeCategory.Accuracy,
    xpBonus: 15,
    check: ({ sessionStats }) =>
      (sessionStats?.accuracy ?? 0) === 1 && (sessionStats?.hintsUsed ?? 1) === 0,
  },
  {
    id: "badge-no-hints",
    name: "Flying Solo",
    description: "Completed a full practice session without using a single hint.",
    iconUrl: "/badges/flying-solo.svg",
    category: BadgeCategory.Accuracy,
    xpBonus: 10,
    check: ({ sessionStats }) => (sessionStats?.hintsUsed ?? 1) === 0,
  },
  {
    id: "badge-first-mastery",
    name: "Topic Conqueror",
    description: "Mastered your first topic!",
    iconUrl: "/badges/topic-conqueror.svg",
    category: BadgeCategory.Accuracy,
    xpBonus: 20,
    check: ({ studentStats }) => studentStats.masteredTopics === 1,
  },
  {
    id: "badge-streak-3",
    name: "On A Roll!",
    description: "3 days in a row! You're building a great habit.",
    iconUrl: "/badges/streak-3.svg",
    category: BadgeCategory.Streak,
    xpBonus: 5,
    check: ({ studentStats }) => studentStats.streakDays === 3,
  },
  {
    id: "badge-streak-7",
    name: "Week Warrior",
    description: "7-day streak! A full week of math mastery.",
    iconUrl: "/badges/streak-7.svg",
    category: BadgeCategory.Streak,
    xpBonus: 10,
    check: ({ studentStats }) => studentStats.streakDays === 7,
  },
  {
    id: "badge-streak-30",
    name: "Month Master",
    description: "30 days straight! You're unstoppable.",
    iconUrl: "/badges/streak-30.svg",
    category: BadgeCategory.Streak,
    xpBonus: 50,
    check: ({ studentStats }) => studentStats.streakDays === 30,
  },
  {
    id: "badge-streak-14",
    name: "Fortnight Fighter",
    description: "14 days in a row! Two solid weeks of math.",
    iconUrl: "/badges/streak-14.svg",
    category: BadgeCategory.Streak,
    xpBonus: 20,
    check: ({ studentStats }) => studentStats.streakDays === 14,
  },
  {
    id: "badge-streak-100",
    name: "Centurion",
    description: "100 days! You are a true Math Champion.",
    iconUrl: "/badges/streak-100.svg",
    category: BadgeCategory.Streak,
    xpBonus: 200,
    check: ({ studentStats }) => studentStats.streakDays === 100,
  },
  {
    id: "badge-speedster",
    name: "Speedster",
    description: "Completed a challenge in under 60 seconds.",
    iconUrl: "/badges/speedster.svg",
    category: BadgeCategory.Speed,
    xpBonus: 15,
    check: ({ sessionStats }) =>
      sessionStats?.mode === "challenge" && (sessionStats?.timeSeconds ?? 999) < 60,
  },
  {
    id: "badge-comeback-kid",
    name: "Comeback Kid",
    description: "Succeeded on a retry 10 times. Persistence pays off!",
    iconUrl: "/badges/comeback-kid.svg",
    category: BadgeCategory.Persistence,
    xpBonus: 10,
    check: ({ studentStats }) => studentStats.totalRetrySuccesses >= 10,
  },
  {
    id: "badge-explorer",
    name: "Math Explorer",
    description: "Tried 5 different math topics.",
    iconUrl: "/badges/math-explorer.svg",
    category: BadgeCategory.Exploration,
    xpBonus: 10,
    check: ({ studentStats }) => studentStats.topicsExplored >= 5,
  },
];

// ─── Engine ────────────────────────────────────────────────────────────────────

export class BadgesEngine {
  /**
   * Returns badges newly earned based on the current context.
   * Filters out badges the student already has.
   */
  evaluate(
    context: BadgeCheckContext,
    alreadyEarned: string[]
  ): BadgeDefinition[] {
    return BADGE_REGISTRY.filter(
      (badge) =>
        !alreadyEarned.includes(badge.id) &&
        badge.check(context)
    );
  }

  /**
   * Converts a BadgeDefinition to a Badge record for storage.
   */
  toEarnedBadge(definition: BadgeDefinition): Badge {
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      iconUrl: definition.iconUrl,
      category: definition.category,
      xpBonus: definition.xpBonus,
      earnedAt: new Date(),
    };
  }

  /**
   * Returns badge definitions filtered by trigger event.
   * Avoids evaluating unrelated badges on every event.
   */
  getBadgesForEvent(event: BadgeTriggerEvent): BadgeDefinition[] {
    const eventBadgeMap: Record<BadgeTriggerEvent, string[]> = {
      [BadgeTriggerEvent.SessionCompleted]: [
        "badge-perfect-score", "badge-no-hints", "badge-comeback-kid", "badge-speedster",
      ],
      [BadgeTriggerEvent.StreakUpdated]: [
        "badge-streak-3", "badge-streak-7", "badge-streak-14", "badge-streak-30", "badge-streak-100",
      ],
      [BadgeTriggerEvent.LessonMastered]: [
        "badge-first-mastery", "badge-explorer",
      ],
      [BadgeTriggerEvent.DailyLogin]: ["badge-streak-3", "badge-streak-7", "badge-streak-14", "badge-streak-30", "badge-streak-100"],
      [BadgeTriggerEvent.ChallengeCompleted]: ["badge-perfect-score", "badge-speedster"],
    };

    const ids = eventBadgeMap[event] ?? [];
    return BADGE_REGISTRY.filter((b) => ids.includes(b.id));
  }
}

export const badgesEngine = new BadgesEngine();
