/**
 * @module ai/tutor/similar_question_selector
 *
 * Selects a similar practice question to reinforce a concept after explanation.
 * The goal is spaced repetition — seeing the concept in a slightly different form.
 *
 * Selection criteria:
 *   - Same topic, same grade
 *   - Similar difficulty (or one step easier after struggle)
 *   - Different numbers/context from the current question
 *   - Not a question the student has already seen in this session
 */

import { PracticeQuestion, Grade, Difficulty } from "@/types";

interface SelectorParams {
  topicId: string;
  grade: Grade;
  difficulty: Difficulty;
  excludeIds: string[];
}

/**
 * TODO: Implement full DB query via PracticeGeneratorService.
 * Currently returns a typed stub. Replace with:
 *   return practiceService.findSimilar(params);
 */
export async function selectSimilarQuestion(
  params: SelectorParams
): Promise<PracticeQuestion | undefined> {
  // Stub — replace with real DB query
  return undefined;
}
