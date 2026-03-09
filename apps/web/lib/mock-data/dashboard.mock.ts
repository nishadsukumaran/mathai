/**
 * Mock response for GET /api/dashboard/:studentId
 * Screen: /dashboard
 */

import type { DashboardData } from "@mathai/shared-types";

export const MOCK_DASHBOARD: DashboardData = {
  student: {
    id:          "student-001",
    displayName: "Aryan",
    avatarUrl:   "/avatars/rocket.png",
    grade:       "G4",
  },

  xp: {
    totalXP:       340,
    level:         2,
    levelTitle:    "Number Explorer",
    xpInLevel:     140,
    xpToNextLevel: 450,
    progressPct:   31,
  },

  streak: {
    currentStreak:  5,
    longestStreak:  12,
    lastActiveDate: "2026-03-08",
    shieldActive:   false,
  },

  recentBadges: [
    {
      id:          "badge-streak-3",
      name:        "3-Day Streak!",
      description: "Practiced 3 days in a row. Keep it up!",
      iconUrl:     "/badges/streak-3.svg",
      category:    "streak",
      xpBonus:     10,
      earnedAt:    "2026-03-07T14:32:00Z",
    },
    {
      id:          "badge-first-mastery",
      name:        "Topic Conqueror",
      description: "Mastered your first topic. You're on fire!",
      iconUrl:     "/badges/first-mastery.svg",
      category:    "mastery",
      xpBonus:     25,
      earnedAt:    "2026-03-06T11:10:00Z",
    },
    {
      id:          "badge-no-hints",
      name:        "Flying Solo",
      description: "Completed a session without a single hint!",
      iconUrl:     "/badges/flying-solo.svg",
      category:    "session",
      xpBonus:     15,
      earnedAt:    "2026-03-04T16:45:00Z",
    },
  ],

  quests: [
    {
      id:           "dq-correct-5-1741478400000",
      title:        "Answer 5 Questions Correctly",
      description:  "Get 5 answers right today — you can do it!",
      targetCount:  5,
      currentCount: 3,
      xpReward:     20,
      expiresAt:    "2026-03-09T23:59:59Z",
    },
    {
      id:           "dq-session-1741478400000",
      title:        "Daily Practice",
      description:  "Complete a full practice session today.",
      targetCount:  1,
      currentCount: 0,
      xpReward:     10,
      expiresAt:    "2026-03-09T23:59:59Z",
    },
    {
      id:           "dq-two-topics-1741478400000",
      title:        "Topic Hopper",
      description:  "Practice 2 different math topics today.",
      targetCount:  2,
      currentCount: 1,
      xpReward:     15,
      expiresAt:    "2026-03-09T23:59:59Z",
    },
  ],

  recommendedLesson: {
    topicId:     "g4-fractions-add",
    topicName:   "Adding Fractions",
    lessonTitle: "Unlike Denominators",
    reason:      "in_progress",
  },
};
