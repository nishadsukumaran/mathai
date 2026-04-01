/**
 * @module ai/services/visualExplanationEngine
 *
 * Visual Explanation Engine — the orchestrator that connects:
 *   1. Visual Intent Classifier (AI + heuristic)
 *   2. Visual Plan Builder (deterministic, mathData-driven with regex fallback)
 *   3. Plan Validation
 *
 * USAGE:
 *   import { getVisualExplanation } from "./visualExplanationEngine";
 *   const result = await getVisualExplanation(question, grade, true, mathData);
 */

import { classifyVisualIntent, classifyHeuristic } from "./classifier";
import { buildVisualPlan, isValidPlan }            from "./planBuilder";
import type { VisualPlan, MathData }               from "@mathai/shared-types";
import type { VisualIntent }                       from "./classifier";

export interface VisualExplanationResult {
  plan:   VisualPlan | null;
  intent: VisualIntent;
}

/**
 * Get the best visual explanation for a student's question.
 *
 * @param question - The student's math question
 * @param grade    - Student grade (e.g. "G4")
 * @param useAI    - Whether to attempt AI classification (default: true)
 * @param mathData - Structured math data from the AI response (optional)
 */
export async function getVisualExplanation(
  question: string,
  grade: string,
  useAI = true,
  mathData?: MathData,
): Promise<VisualExplanationResult> {
  const intent = await classifyVisualIntent(question, grade, useAI);
  const plan = buildVisualPlan(intent, question, mathData);

  if (!isValidPlan(plan)) {
    return { plan: null, intent };
  }

  return { plan, intent };
}

/**
 * Synchronous version — uses heuristic classifier only.
 * Accepts optional mathData for precise plan building.
 */
export function getVisualExplanationSync(
  question: string,
  mathData?: MathData,
): VisualExplanationResult {
  const intent = classifyHeuristic(question);
  const plan = buildVisualPlan(intent, question, mathData);

  if (!isValidPlan(plan)) {
    return { plan: null, intent };
  }

  return { plan, intent };
}

// Re-exports
export { classifyHeuristic, classifyVisualIntent, enforcePhase1 } from "./classifier";
export { buildVisualPlan, isValidPlan }            from "./planBuilder";
export { verifyAlignment }                         from "./alignmentVerifier";
export type { VisualIntent, VisualType, AnimationLevel } from "./classifier";
export type { VisualAlignmentCheck }               from "./alignmentVerifier";
