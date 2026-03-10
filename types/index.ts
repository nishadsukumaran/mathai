/**
 * @module types/index
 *
 * Single source of truth for all shared TypeScript interfaces and enums
 * across the MathAI monorepo (api/, ai/, curriculum/, services/, apps/web/).
 *
 * RULES
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Every enum value MUST match its Prisma counterpart in schema.prisma.
 *   2. Interface field names MUST match Prisma model field names exactly.
 *   3. No business logic here — only pure type definitions.
 *   4. Optional fields use `?` (not `| undefined | null`).
 *   5. All date fields are typed as `Date` at the application boundary;
 *      JSON serialisation turns them into ISO strings — handle in the API layer.
 *
 * STRUCTURE
 * ─────────────────────────────────────────────────────────────────────────────
 *   Enums → User & Identity → Curriculum → Sessions & Attempts →
 *   Progress → Gamification → AI Tutor → API contracts
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

/** Account type — drives routing and permission checks. */
export enum UserRole {
  Student  = "student",
  Parent   = "parent",
  Teacher  = "teacher",
  Admin    = "admin",
}

/** Curriculum grade bands. */
export enum Grade {
  K  = "K",
  G1 = "G1",
  G2 = "G2",
  G3 = "G3",
  G4 = "G4",
  G5 = "G5",
  G6 = "G6",
  G7 = "G7",
  G8 = "G8",
}

/** Top-level mathematical strands. */
export enum Strand {
  Numbers             = "Numbers",
  Operations          = "Operations",
  Fractions           = "Fractions",
  Decimals            = "Decimals",
  Geometry            = "Geometry",
  Measurement         = "Measurement",
  Algebra             = "Algebra",
  WordProblems        = "WordProblems",
  DataAndProbability  = "DataAndProbability",
}

/** Difficulty levels for questions, practice sets, and quests. */
export enum Difficulty {
  Beginner     = "beginner",
  Intermediate = "intermediate",
  Advanced     = "advanced",
  Challenge    = "challenge",
}

/** Topic mastery progression. Thresholds defined in MasteryEvaluator. */
export enum MasteryLevel {
  NotStarted = "not_started",
  Emerging   = "emerging",    // < 40 % accuracy
  Developing = "developing",  // 40–69 %
  Mastered   = "mastered",    // 70–89 %
  Extended   = "extended",    // ≥ 90 %, consistent
}

/** Controls AI tutor behaviour and hint availability. */
export enum PracticeMode {
  Guided    = "guided",     // step-by-step scaffolding, unlimited hints
  Practice  = "practice",   // standard, limited hints
  Challenge = "challenge",  // timed, no hints, bonus XP
  Review    = "review",     // spaced-repetition of weak areas
}

/** Supported question formats. */
export enum QuestionType {
  MultipleChoice = "multiple_choice",
  FillInBlank    = "fill_in_blank",
  TrueFalse      = "true_false",
  WordProblem    = "word_problem",
  DragAndDrop    = "drag_and_drop",
}

/** Reasons XP can be awarded — used for analytics and audit trail. */
export enum XPReason {
  CorrectAnswer      = "correct_answer",
  RetrySuccess       = "retry_success",
  DailyLogin         = "daily_login",
  LessonComplete     = "lesson_complete",
  ChallengeComplete  = "challenge_complete",
  StreakBonus        = "streak_bonus",
  BadgeEarned        = "badge_earned",
  QuestComplete      = "quest_complete",
}

/** Groupings for badge display and filtering. */
export enum BadgeCategory {
  Accuracy    = "accuracy",
  Streak      = "streak",
  Speed       = "speed",
  Persistence = "persistence",
  Exploration = "exploration",
}

/** Quest refresh cadence. */
export enum QuestType {
  Daily  = "daily",
  Weekly = "weekly",
}

/** Quest completion lifecycle. */
export enum QuestStatus {
  Active    = "active",
  Completed = "completed",
  Expired   = "expired",
}

