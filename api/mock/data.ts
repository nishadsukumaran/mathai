/**
 * @module api/mock/data
 *
 * In-memory mock data store.
 * Used by all services until Prisma queries are wired.
 *
 * SHAPE: every record matches the Prisma schema 1-to-1.
 * Replacing a service method with a real Prisma call requires
 * zero changes to controller or route code.
 *
 * IDs are stable strings so integration tests can reference them.
 */

import type {
  User,
  StudentProfile,
  Streak,
  Topic,
  Lesson,
  PracticeSet,
  TopicProgress,
  Badge,
  EarnedBadge,
  DailyQuest,
  StudentQuestProgress,
  XPEvent,
  GamificationDashboard,
} from "@/types";
import {
  UserRole,
  Grade,
  Difficulty,
  MasteryLevel,
  PracticeMode,
  BadgeCategory,
  QuestType,
  QuestStatus,
  XPReason,
  LearningPace,
  Strand,
} from "@/types";

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id:         "user-alice-001",
    email:      "alice@mathai.test",
    name:       "Alice",
    role:       UserRole.Student,
    avatarUrl:  "/avatars/astronaut.png",
    gradeLevel: Grade.G4,
    createdAt:  new Date("2025-08-01"),
    updatedAt:  new Date("2025-08-01"),
  },
  {
    id:         "user-bob-002",
    email:      "bob@mathai.test",
    name:       "Bob",
    role:       UserRole.Student,
    avatarUrl:  "/avatars/robot.png",
    gradeLevel: Grade.G6,
    createdAt:  new Date("2025-09-15"),
    updatedAt:  new Date("2025-09-15"),
  },
  {
    id:         "student-stub-001",           // matches auth middleware stub
    email:      "dev@mathai.test",
    name:       "Dev Student",
    role:       UserRole.Student,
    gradeLevel: Grade.G4,
    createdAt:  new Date("2025-01-01"),
    updatedAt:  new Date("2025-01-01"),
  },
];

// ─── Student Profiles ─────────────────────────────────────────────────────────

export const MOCK_PROFILES: StudentProfile[] = [
  {
    id:              "profile-alice-001",
    userId:          "user-alice-001",
    learningPace:    LearningPace.Standard,
    confidenceLevel: 72,
    currentLevel:    4,
    totalXp:         850,
    streakCount:     7,
    preferredTheme:  "space",
    updatedAt:       new Date(),
  },
  {
    id:              "profile-bob-002",
    userId:          "user-bob-002",
    learningPace:    LearningPace.Fast,
    confidenceLevel: 55,
    currentLevel:    2,
    totalXp:         250,
    streakCount:     2,
    preferredTheme:  "ocean",
    updatedAt:       new Date(),
  },
  {
    id:              "profile-dev-stub",
    userId:          "student-stub-001",
    learningPace:    LearningPace.Standard,
    confidenceLevel: 50,
    currentLevel:    1,
    totalXp:         0,
    streakCount:     0,
    preferredTheme:  "space",
    updatedAt:       new Date(),
  },
];

// ─── Streaks ──────────────────────────────────────────────────────────────────

export const MOCK_STREAKS: Streak[] = [
  {
    id:             "streak-alice",
    userId:         "user-alice-001",
    currentStreak:  7,
    longestStreak:  12,
    lastActiveDate: new Date(),
    hasShield:      false,
    updatedAt:      new Date(),
  },
  {
    id:             "streak-bob",
    userId:         "user-bob-002",
    currentStreak:  2,
    longestStreak:  5,
    lastActiveDate: new Date(),
    hasShield:      false,
    updatedAt:      new Date(),
  },
  {
    id:             "streak-dev",
    userId:         "student-stub-001",
    currentStreak:  0,
    longestStreak:  0,
    lastActiveDate: undefined,
    hasShield:      false,
    updatedAt:      new Date(),
  },
];

// ─── Topics (subset — mirrors seed data) ─────────────────────────────────────

