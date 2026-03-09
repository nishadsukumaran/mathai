/**
 * @package shared-types
 *
 * Canonical frontend-facing types for MathAI.
 *
 * These are the shapes that the API actually delivers to the browser.
 * They are intentionally a subset of the backend's types/index.ts —
 * stripped of DB internals, service-layer details, and engine artefacts.
 *
 * RULE: If a field is not rendered in the UI, it is not in this file.
 *
 * USAGE (apps/web):
 *   import type { DashboardData, PracticeQuestion, TutorResponse } from "@mathai/shared-types";
 */

// ─── Primitives ────────────────────────────────────────────────────────────────

export type Grade = "G1" | "G2" | "G3" | "G4" | "G5";

export type MasteryLevel =
  | "not_started"
  | "emerging"
  | "developing"
  | "mastered"
  | "extended";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "challenge";

export type PracticeMode =
  | "topic_practice"
  | "daily_challenge"
  | "weak_area_booster"
  | "guided"
  | "review";

export type QuestionType = "fill_in_blank" | "multiple_choice" | "true_false";

export type HelpMode =
  | "hint_1"
  | "hint_2"
  | "next_step"
  | "explain_fully"
  | "teach_concept"
  | "similar_example";

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    count?: number;
    page?: number;
    [key: string]: unknown;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Student / Auth ───────────────────────────────────────────────────────────

export interface StudentSummary {
  id:          string;
  displayName: string;
  avatarUrl?:  string;
  grade:       Grade;
}

// ─── XP & Level ───────────────────────────────────────────────────────────────

