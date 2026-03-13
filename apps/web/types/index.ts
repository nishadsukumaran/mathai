/**
 * @module apps/web/types
 *
 * Frontend type barrel. Re-exports all shared API types from @mathai/shared-types
 * and adds frontend-only types (UI state, page props, component props).
 *
 * USAGE:
 *   import type { DashboardData, PageState, PracticeSearchParams } from "@/types";
 *
 * Never import directly from @mathai/shared-types in app code —
 * always go through this barrel so we have one place to add UI extensions.
 */

// ─── Re-export all shared API types ───────────────────────────────────────────

export type {
  Grade,
  MasteryLevel,
  Difficulty,
  PracticeMode,
  QuestionType,
  HelpMode,
  BadgeCategory,
  LessonState,

  // Envelope
  ApiSuccess,
  ApiError,
  ApiResponse,
  ApiErrorCode,

  // Domain entities
  StudentSummary,
  XPStatus,
  StreakStatus,
  EarnedBadge,
  DailyQuest,
  RecommendedLesson,
  TopicSummary,
  TopicDetail,
  LessonSummary,
  CurriculumData,
  ProgressData,
  TopicProgressItem,
  WeakArea,
  DashboardData,

  // Practice
  PracticeStartRequest,
  PracticeSession,
  PracticeQuestion,
  SubmitAnswerRequest,
  SubmissionResult,
  SessionSummary,

  // Tutor
  HintRequest,
  ExplanationRequest,
  TutorResponse,
  TutorStep,
  TutorExample,
  VisualPlan,
  NumberLineData,
  FractionBarData,
  ArrayData,
  BarModelData,
  PlaceValueChartData,

  // Ask MathAI
  AskRequest,
  AskStep,
  AskMathAIResponse,

  // Profile
  LearningPace,
  ExplanationStyle,
  StudentProfileResponse,
  UpdateProfileRequest,

  // Practice Menu
  PracticeMenuSectionType,
  PracticeMenuItem,
  PracticeMenuSection,
  PracticeMenu,

  // Pet system
  PetCatalogEntry,
  PetResponse,
  PersonalityEffects,
} from "@mathai/shared-types";

export { API_ERROR_CODES } from "@mathai/shared-types";

// ─── View contracts ────────────────────────────────────────────────────────────
// What containers pass to view components (mapped from API types)

export type {
  DashboardViewData,
  ContinueLearningItem,
  DailyMissionData,
  ProgressSummaryData,
  ProgressViewData,
  CurriculumViewItem,
  CurriculumTopicItem,
  PracticeViewData,
  PracticeQuestionItem,
  SubmitResultView,
  ProfileViewData,
  PracticeMenuViewData,
} from "./contracts";

// ─── UI State types ────────────────────────────────────────────────────────────

/** Generic async data state for any fetch hook */
export interface AsyncState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
}

/** Sub-states of the practice session screen */
export type PracticeScreenState =
  | "idle"           // Not yet started
  | "loading"        // Session starting / answer submitting
  | "active"         // Student viewing a question
  | "submitted"      // Answer submitted, showing feedback overlay
  | "tutor"          // AI tutor panel open
  | "complete";      // Session finished, showing score screen

/** Feedback type after answer submission */
export type FeedbackType = "correct" | "wrong" | null;

// ─── Page / Route types ────────────────────────────────────────────────────────

/** Next.js page props (App Router) */
export interface PageProps {
  params:       Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
}

/** URL search params for /practice */
export interface PracticeSearchParams {
  topicId?:  string;
  lessonId?: string;
  mode?:     string; // PracticeMode — validated at runtime
  grade?:    string; // Grade — validated at runtime
}

// ─── Component prop utilities ──────────────────────────────────────────────────

/** Common className prop used on all styled components */
export interface WithClassName {
  className?: string;
}

/** Size variants used across multiple components */
export type ComponentSize = "sm" | "md" | "lg";
