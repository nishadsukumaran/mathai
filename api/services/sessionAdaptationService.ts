/**
 * @module api/services/sessionAdaptationService
 *
 * In-session adaptation engine — decides the next best step INSIDE an active
 * practice session after each answer submission.
 *
 * This service is called from practiceService.submitAnswer() and receives the
 * full session state (all responses so far). It returns a SessionNextStep that
 * the frontend uses to adapt the experience in real time.
 *
 * ─── PRIORITY FRAMEWORK ─────────────────────────────────────────────────────
 *
 *   1. Repeated struggle in-session     (2+ consecutive wrong)
 *   2. Hint dependence in-session       (3+ hints used in session)
 *   3. Careless mistake pattern         (fast answers, low accuracy)
 *   4. Recovery after struggle          (correct after 2+ wrong)
 *   5. Momentum / mastery progression   (3+ consecutive correct)
 *   6. Fatigue management               (long session, declining accuracy)
 *
 * Uses TRENDS, not single events. Never overreacts to one wrong answer.
 *
 * ─── TONE ────────────────────────────────────────────────────────────────────
 *
 * The engine speaks like a caring tutor:
 *   - Never punitive
 *   - Recognises effort and recovery
 *   - Knows when to stop
 *   - Celebrates progress that's been earned
 */

import type {
  SessionNextStep,
  SessionAdaptiveAction,
  SessionAdaptiveSignals,
  BrainDifficulty,
  ExplanationPreference,
} from "@mathai/shared-types";

// ─── Input types (match practiceService's in-memory session) ─────────────────

export interface SessionResponse {
  questionId:        string;
  isCorrect:         boolean;
  attemptCount:      number;
  hintsUsed:         number;
  timeSpentSeconds:  number;
  misconceptionTag?: string;
  confidenceBefore?: number;
}

export interface SessionContext {
  topicId:         string;
  totalQuestions:   number;
  currentIndex:    number;   // 0-based, AFTER advancing for the answer just submitted
  responses:       SessionResponse[];
  sessionComplete: boolean;
}

// ─── Visual topic detection ──────────────────────────────────────────────────

const VISUAL_TOPIC_PATTERNS = [
  "fraction", "number-line", "place-value", "array", "bar-model",
  "geometry", "shape", "angle", "area", "perimeter", "coordinate",
];

function isVisualTopic(topicId: string): boolean {
  const lower = topicId.toLowerCase();
  return VISUAL_TOPIC_PATTERNS.some((p) => lower.includes(p));
}

// ─── Pattern detection helpers ───────────────────────────────────────────────

/** Count consecutive results of a given correctness from the end of the list */
function consecutiveFromEnd(responses: SessionResponse[], isCorrect: boolean): number {
  let count = 0;
  for (let i = responses.length - 1; i >= 0; i--) {
    if (responses[i]!.isCorrect === isCorrect) count++;
    else break;
  }
  return count;
}

/** Detect recovery: wrong, wrong, then correct (the latest answer) */
function isRecovery(responses: SessionResponse[]): boolean {
  if (responses.length < 3) return false;
  const last3 = responses.slice(-3);
  return !last3[0]!.isCorrect && !last3[1]!.isCorrect && last3[2]!.isCorrect;
}

/** Total hints used across the session */
function totalSessionHints(responses: SessionResponse[]): number {
  return responses.reduce((sum, r) => sum + r.hintsUsed, 0);
}

/** Average time per question in the session */
function avgTimePerQuestion(responses: SessionResponse[]): number {
  if (responses.length === 0) return 30;
  return responses.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / responses.length;
}

/** Session accuracy so far (0–1) */
function sessionAccuracy(responses: SessionResponse[]): number {
  if (responses.length === 0) return 1;
  return responses.filter((r) => r.isCorrect).length / responses.length;
}

/** Accuracy of the last N responses */
function recentAccuracy(responses: SessionResponse[], n: number): number {
  const recent = responses.slice(-n);
  if (recent.length === 0) return 1;
  return recent.filter((r) => r.isCorrect).length / recent.length;
}

/** Check if student's confidence is dropping */
function confidenceDropping(responses: SessionResponse[]): boolean {
  const withConf = responses.filter((r) => r.confidenceBefore != null && r.confidenceBefore > 0);
  if (withConf.length < 3) return false;
  const recent = withConf.slice(-3);
  // Dropping = last rating lower than first by 2+ points
  return (recent[0]!.confidenceBefore ?? 3) - (recent[recent.length - 1]!.confidenceBefore ?? 3) >= 2;
}

