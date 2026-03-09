/**
 * @module ai/tutor/difficulty_evaluator
 *
 * Evaluates the appropriate difficulty level for tutoring responses
 * based on the student's session performance signals.
 *
 * Used to calibrate hint complexity, explanation depth, and practice question difficulty.
 */

import { Difficulty, SessionContext } from "@/types";
import { MathConcept } from "./concept_identifier";

export interface DifficultyContext {
  currentDifficulty: Difficulty;
  recommendedDifficulty: Difficulty;
  shouldScaleDown: boolean;
  shouldScaleUp: boolean;
}

/**
 * Evaluates difficulty based on:
 *   - Attempt count (more attempts → scale down explanations)
 *   - Hints used (many hints → content is too hard)
 *   - Session difficulty setting
 */
export async function evaluateDifficulty(
  concept: MathConcept,
  sessionContext: SessionContext
): Promise<DifficultyContext> {
  const { attemptCount, hintsUsedSoFar, difficulty } = sessionContext;

  const shouldScaleDown = attemptCount >= 3 || hintsUsedSoFar >= 2;
  const shouldScaleUp = attemptCount === 0 && hintsUsedSoFar === 0;

  const difficultyOrder: Difficulty[] = [
    Difficulty.Beginner,
    Difficulty.Intermediate,
    Difficulty.Advanced,
    Difficulty.Challenge,
  ];

  const currentIndex = difficultyOrder.indexOf(difficulty);

  let recommendedDifficulty = difficulty;
  if (shouldScaleDown && currentIndex > 0) {
    recommendedDifficulty = difficultyOrder[currentIndex - 1] ?? difficulty;
  } else if (shouldScaleUp && currentIndex < difficultyOrder.length - 1) {
    recommendedDifficulty = difficultyOrder[currentIndex + 1] ?? difficulty;
  }

  return {
    currentDifficulty: difficulty,
    recommendedDifficulty,
    shouldScaleDown,
    shouldScaleUp,
  };
}
