/**
 * @module apps/web/types/contracts
 *
 * Frontend view contracts — the data shapes that containers pass to view
 * components. These are NOT the same as API types from @mathai/shared-types.
 *
 * API types describe what the Express backend returns.
 * View contracts describe what each screen's view component needs to render.
 *
 * Containers are responsible for mapping API types → view contracts.
 * Views only import from here — never from @mathai/shared-types directly.
 *
 * Naming convention: <ScreenName>ViewData
 */

import type {
  XPStatus,
  StreakStatus,
  EarnedBadge,
  DailyQuest,
  MasteryLevel,
  WeakArea,
  PracticeMenu,
  StudentProfileResponse,
} from "@mathai/shared-types";

// ─── Dashboard ─────────────────────────────────────────────────────────────────

/** Top-level contract for DashboardView */
export interface DashboardViewData {
  student: {
    name:  string;
    grade: string;
  };
  xp:     XPStatus | null;
  streak: StreakStatus | null;

  /**
   * "Continue Learning" — the most relevant in-progress or unlocked topic.
   * Null when no topics are available yet (new student).
   */
  continueLearning: ContinueLearningItem | null;

  /** Daily quests + completion summary for the "Daily Mission" section */
  dailyMission: DailyMissionData;

  /** Compact XP + mastery numbers for the bottom "Progress Summary" strip */
  progressSummary: ProgressSummaryData | null;
}

export interface ContinueLearningItem {
  topicId:      string;
  topicName:    string;
  icon:         string;
  masteryLevel: MasteryLevel;
  /** Button label — "Continue →" or "Start Learning →" */
  ctaLabel:     string;
}

export interface DailyMissionData {
  quests:         DailyQuest[];
  completedCount: number;
  totalCount:     number;
}

export interface ProgressSummaryData {
  level:          number;
  levelTitle:     string;
  totalXP:        number;
  masteredTopics: number;
  totalTopics:    number;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/** Top-level contract for ProgressView */
export interface ProgressViewData {
  xp:             XPStatus | null;
  streak:         StreakStatus | null;
  masteredTopics: number;
  totalTopics:    number;
  totalXp:        number;
  weakAreas:      WeakArea[];
  badges:         EarnedBadge[];
  curriculum:     CurriculumViewItem[];
}

export interface CurriculumViewItem {
  strand: {
    id:        string;
    name:      string;
    iconEmoji: string | undefined;
  };
  topics: CurriculumTopicItem[];
}

export interface CurriculumTopicItem {
  id:           string;
  name:         string;
  isUnlocked:   boolean;
  grade:        string;
  masteryLevel: MasteryLevel;
}

// ─── Practice ─────────────────────────────────────────────────────────────────

/** Props for the practice question view */
export interface PracticeViewData {
  topicId:    string;
  mode:       string;
  sessionId:  string | null;
  questions:  PracticeQuestionItem[];
  currentIndex: number;
  xpEarned:   number;
}

export interface PracticeQuestionItem {
  id:            string;
  prompt:        string;
  type:          string;
  options?:      string[];
  correctAnswer: string;
  explanation:   string;
  xpReward:      number;
  difficulty:    string;
}

/** Result after submitting an answer */
export interface SubmitResultView {
  isCorrect:     boolean;
  correctAnswer: string;
  xpEarned:      number;
  encouragement: string;
  sessionComplete: boolean;
  nextAction:    string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/** Contract for ProfileModal view */
export type ProfileViewData = StudentProfileResponse;

// ─── Practice Menu ────────────────────────────────────────────────────────────

/** Contract for PracticeMenu views — re-export from shared-types directly */
export type PracticeMenuViewData = PracticeMenu;