/** Detect careless pattern: fast answers + low accuracy */
function isCarelessPattern(responses: SessionResponse[]): boolean {
  if (responses.length < 3) return false;
  const recent = responses.slice(-3);
  const avgTime = recent.reduce((s, r) => s + r.timeSpentSeconds, 0) / recent.length;
  const acc = recent.filter((r) => r.isCorrect).length / recent.length;
  // Fast (< 15s avg) with poor accuracy (< 40%)
  return avgTime < 15 && acc < 0.4;
}

/** Detect fatigue: answered 6+ questions, recent accuracy declining */
function isFatigueRisk(ctx: SessionContext): boolean {
  const { responses, totalQuestions, currentIndex } = ctx;
  if (responses.length < 6) return false;
  // Near the end of a long session
  const isLongSession = totalQuestions >= 6 && currentIndex >= totalQuestions - 1;
  // Accuracy declining: first half vs second half
  const half = Math.floor(responses.length / 2);
  const firstHalfAcc = sessionAccuracy(responses.slice(0, half));
  const secondHalfAcc = sessionAccuracy(responses.slice(half));
  const declining = secondHalfAcc < firstHalfAcc - 0.15;
  return isLongSession || declining;
}

// ─── Encouragement pools ─────────────────────────────────────────────────────

const ENCOURAGEMENT: Record<string, string[]> = {
  struggle: [
    "It's okay — tricky problems help you grow!",
    "Let's work through this together.",
    "Everyone gets stuck sometimes. You're still learning!",
  ],
  recovery: [
    "You worked through the tough part — brilliant!",
    "That's the spirit! You didn't give up!",
    "See? You CAN do it! Keep going!",
  ],
  momentum: [
    "You're on fire! Keep this up!",
    "Wow, you're really getting the hang of this!",
    "Unstoppable! Let's try something a little harder.",
  ],
  careless: [
    "Take a breath — you know this! Just slow down a little.",
    "You've got the skills. Let's focus on accuracy.",
  ],
  fatigue: [
    "You've been working hard! Great effort today.",
    "That's a solid session! Let's end on a high note.",
  ],
  hint: [
    "Using hints is smart! Let's build on what they taught you.",
    "Hints are there to help. Let's try the next one with less support.",
  ],
  celebrate: [
    "You earned this! Well done!",
    "Your hard work is paying off!",
  ],
  default: [
    "Keep going — you're doing great!",
    "One step at a time!",
  ],
};

function pickEncouragement(pool: string): string {
  const items = ENCOURAGEMENT[pool] ?? ENCOURAGEMENT["default"]!;
  return items[Math.floor(Math.random() * items.length)]!;
}

// ─── Explanation preference decision ─────────────────────────────────────────

function decideExplanation(
  ctx: SessionContext,
  signals: SessionAdaptiveSignals,
): ExplanationPreference | undefined {
  if (signals.consecutiveWrong && signals.visualTopic) return "visual";
  if (signals.consecutiveWrong || signals.hintDependency) return "step_by_step";
  if (signals.carelessPattern) return "step_by_step";
  if (signals.consecutiveCorrect) return "concise";
  return undefined;
}

// ─── Main decision function ──────────────────────────────────────────────────

/**
 * Evaluate the current session state and decide what should happen next.
 *
 * Called after each answer submission, BEFORE the result is sent to the frontend.
 * Returns a SessionNextStep that the frontend uses to adapt the experience.
 *
 * @param ctx        - Current session state including all responses
 * @param lastAnswer - The answer that was just submitted (the latest response)
 */
