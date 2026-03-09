/**
 * Mock responses for:
 *   GET /api/progress/:studentId         → MOCK_PROGRESS
 *   GET /api/curriculum/weak-areas/:id   → MOCK_WEAK_AREAS
 *   GET /api/daily-quests/:studentId     → MOCK_DAILY_QUESTS
 * Screens: /progress, /dashboard (quests panel)
 */

import type { ProgressData, WeakArea, DailyQuest } from "@mathai/shared-types";

export const MOCK_PROGRESS: ProgressData = {
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
  topicsStarted:   4,
  topicsMastered:  1,
  totalSessions:   18,
  totalQuestions:  142,
  overallAccuracy: 74,
  topicProgress: [
    {
      topicId:        "g4-multiplication",
      topicName:      "Multi-Digit Multiplication",
      masteryLevel:   "mastered",
      accuracyPct:    92,
      questionsTotal: 65,
      lastPracticed:  "2026-03-05",
    },
    {
      topicId:        "g4-fractions-add",
      topicName:      "Adding Fractions",
      masteryLevel:   "developing",
      accuracyPct:    68,
      questionsTotal: 48,
      lastPracticed:  "2026-03-08",
    },
    {
      topicId:        "g4-place-value",
      topicName:      "Place Value to Millions",
      masteryLevel:   "emerging",
      accuracyPct:    55,
      questionsTotal: 22,
      lastPracticed:  "2026-03-06",
    },
    {
      topicId:        "g4-fractions-sub",
      topicName:      "Subtracting Fractions",
      masteryLevel:   "not_started",
      accuracyPct:    0,
      questionsTotal: 0,
      lastPracticed:  undefined,
    },
  ],
};

export const MOCK_WEAK_AREAS: WeakArea[] = [
  {
    topicId:      "g4-place-value",
    topicName:    "Place Value to Millions",
    masteryLevel: "emerging",
    accuracyPct:  55,
    reason:       "Accuracy below 60% across 4 sessions",
    actionLabel:  "Practice Place Value",
  },
  {
    topicId:      "g4-fractions-add",
    topicName:    "Adding Fractions",
    masteryLevel: "developing",
    accuracyPct:  68,
    reason:       "Common mistakes with unlike denominators",
    actionLabel:  "Practice Fractions",
  },
];

export const MOCK_DAILY_QUESTS: DailyQuest[] = [
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
];