export const MOCK_TOPICS: Topic[] = [
  {
    id: "topic-counting-20",
    strandId: "strand-numbers",
    slug: "counting-to-20",
    name: "Counting to 20",
    description: "Count forwards and backwards from any number within 20.",
    gradeBand: Grade.K,
    difficulty: Difficulty.Beginner,
    prerequisites: [],
    masteryThreshold: 0.8,
    estimatedMinutes: 20,
    iconEmoji: "🔢",
    sortOrder: 1,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "topic-place-value-hundreds",
    strandId: "strand-numbers",
    slug: "place-value-hundreds",
    name: "Place Value to Hundreds",
    description: "Understand hundreds, tens, and ones using base-ten blocks.",
    gradeBand: Grade.G2,
    difficulty: Difficulty.Beginner,
    prerequisites: ["topic-counting-20"],
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    iconEmoji: "🏛️",
    sortOrder: 2,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "topic-multiplication-tables",
    strandId: "strand-operations",
    slug: "multiplication-tables",
    name: "Multiplication Tables (2–10)",
    description: "Build fluency with multiplication facts through patterns and arrays.",
    gradeBand: Grade.G3,
    difficulty: Difficulty.Intermediate,
    prerequisites: ["topic-place-value-hundreds"],
    masteryThreshold: 0.9,
    estimatedMinutes: 45,
    iconEmoji: "✖️",
    sortOrder: 3,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "topic-equivalent-fractions",
    strandId: "strand-fractions",
    slug: "equivalent-fractions",
    name: "Equivalent Fractions",
    description: "Find and generate equivalent fractions; simplify to lowest terms.",
    gradeBand: Grade.G4,
    difficulty: Difficulty.Intermediate,
    prerequisites: ["topic-multiplication-tables"],
    masteryThreshold: 0.8,
    estimatedMinutes: 35,
    iconEmoji: "⚖️",
    sortOrder: 4,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "topic-adding-fractions",
    strandId: "strand-fractions",
    slug: "adding-fractions",
    name: "Adding & Subtracting Fractions",
    description: "Add and subtract fractions with like and unlike denominators.",
    gradeBand: Grade.G5,
    difficulty: Difficulty.Intermediate,
    prerequisites: ["topic-equivalent-fractions"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "🔂",
    sortOrder: 5,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "topic-perimeter-area",
    strandId: "strand-geometry",
    slug: "perimeter-area",
    name: "Perimeter & Area",
    description: "Calculate perimeter and area of rectangles, triangles, and composites.",
    gradeBand: Grade.G4,
    difficulty: Difficulty.Intermediate,
    prerequisites: ["topic-multiplication-tables"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "📐",
    sortOrder: 6,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

// ─── Lessons ──────────────────────────────────────────────────────────────────

export const MOCK_LESSONS: Lesson[] = [
  {
    id: "lesson-mult-1",
    topicId: "topic-multiplication-tables",
    title: "Multiplication as Repeated Addition",
    objective: "Explain multiplication as repeated addition and model with arrays.",
    contentSummary: "4 × 3 means 4 groups of 3. Draw arrays to visualise rows and columns.",
    orderIndex: 1,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "lesson-mult-2",
    topicId: "topic-multiplication-tables",
    title: "Memorising the 2s, 5s, and 10s Tables",
    objective: "Recall multiplication facts for 2, 5, and 10 with automaticity.",
    contentSummary: "The 2s follow even numbers. The 5s end in 0 or 5. The 10s add a zero.",
    orderIndex: 2,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "lesson-frac-equiv-1",
    topicId: "topic-equivalent-fractions",
    title: "Finding Equivalent Fractions",
    objective: "Generate equivalent fractions by multiplying numerator and denominator by the same number.",
    contentSummary: "Multiply or divide both parts by the same non-zero number: 1/2 = 2/4 = 4/8.",
    orderIndex: 1,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

// ─── Practice Sets ────────────────────────────────────────────────────────────

export const MOCK_PRACTICE_SETS: PracticeSet[] = [
  {
    id: "pset-mult-practice",
    topicId: "topic-multiplication-tables",
    lessonId: "lesson-mult-1",
    title: "Multiplication Tables — Practice",
    mode: PracticeMode.Practice,
    difficulty: Difficulty.Intermediate,
    questionCount: 10,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "pset-frac-equiv-practice",
    topicId: "topic-equivalent-fractions",
    lessonId: "lesson-frac-equiv-1",
    title: "Equivalent Fractions — Practice",
    mode: PracticeMode.Practice,
    difficulty: Difficulty.Intermediate,
    questionCount: 10,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "pset-frac-equiv-guided",
    topicId: "topic-equivalent-fractions",
    lessonId: "lesson-frac-equiv-1",
    title: "Equivalent Fractions — Guided",
    mode: PracticeMode.Guided,
    difficulty: Difficulty.Beginner,
    questionCount: 5,
    createdAt: new Date("2025-01-01"),
  },
];

// ─── Topic Progress ───────────────────────────────────────────────────────────

export const MOCK_TOPIC_PROGRESS: TopicProgress[] = [
  {
    id: "tp-alice-counting",
    userId: "user-alice-001",
    topicId: "topic-counting-20",
    masteryScore: 0.95,
    accuracyRate: 0.95,
    completionPercent: 1.0,
    isUnlocked: true,
    isMastered: true,
    lastPracticedAt: new Date("2025-11-01"),
    updatedAt: new Date("2025-11-01"),
  },
  {
    id: "tp-alice-place-value",
    userId: "user-alice-001",
    topicId: "topic-place-value-hundreds",
    masteryScore: 0.88,
    accuracyRate: 0.88,
    completionPercent: 1.0,
    isUnlocked: true,
    isMastered: true,
    lastPracticedAt: new Date("2025-11-10"),
    updatedAt: new Date("2025-11-10"),
  },
  {
    id: "tp-alice-mult",
    userId: "user-alice-001",
    topicId: "topic-multiplication-tables",
    masteryScore: 0.72,
    accuracyRate: 0.74,
    completionPercent: 0.6,
    isUnlocked: true,
    isMastered: false,
    lastPracticedAt: new Date("2025-12-01"),
    updatedAt: new Date("2025-12-01"),
  },
  {
    id: "tp-alice-equiv-frac",
    userId: "user-alice-001",
    topicId: "topic-equivalent-fractions",
    masteryScore: 0.45,
    accuracyRate: 0.48,
    completionPercent: 0.4,
    isUnlocked: true,
    isMastered: false,
    lastPracticedAt: new Date("2025-12-10"),
    updatedAt: new Date("2025-12-10"),
  },
];

// ─── Badges ───────────────────────────────────────────────────────────────────

export const MOCK_BADGES: Badge[] = [
  {
    id: "badge-001", code: "badge-perfect-score",
    title: "Perfect Score!", description: "Got every question right in a session.",
    iconUrl: "/badges/perfect-score.svg", category: BadgeCategory.Accuracy, xpReward: 30,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "badge-002", code: "badge-flying-solo",
    title: "Flying Solo", description: "Completed a full session without hints.",
    iconUrl: "/badges/flying-solo.svg", category: BadgeCategory.Accuracy, xpReward: 20,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "badge-003", code: "badge-streak-7",
    title: "Week Warrior", description: "7-day streak!",
    iconUrl: "/badges/streak-7.svg", category: BadgeCategory.Streak, xpReward: 25,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "badge-004", code: "badge-topic-conqueror",
    title: "Topic Conqueror", description: "Achieved Mastered status on any topic.",
    iconUrl: "/badges/topic-conqueror.svg", category: BadgeCategory.Accuracy, xpReward: 50,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "badge-005", code: "badge-comeback-kid",
    title: "Comeback Kid", description: "Got it wrong first but nailed it on the retry.",
    iconUrl: "/badges/comeback-kid.svg", category: BadgeCategory.Persistence, xpReward: 15,
    createdAt: new Date("2025-01-01"),
  },
];

export const MOCK_EARNED_BADGES: EarnedBadge[] = [
  {
    ...MOCK_BADGES[2]!, // Week Warrior
    userId: "user-alice-001", badgeId: "badge-003", awardedAt: new Date("2025-11-07"),
  },
  {
    ...MOCK_BADGES[0]!, // Perfect Score
    userId: "user-alice-001", badgeId: "badge-001", awardedAt: new Date("2025-11-15"),
  },
];

// ─── Daily Quests ─────────────────────────────────────────────────────────────

export const MOCK_QUESTS: DailyQuest[] = [
  {
    id: "quest-001",
    title: "Answer 5 Questions Correctly",
    description: "Get 5 answers right today across any topic.",
    xpReward: 20,
    questType: QuestType.Daily,
    difficulty: Difficulty.Beginner,
    targetValue: 5,
    trackingKey: "correct_answers",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "quest-002",
    title: "Complete a Full Practice Set",
    description: "Finish one complete practice set from start to finish.",
    xpReward: 25,
    questType: QuestType.Daily,
    difficulty: Difficulty.Intermediate,
    targetValue: 1,
    trackingKey: "sessions_completed",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "quest-003",
    title: "Practise for 10 Minutes",
    description: "Spend at least 10 minutes practising today.",
    xpReward: 15,
    questType: QuestType.Daily,
    difficulty: Difficulty.Beginner,
    targetValue: 10,
    trackingKey: "minutes_practiced",
    createdAt: new Date("2025-01-01"),
  },
];

/** Helper to get the end-of-today timestamp. */
function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export const MOCK_STUDENT_QUESTS: StudentQuestProgress[] = [
  {
    id: "sqp-alice-001",
    userId: "user-alice-001",
    questId: "quest-001",
    quest: MOCK_QUESTS[0],
    status: QuestStatus.Active,
    progressValue: 3,
    completedAt: undefined,
    expiresAt: endOfToday(),
    createdAt: new Date(),
  },
  {
    id: "sqp-alice-002",
    userId: "user-alice-001",
    questId: "quest-002",
    quest: MOCK_QUESTS[1],
    status: QuestStatus.Completed,
    progressValue: 1,
    completedAt: new Date(),
    expiresAt: endOfToday(),
    createdAt: new Date(),
  },
];

// ─── XP Events ────────────────────────────────────────────────────────────────

export const MOCK_XP_EVENTS: XPEvent[] = [
  { id: "xp-01", userId: "user-alice-001", amount: 10, reason: XPReason.CorrectAnswer, createdAt: new Date("2025-12-01") },
  { id: "xp-02", userId: "user-alice-001", amount: 5,  reason: XPReason.DailyLogin,    createdAt: new Date("2025-12-01") },
  { id: "xp-03", userId: "user-alice-001", amount: 25, reason: XPReason.QuestComplete, createdAt: new Date("2025-12-02") },
  { id: "xp-04", userId: "user-alice-001", amount: 50, reason: XPReason.BadgeEarned,   createdAt: new Date("2025-12-03"), metadata: { badgeCode: "badge-topic-conqueror" } },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function findUser(id: string): User | undefined {
  return MOCK_USERS.find(u => u.id === id);
}

export function findProfile(userId: string): StudentProfile | undefined {
  return MOCK_PROFILES.find(p => p.userId === userId);
}

export function findStreak(userId: string): Streak | undefined {
  return MOCK_STREAKS.find(s => s.userId === userId);
}

export function findTopicProgress(userId: string): TopicProgress[] {
  return MOCK_TOPIC_PROGRESS.filter(tp => tp.userId === userId);
}

export function findEarnedBadges(userId: string): EarnedBadge[] {
  return MOCK_EARNED_BADGES.filter(b => b.userId === userId);
}

export function findStudentQuests(userId: string): StudentQuestProgress[] {
  return MOCK_STUDENT_QUESTS.filter(sq => sq.userId === userId);
}

export function findXPEvents(userId: string): XPEvent[] {
  return MOCK_XP_EVENTS.filter(e => e.userId === userId);
}

export function findTopicById(topicId: string): Topic | undefined {
  return MOCK_TOPICS.find(t => t.id === topicId || t.slug === topicId);
}

export function findPracticeSet(id: string): PracticeSet | undefined {
  return MOCK_PRACTICE_SETS.find(ps => ps.id === id);
}