/** AI tutor pacing preference — adjusts hint density and content depth. */
export enum LearningPace {
  Slow     = "slow",
  Standard = "standard",
  Fast     = "fast",
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER & IDENTITY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Core identity record — one row per human account.
 * Matches the `users` table in schema.prisma.
 */
export interface User {
  id:         string;
  email:      string;
  name:       string;
  role:       UserRole;
  avatarUrl?: string;
  gradeLevel?: Grade;  // populated for students; null for adults
  createdAt:  Date;
  updatedAt:  Date;
}

/**
 * Extended learning metadata for student users.
 * Matches the `student_profiles` table in schema.prisma.
 */
export interface StudentProfile {
  id:              string;
  userId:          string;
  learningPace:    LearningPace;
  confidenceLevel: number;   // 0–100
  currentLevel:    number;   // gamification level
  totalXp:         number;
  streakCount:     number;
  preferredTheme:  string;
  updatedAt:       Date;
}

/**
 * User enriched with their StudentProfile — the shape most of the
 * application uses when it needs "the current student".
 */
export interface StudentWithProfile extends User {
  profile:     StudentProfile;
  masteryMap:  Record<string, MasteryLevel>;  // topicId → mastery
  weakAreas:   string[];   // topicIds needing review
  strongAreas: string[];   // topicIds at mastered / extended
}

/**
 * Daily login streak record.
 * Matches the `streaks` table.
 */
export interface Streak {
  id:             string;
  userId:         string;
  currentStreak:  number;
  longestStreak:  number;
  lastActiveDate?: Date;
  hasShield:      boolean;
  updatedAt:      Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CURRICULUM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Top-level grouping of topics by mathematical strand.
 * Matches the `curriculum_strands` table.
 */
export interface CurriculumStrand {
  id:          string;
  slug:        string;
  name:        string;
  description: string;
  iconEmoji?:  string;
  sortOrder:   number;
  topics?:     Topic[];  // hydrated when fetching the full curriculum tree
}

/**
 * A discrete unit of study within a strand.
 * Topics are the primary mastery unit.
 * Matches the `topics` table.
 */
export interface Topic {
  id:               string;
  strandId:         string;
  slug:             string;
  name:             string;
  description:      string;
  gradeBand:        Grade;
  difficulty:       Difficulty;
  prerequisites:    string[];   // array of topic IDs
  masteryThreshold: number;     // 0–1
  estimatedMinutes: number;
  iconEmoji?:       string;
  sortOrder:        number;
  createdAt:        Date;
  updatedAt:        Date;
  lessons?:         Lesson[];
}

/**
 * A focused instructional unit within a topic.
 * Matches the `lessons` table.
 */
export interface Lesson {
  id:             string;
  topicId:        string;
  title:          string;
  objective:      string;
  contentSummary: string;
  orderIndex:     number;
  createdAt:      Date;
  updatedAt:      Date;
}

/**
 * A named collection of questions students work through in a session.
 * Matches the `practice_sets` table.
 */
export interface PracticeSet {
  id:            string;
  topicId:       string;
  lessonId?:     string;
  title:         string;
  mode:          PracticeMode;
  difficulty:    Difficulty;
  questionCount: number;
  createdAt:     Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSIONS & ATTEMPTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A single sitting at a PracticeSet.
 * Matches the `practice_sessions` table.
 */
export interface PracticeSession {
  id:              string;
  userId:          string;
  practiceSetId:   string;
  lessonId?:       string;
  mode:            PracticeMode;
  startedAt:       Date;
  completedAt?:    Date;
  xpEarned:        number;
  accuracyPercent: number;
  questionsCount:  number;
}

/**
 * One student response to one question within a session.
 * Atomic analytics unit — every mastery score and misconception report
 * is derived from this table.
 * Matches the `question_attempts` table.
 */
export interface QuestionAttempt {
  id:               string;
  sessionId:        string;
  userId:           string;
  topicId:          string;
  practiceSetId:    string;
  questionText:     string;
  studentAnswer:    string;
  correctAnswer:    string;
  isCorrect:        boolean;
  hintsUsed:        number;
  explanationUsed:  boolean;
  confidenceBefore?: number;  // 1–5
  confidenceAfter?:  number;  // 1–5
  timeSpentSeconds: number;
  misconceptionTag?: string;
  createdAt:        Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS & MASTERY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Aggregate topic-level progress for one student.
 * Updated after every session by the MasteryEvaluator.
 * Matches the `topic_progress` table.
 */
export interface TopicProgress {
  id:                string;
  userId:            string;
  topicId:           string;
  masteryScore:      number;      // 0–1 continuous
  accuracyRate:      number;      // 0–1 rolling
  completionPercent: number;      // 0–1
  isUnlocked:        boolean;
  isMastered:        boolean;
  lastPracticedAt?:  Date;
  updatedAt:         Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Immutable XP ledger entry.
 * Matches the `xp_events` table.
 */
export interface XPEvent {
  id:        string;
  userId:    string;
  amount:    number;
  reason:    XPReason;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Badge catalog entry — the master definition of an earnable badge.
 * Matches the `badges` table.
 */
export interface Badge {
  id:          string;
  code:        string;      // stable machine key e.g. "badge-streak-7"
  title:       string;
  description: string;
  iconUrl?:    string;
  category:    BadgeCategory;
  xpReward:    number;
  createdAt:   Date;
}

/**
 * A badge that has been earned by a specific student.
 * Matches the `student_badges` table with badge details hydrated.
 */
export interface EarnedBadge extends Badge {
  userId:    string;
  badgeId:   string;
  awardedAt: Date;
}

/**
 * Quest template definition.
 * Matches the `daily_quests` table.
 */
export interface DailyQuest {
  id:          string;
  title:       string;
  description: string;
  xpReward:    number;
  questType:   QuestType;
  difficulty:  Difficulty;
  targetValue: number;
  trackingKey: string;
  createdAt:   Date;
}

/**
 * A quest instance assigned to a specific student for a specific period.
 * Matches the `student_quest_progress` table with quest details hydrated.
 */
export interface StudentQuestProgress {
  id:            string;
  userId:        string;
  questId:       string;
  quest?:        DailyQuest;  // hydrated on reads
  status:        QuestStatus;
  progressValue: number;
  completedAt?:  Date;
  expiresAt:     Date;
  createdAt:     Date;
}

/** Gamification dashboard shape — returned by GET /gamification/dashboard. */
export interface GamificationDashboard {
  xp:           number;
  level:        number;
  xpToNextLevel: number;
  xpProgress:   number;  // 0–1 fraction toward next level
  streak:       number;
  hasStreakShield: boolean;
  recentBadges: EarnedBadge[];
  activeQuests: StudentQuestProgress[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════════

/** XP required for each gamification level. */
export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;        // "Math Seedling", "Math Explorer", …
  label?: string;       // Short display label
  badgeUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI TUTOR
// ═══════════════════════════════════════════════════════════════════════════════

/** Inbound request to the AI tutor orchestration pipeline. */
export interface TutorRequest {
  sessionId:    string;
  userId:       string;
  topicId:      string;
  questionText: string;
  studentAnswer?: string;
  hintsUsed:    number;
  intent:       TutorIntent;
  grade:        Grade;
}

/** Classification of what the student needs from the tutor. */
export enum TutorIntent {
  NeedsHint        = "needs_hint",
  NeedsExplanation = "needs_explanation",
  CheckAnswer      = "check_answer",
  RequestExample   = "request_example",
}

/** Full tutor response envelope. */
export interface TutorResponse {
  intent:       TutorIntent;
  hint?:        HintPayload;
  explanation?: ExplanationPayload;
  visualPlan?:  VisualPlanPayload;
  similarQuestion?: string;
  misconception?: string;
}

/** A single level of the 3-tier progressive hint system. */
export interface HintPayload {
  level:       1 | 2 | 3;  // 1 = gentle nudge, 3 = near-complete
  text:        string;
  visualCue?:  string;
  maxLevel:    number;
}

/** Step-by-step worked explanation. */
export interface ExplanationPayload {
  steps:       ExplanationStep[];
  summary:     string;
  conceptLinks: string[];  // related topic slugs for further reading
}

export interface ExplanationStep {
  stepNumber: number;
  text:       string;
  formula?:   string;     // LaTeX string rendered by KaTeX
  visualCue?: string;
}

/** Instructions for the frontend to render a visual math aid. */
export interface VisualPlanPayload {
  diagramType: "number_line" | "array" | "bar_model" | "fraction_bar" | "place_value_chart" | "coordinate_grid" | "area_model" | "graph" | "table" | "none";
  data:        Record<string, unknown>;
  caption:     string;
}

/** Adaptive recommendation from the learning analytics engine. */
export interface AdaptiveRecommendation {
  topicId:    string;
  topicName:  string;
  reason:     RecommendationReason;
  priority:   number;  // 1 = highest
}

export enum RecommendationReason {
  WeakArea           = "weak_area",
  PrerequisiteGap    = "prerequisite_gap",
  LongTimeNoSee      = "long_time_no_see",
  ReadyForChallenge  = "ready_for_challenge",
  QuestRequirement   = "quest_requirement",
}

// ═══════════════════════════════════════════════════════════════════════════════
// API CONTRACTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Standard success response envelope for all API endpoints. */
export interface ApiSuccess<T = unknown, M = unknown> {
  success: true;
  data:    T;
  /** Optional pagination / query metadata. */
  meta?:   M;
}

/** Structured error detail — always returned nested under `error`. */
export interface ApiErrorDetail {
  code:     string;
  message:  string;
  details?: unknown;
}

/** Standard error response envelope. */
export interface ApiError {
  success: false;
  error:   ApiErrorDetail;
}

/** Union of all possible API responses — useful for typed fetch wrappers. */
export type ApiResponse<T = unknown, M = unknown> = ApiSuccess<T, M> | ApiError;

/** Progress summary returned by GET /progress. */
export interface ProgressSummary {
  userId:          string;
  totalXp:         number;
  level:           number;
  levelTitle:      string;
  xpToNextLevel:   number;
  streak:          number;
  masteredTopics:  number;
  totalTopics:     number;
  weakAreas:       AdaptiveRecommendation[];
  recentActivity:  PracticeSession[];
}

/** Curriculum tree node returned by GET /curriculum. */
export interface CurriculumTreeNode {
  strand:  CurriculumStrand;
  topics:  (Topic & { progress?: TopicProgress })[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRACTICE — IN-SESSION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A single practice question as served to the student during a session.
 * Backed by the practice_questions DB table; served in-memory during an active session.
 */
export interface PracticeQuestion {
  id:            string;
  topicId:       string;
  lessonId?:     string;
  type:          QuestionType;
  prompt:        string;
  options?:      string[];       // MultipleChoice only
  correctAnswer: string;
  explanation:   string;
  difficulty:    Difficulty;
  grade:         Grade;
  conceptTags:   string[];
  xpReward:      number;
  expectedSteps?: number;        // Word problems only
}

/**
 * One student response to one question within an active session.
 * Lightweight in-memory record; persisted as QuestionAttempt after session ends.
 */
export interface QuestionResponse {
  questionId:       string;
  isCorrect:        boolean;
  attemptCount:     number;      // 1 = first attempt, 2+ = retry
  hintsUsed:        number;
  timeSpentSeconds: number;
  studentAnswer?:   string;
  misconceptionTag?: string;
}

/**
 * An active in-memory practice session (enriched, before/during DB persistence).
 * Contains the full question list and running responses.
 */
export interface ActivePracticeSession {
  id:              string;
  userId:          string;
  practiceSetId?:  string;
  topicId:         string;
  lessonId?:       string;
  mode:            PracticeMode;
  grade:           Grade;
  startedAt:       Date;
  completedAt?:    Date;
  questions:       PracticeQuestion[];
  responses:       QuestionResponse[];
  currentIndex:    number;
  xpEarned:        number;
  accuracyPercent: number;
  difficulty:      Difficulty;
}

/**
 * Result returned to the frontend after submitting an answer.
 * Shape drives the practice UI — correctness, encouragement, next action.
 */
export interface SubmissionResult {
  isCorrect:         boolean;
  correctAnswer:     string;
  xpEarned:          number;
  misconceptionTag?: string;
  encouragement:     string;
  nextAction:        "continue" | "hint_available" | "session_complete" | "level_up";
  levelUp?:          { newLevel: number; title: string };
  sessionComplete?:  boolean;
  masteryUpdate?:    { topicId: string; newLevel: MasteryLevel; levelChanged: boolean };
  questUpdate?:      { questId: string; title: string; completed: boolean; xpReward: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION CONTEXT — used by AI tutor sub-engines
// ═══════════════════════════════════════════════════════════════════════════════

/** Runtime context about the current practice session, consumed by tutor engines. */
export interface SessionContext {
  sessionId:      string;
  userId:         string;
  topicId:        string;
  grade:          Grade;
  difficulty:     Difficulty;
  attemptCount:   number;   // attempts on current question
  hintsUsedSoFar: number;   // total hints used in session
  questionsAnswered: number;
  accuracySoFar:  number;   // 0–1
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI TUTOR — EXTENDED TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** AI tutor help modes. Controls depth and style of response. */
export enum HelpMode {
  Hint1          = "hint_1",          // Gentle nudge, no answer revealed
  Hint2          = "hint_2",          // Bigger clue, partial example
  NextStep       = "next_step",       // What to do next, not the full answer
  ExplainFully   = "explain_fully",   // Full step-by-step walkthrough
  TeachConcept   = "teach_concept",   // Teach the underlying math concept
  SimilarExample = "similar_example", // Worked example with different numbers
}

/** Misconception categories for tagging question attempts. */
export enum MisconceptionCategory {
  WrongOperation           = "wrong_operation",
  SignError                = "sign_error",
  PlaceValueConfusion      = "place_value_confusion",
  FractionMisunderstanding = "fraction_misunderstanding",
  SkippedStep              = "skipped_step",
  CarelessError            = "careless_error",
  ConceptualGap            = "conceptual_gap",
  None                     = "none",
}

/** Inbound request to the structured AI tutor. */
export interface TutorHelpRequest {
  sessionId:     string;
  userId:        string;
  topicId:       string;
  grade:         Grade;
  questionText:  string;
  studentAnswer?: string;
  misconceptionTag?: string;
  helpMode:      HelpMode;
  hintsUsed:     number;       // total hints used so far in this session
}

/** Full structured response from the AI tutor. */
export interface TutorHelpResponse {
  helpMode:      HelpMode;
  encouragement: string;
  content:       TutorContent;
  visualPlan?:   VisualPlanPayload;
  similarExample?: TutorExample;
}

/** The main textual content of a tutor response — shape varies by help mode. */
export interface TutorContent {
  text:   string;          // Primary response text (always present)
  steps?: TutorStep[];     // Used for ExplainFully, TeachConcept
  concept?: string;        // Math concept being taught (TeachConcept mode)
}

export interface TutorStep {
  stepNumber: number;
  instruction: string;
  formula?:    string;   // LaTeX for rendering
  visualCue?:  string;   // Short label for frontend to render
}

/** A similar worked example with different numbers — used in SimilarExample mode. */
export interface TutorExample {
  questionText:  string;
  workingSteps:  TutorStep[];
  answer:        string;
  keyInsight:    string;
}