export function decideSessionNextStep(
  ctx: SessionContext,
  lastAnswer: SessionResponse,
): SessionNextStep {
  const { responses, topicId, totalQuestions, currentIndex, sessionComplete } = ctx;

  // If session is already complete, return positive ending
  if (sessionComplete) {
    return {
      action:        "end_session_positive",
      reason:        "You've completed all the questions in this session!",
      encouragement: pickEncouragement("celebrate"),
      sourceSignals: {},
    };
  }

  const signals: SessionAdaptiveSignals = {};
  const consWrong   = consecutiveFromEnd(responses, false);
  const consCorrect = consecutiveFromEnd(responses, true);
  const totalHints  = totalSessionHints(responses);
  const questionsRemaining = totalQuestions - currentIndex;
  const visual = isVisualTopic(topicId);

  if (visual) signals.visualTopic = true;

  // ── Priority 1: Fatigue management ──────────────────────────────────────
  // Check first because if the student is tired, everything else is secondary
  if (isFatigueRisk(ctx) && questionsRemaining <= 1) {
    signals.fatigueRisk = true;
    return {
      action:        "end_session_positive",
      reason:        "You've had a great session. Let's wrap up on a positive note!",
      encouragement: pickEncouragement("fatigue"),
      sourceSignals: signals,
      recommendedQuestionCountRemaining: 0,
    };
  }

  // ── Priority 2: Repeated struggle (2+ consecutive wrong) ────────────────
  if (consWrong >= 2) {
    signals.consecutiveWrong = true;

    // 3+ wrong in a row → more intensive support
    if (consWrong >= 3) {
      const action: SessionAdaptiveAction = visual
        ? "show_visual_explanation"
        : "show_step_by_step";
      return {
        action,
        reason:                "You're finding this challenging right now. Let me walk you through it.",
        encouragement:         pickEncouragement("struggle"),
        difficulty:            "easy",
        explanationPreference: visual ? "visual" : "step_by_step",
        sourceSignals:         signals,
        recommendedQuestionCountRemaining: Math.max(questionsRemaining, 2),
      };
    }

    // 2 wrong → gentler support
    return {
      action:                "easier_question",
      reason:                "Let's try a slightly easier version to build your confidence.",
      encouragement:         pickEncouragement("struggle"),
      difficulty:            "easy",
      explanationPreference: decideExplanation(ctx, signals),
      sourceSignals:         signals,
    };
  }

  // ── Priority 3: Hint dependence (3+ hints in session) ───────────────────
  if (totalHints >= 3 && responses.length >= 3) {
    const hintsPerQ = totalHints / responses.length;
    if (hintsPerQ >= 0.8) {
      signals.hintDependency = true;
      return {
        action:                "show_step_by_step",
        reason:                "You've been using hints a lot — let's build a stronger foundation step by step.",
        encouragement:         pickEncouragement("hint"),
        difficulty:            "easy",
        explanationPreference: "step_by_step",
        sourceSignals:         signals,
      };
    }
  }

  // ── Priority 4: Careless pattern (fast + inaccurate) ────────────────────
  if (isCarelessPattern(responses)) {
    signals.carelessPattern = true;
    return {
      action:                "show_hint",
      reason:                "You're moving quickly — let's slow down and read each question carefully.",
      encouragement:         pickEncouragement("careless"),
      difficulty:            "medium",
      explanationPreference: "step_by_step",
      sourceSignals:         signals,
    };
  }

  // ── Priority 5: Recovery after struggle ─────────────────────────────────
  if (isRecovery(responses)) {
    signals.sessionRecovery = true;
    return {
      action:        "celebrate_and_continue",
      reason:        "You worked through the tough part and got it right! That's real learning.",
      encouragement: pickEncouragement("recovery"),
      sourceSignals: signals,
    };
  }

  // ── Priority 6: Confidence dropping ─────────────────────────────────────
  if (confidenceDropping(responses)) {
    signals.confidenceDrop = true;
    return {
      action:                "easier_question",
      reason:                "Your confidence seems to be dipping. Let's build it back up.",
      encouragement:         pickEncouragement("struggle"),
      difficulty:            "easy",
      explanationPreference: decideExplanation(ctx, signals),
      sourceSignals:         signals,
    };
  }

  // ── Priority 7: Momentum — multiple consecutive correct ─────────────────
  if (consCorrect >= 3) {
    signals.consecutiveCorrect = true;
    signals.masteryProgressing = true;
    return {
      action:        "harder_question",
      reason:        "You're crushing it! Let's see if you're ready for a bigger challenge.",
      encouragement: pickEncouragement("momentum"),
      difficulty:    "hard",
      sourceSignals: signals,
    };
  }

  if (consCorrect >= 2) {
    signals.consecutiveCorrect = true;
    return {
      action:        "celebrate_and_continue",
      reason:        "Great streak! Keep this momentum going.",
      encouragement: pickEncouragement("celebrate"),
      sourceSignals: signals,
    };
  }

  // ── Priority 8: Fatigue — mid-session check ─────────────────────────────
  if (isFatigueRisk(ctx)) {
    signals.fatigueRisk = true;
    return {
      action:                             "switch_to_revision",
      reason:                             "You've been working hard. Let's switch to something lighter.",
      encouragement:                      pickEncouragement("fatigue"),
      difficulty:                         "easy",
      sourceSignals:                      signals,
      recommendedQuestionCountRemaining:  Math.min(questionsRemaining, 2),
    };
  }

  // ── Default: normal continuation ────────────────────────────────────────
  return {
    action:        "next_question",
    reason:        "Keep going — you're doing well!",
    encouragement: pickEncouragement("default"),
    sourceSignals: signals,
  };
}