export interface XPStatus {
  totalXP:       number;
  level:         number;
  levelTitle:    string;         // e.g. "Number Explorer"
  xpInLevel:     number;         // XP accumulated within current level
  xpToNextLevel: number;         // XP needed to reach the next level
  progressPct:   number;         // 0–100, for the XP bar
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export interface StreakStatus {
  currentStreak:  number;
  longestStreak:  number;
  lastActiveDate: string;        // ISO date string
  shieldActive:   boolean;       // Streak shield protects one missed day
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export type BadgeCategory =
  | "mastery"
  | "streak"
  | "session"
  | "exploration"
  | "challenge"
  | "persistence";

export interface EarnedBadge {
  id:          string;
  name:        string;
  description: string;
  iconUrl:     string;
  category:    BadgeCategory;
  xpBonus:     number;
  earnedAt:    string;           // ISO datetime string
}

// ─── Quests ───────────────────────────────────────────────────────────────────

export interface DailyQuest {
  id:           string;
  title:        string;
  description:  string;
  targetCount:  number;
  currentCount: number;
  xpReward:     number;
  expiresAt:    string;          // ISO datetime string
  completedAt?: string;          // ISO datetime string — present when done
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  student:       StudentSummary;
  xp:            XPStatus;
  streak:        StreakStatus;
  recentBadges:  EarnedBadge[];  // last 3 earned
  quests:        DailyQuest[];   // today's 3 quests
  recommendedLesson?: RecommendedLesson;
}

export interface RecommendedLesson {
  topicId:     string;
  topicName:   string;
  lessonTitle: string;
  reason:      "in_progress" | "weak_area" | "next_unlocked";
}

// ─── Curriculum ───────────────────────────────────────────────────────────────

export interface TopicSummary {
  id:           string;
  name:         string;
  description:  string;
  grade:        Grade;
  strand:       string;          // e.g. "Number & Operations"
  masteryLevel: MasteryLevel;
  isUnlocked:   boolean;
  lessonCount:  number;
  iconSlug:     string;          // used to pick icon in UI (e.g. "fractions", "multiplication")
}

export interface CurriculumData {
  grade:        Grade;
  topics:       TopicSummary[];
}

// ─── Topic Detail ─────────────────────────────────────────────────────────────

export type LessonState = "locked" | "unlocked" | "in_progress" | "completed" | "mastered";

export interface LessonSummary {
  id:           string;
  title:        string;
  description:  string;
  state:        LessonState;
  estimatedMin: number;          // estimated time in minutes
  xpReward:     number;
}

export interface TopicDetail {
  id:           string;
  name:         string;
  description:  string;
  grade:        Grade;
  strand:       string;
  masteryLevel: MasteryLevel;
  isUnlocked:   boolean;
  lessons:      LessonSummary[];
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface ProgressData {
  student:        StudentSummary;
  xp:             XPStatus;
  streak:         StreakStatus;
  topicsStarted:  number;
  topicsMastered: number;
  totalSessions:  number;
  totalQuestions: number;
  overallAccuracy: number;       // 0–100 percent
  topicProgress:  TopicProgressItem[];
}

export interface TopicProgressItem {
  topicId:        string;
  topicName:      string;
  masteryLevel:   MasteryLevel;
  accuracyPct:    number;        // 0–100
  questionsTotal: number;
  lastPracticed?: string;        // ISO date string
}

// ─── Weak Areas ───────────────────────────────────────────────────────────────

export interface WeakArea {
  topicId:     string;
  topicName:   string;
  masteryLevel: MasteryLevel;
  accuracyPct: number;
  reason:      string;           // e.g. "Low accuracy across 3 sessions"
  actionLabel: string;           // e.g. "Practice Fractions"
}

// ─── Practice Session ─────────────────────────────────────────────────────────

export interface PracticeStartRequest {
  topicId:       string;
  mode:          PracticeMode;
  grade:         Grade;
  difficulty?:   Difficulty;
  questionCount?: number;
}

export interface PracticeSession {
  sessionId:      string;
  topicId:        string;
  mode:           PracticeMode;
  totalQuestions: number;
  currentIndex:   number;        // 0-based
  xpEarned:       number;
  currentQuestion: PracticeQuestion;
}

export interface PracticeQuestion {
  id:           string;
  type:         QuestionType;
  prompt:       string;
  options?:     string[];        // only for multiple_choice
  difficulty:   Difficulty;
  xpReward:     number;
  // Note: correctAnswer NOT sent to frontend until after submission
}

// ─── Practice Submission ──────────────────────────────────────────────────────

export interface SubmitAnswerRequest {
  sessionId:     string;
  questionId:    string;
  studentAnswer: string;
  timeSpentSeconds: number;
}

export interface SubmissionResult {
  isCorrect:      boolean;
  correctAnswer:  string;
  xpEarned:       number;
  encouragement:  string;
  misconceptionTag?: string;
  nextAction:     "next_question" | "session_complete" | "retry";
  levelUp?:       { newLevel: number; newTitle: string };
  sessionComplete?: SessionSummary;
  masteryUpdate?: { topicId: string; newLevel: MasteryLevel };
  questUpdate?:   { questId: string; completed: boolean; newCount: number };
  nextQuestion?:  PracticeQuestion;
}

export interface SessionSummary {
  sessionId:      string;
  totalQuestions: number;
  correctCount:   number;
  accuracyPct:    number;
  xpEarned:       number;
  badgesEarned:   EarnedBadge[];
  masteryUpdate?: { topicId: string; newLevel: MasteryLevel };
}

// ─── Tutor / Hints ────────────────────────────────────────────────────────────

export interface HintRequest {
  sessionId:  string;
  questionId: string;
  hintsUsed:  number;           // 0, 1, or 2 — determines hint level
}

export interface ExplanationRequest {
  sessionId:  string;
  questionId: string;
}

export interface TutorResponse {
  helpMode:      HelpMode;
  encouragement: string;
  content: {
    text:     string;
    steps?:   TutorStep[];
    concept?: string;
  };
  visualPlan?: VisualPlan;
  similarExample?: TutorExample;
}

export interface TutorStep {
  stepNumber:  number;
  instruction: string;
  formula?:    string;           // LaTeX — render with KaTeX
  visualCue?:  string;
}

export interface TutorExample {
  questionText: string;
  workingSteps: TutorStep[];
  answer:       string;
  keyInsight:   string;
}

export interface VisualPlan {
  diagramType:
    | "number_line"
    | "array"
    | "bar_model"
    | "fraction_bar"
    | "place_value_chart"
    | "coordinate_grid"
    | "none";
  data: Record<string, unknown>;
}

// ─── Error codes (known) ──────────────────────────────────────────────────────

export const API_ERROR_CODES = {
  NOT_FOUND:       "NOT_FOUND",
  UNAUTHORIZED:    "UNAUTHORIZED",
  FORBIDDEN:       "FORBIDDEN",
  VALIDATION:      "VALIDATION_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  NETWORK:         "NETWORK_ERROR",
  UNKNOWN:         "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
