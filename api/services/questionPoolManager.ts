/**
 * @module api/services/questionPoolManager
 *
 * Manages a multi-difficulty question pool within a practice session.
 *
 * Questions are lazily generated per difficulty tier — medium is always
 * available at session start; easy and hard are generated on-demand the
 * first time the adaptation engine requests a difficulty shift. This keeps
 * session startup fast while enabling real-time difficulty adaptation.
 *
 * ─── DIFFICULTY TIERS ────────────────────────────────────────────────────────
 *
 *   easy     → Difficulty.Beginner   (single-step, small numbers)
 *   medium   → Difficulty.Intermediate (multi-step, some reasoning)
 *   hard     → Difficulty.Advanced   (multi-step, abstract thinking)
 *
 * ─── GUARDRAILS ──────────────────────────────────────────────────────────────
 *
 *   - Max 2 difficulty shifts within any 3-question window
 *   - Cannot jump from easy→hard or hard→easy in one step
 *   - Requires 2 consecutive correct to escalate (prevent premature promotion)
 *   - Pool exhaustion falls back to medium pool
 */

import type { Difficulty } from "@/types";
import type { SessionAdaptiveAction } from "@mathai/shared-types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PoolDifficulty = "easy" | "medium" | "hard";

export interface QuestionPoolEntry {
  id:            string;
  type:          string;
  prompt:        string;
  options?:      string[];
  correctAnswer: string;
  explanation:   string;
  difficulty:    Difficulty;
  grade:         string;
  conceptTags:   string[];
  xpReward:      number;
  expectedSteps?: number;
  topicId:       string;
}

export interface SessionQuestionPool {
  easy:   QuestionPoolEntry[];
  medium: QuestionPoolEntry[];
  hard:   QuestionPoolEntry[];
}

export interface PoolIndices {
  easy:   number;
  medium: number;
  hard:   number;
}

export interface DifficultyState {
  current:        PoolDifficulty;
  pool:           SessionQuestionPool;
  indices:        PoolIndices;
  /** History of difficulty levels for the last N questions (for guardrails) */
  recentHistory:  PoolDifficulty[];
}

// ─── Difficulty mapping ──────────────────────────────────────────────────────

export const POOL_TO_ENGINE_DIFFICULTY: Record<PoolDifficulty, Difficulty> = {
  easy:   "beginner" as Difficulty,
  medium: "intermediate" as Difficulty,
  hard:   "advanced" as Difficulty,
};

export const ENGINE_TO_POOL_DIFFICULTY: Record<string, PoolDifficulty> = {
  beginner:     "easy",
  intermediate: "medium",
  advanced:     "hard",
  challenge:    "hard",
};

// ─── Create initial state ────────────────────────────────────────────────────

/**
 * Initialize the difficulty state for a new session.
 * Called from startSession() — the medium pool is populated with the
 * initial question set, easy and hard are empty (generated on demand).
 */
export function createDifficultyState(
  initialQuestions: QuestionPoolEntry[],
  startingDifficulty: PoolDifficulty = "medium",
): DifficultyState {
  return {
    current: startingDifficulty,
    pool: {
      easy:   [],
      medium: initialQuestions,
      hard:   [],
    },
    indices: {
      easy:   0,
      medium: 0,
      hard:   0,
    },
    recentHistory: [],
  };
}

// ─── Difficulty transition logic ─────────────────────────────────────────────

/**
 * Map a session adaptation action to the desired difficulty shift.
 * Returns the target difficulty, applying guardrails.
 */
export function resolveNextDifficulty(
  state: DifficultyState,
  action: SessionAdaptiveAction,
): PoolDifficulty {
  const { current, recentHistory } = state;

  // Actions that don't change difficulty
  const neutralActions: SessionAdaptiveAction[] = [
    "next_question", "show_hint", "show_visual_explanation",
    "show_step_by_step", "celebrate_and_continue", "end_session_positive",
    "switch_to_revision",
  ];
  if (neutralActions.includes(action)) {
    // repeat_concept stays at current difficulty
    return current;
  }

  let target: PoolDifficulty;

  if (action === "easier_question") {
    // Step down one level — never skip
    target = current === "hard" ? "medium" : current === "medium" ? "easy" : "easy";
  } else if (action === "harder_question") {
    // Step up one level — never skip
    target = current === "easy" ? "medium" : current === "medium" ? "hard" : "hard";
  } else if (action === "repeat_concept") {
    target = current;
  } else {
    target = current;
  }

  // ── Guardrail: max 2 difficulty shifts in last 3 questions ──────────────
  if (recentHistory.length >= 3) {
    const last3 = recentHistory.slice(-3);
    const shifts = last3.filter((d, i) => i > 0 && d !== last3[i - 1]).length;
    if (shifts >= 2 && target !== current) {
      // Too much oscillation — stay put
      return current;
    }
  }

  return target;
}

// ─── Question retrieval ──────────────────────────────────────────────────────

/**
 * Get the next question from the pool at the specified difficulty.
 * Falls back to medium pool if the target pool is exhausted.
 * Returns null only if ALL pools are exhausted.
 */
export function getNextFromPool(
  state: DifficultyState,
  difficulty: PoolDifficulty,
): { question: QuestionPoolEntry | null; fromDifficulty: PoolDifficulty } {
  // Try the requested difficulty first
  const pool = state.pool[difficulty];
  const idx  = state.indices[difficulty];

  if (idx < pool.length) {
    return { question: pool[idx]!, fromDifficulty: difficulty };
  }

  // Pool exhausted — fall back to medium
  if (difficulty !== "medium") {
    const medPool = state.pool.medium;
    const medIdx  = state.indices.medium;
    if (medIdx < medPool.length) {
      return { question: medPool[medIdx]!, fromDifficulty: "medium" };
    }
  }

  // Medium also exhausted — try any remaining pool
  for (const d of ["easy", "hard"] as PoolDifficulty[]) {
    if (d === difficulty) continue;
    const p = state.pool[d];
    const i = state.indices[d];
    if (i < p.length) {
      return { question: p[i]!, fromDifficulty: d };
    }
  }

  return { question: null, fromDifficulty: difficulty };
}

/**
 * Advance the index for the given difficulty after serving a question.
 * Also records the difficulty in the recent history for guardrail checks.
 */
export function advancePoolIndex(state: DifficultyState, difficulty: PoolDifficulty): void {
  state.indices[difficulty]++;
  state.current = difficulty;
  state.recentHistory.push(difficulty);
  // Keep history bounded
  if (state.recentHistory.length > 10) {
    state.recentHistory.shift();
  }
}

/**
 * Add generated questions to a specific difficulty pool.
 * Called when on-demand generation completes for easy or hard.
 */
export function populatePool(
  state: DifficultyState,
  difficulty: PoolDifficulty,
  questions: QuestionPoolEntry[],
): void {
  state.pool[difficulty] = questions;
}

/**
 * Check if a difficulty pool needs generation (is empty).
 */
export function poolNeedsGeneration(
  state: DifficultyState,
  difficulty: PoolDifficulty,
): boolean {
  return state.pool[difficulty].length === 0;
}

/**
 * Get the total number of remaining questions across all pools.
 */
export function totalRemainingQuestions(state: DifficultyState): number {
  let total = 0;
  for (const d of ["easy", "medium", "hard"] as PoolDifficulty[]) {
    total += Math.max(0, state.pool[d].length - state.indices[d]);
  }
  return total;
}
