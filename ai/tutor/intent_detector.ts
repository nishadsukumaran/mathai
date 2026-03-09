/**
 * @module ai/tutor/intent_detector
 *
 * Classifies what the student actually needs from their message.
 * This is the first step in the tutoring pipeline — routing all downstream logic.
 *
 * INTENTS:
 *   NeedsHint        — "I don't know how to start" / "Can you help me?"
 *   NeedsExplanation — "I don't understand this at all" / "Can you show me?"
 *   Stuck            — Multiple failed attempts, no message text
 *   Confident        — Answer submitted correctly, looking for validation
 */

import { SessionContext } from "@/types";

export enum TutorIntent {
  NeedsHint = "needs_hint",
  NeedsExplanation = "needs_explanation",
  Stuck = "stuck",
  Confident = "confident",
}

const HINT_KEYWORDS = ["help", "hint", "clue", "don't know how", "not sure", "where do i start"];
const EXPLANATION_KEYWORDS = ["explain", "show me", "don't understand", "confused", "what does", "how does"];

/**
 * Lightweight intent classifier. Uses keyword matching first for speed,
 * falls back to session signals (attempt count, hints used) when text is absent.
 */
export async function detectIntent(
  studentMessage: string,
  currentAnswer: string | undefined,
  context: SessionContext
): Promise<TutorIntent> {
  const lower = studentMessage.toLowerCase();

  if (EXPLANATION_KEYWORDS.some((kw) => lower.includes(kw))) {
    return TutorIntent.NeedsExplanation;
  }

  if (HINT_KEYWORDS.some((kw) => lower.includes(kw))) {
    return TutorIntent.NeedsHint;
  }

  // Infer from session signals
  if (context.attemptCount >= 3 || context.hintsUsedSoFar >= 3) {
    return TutorIntent.NeedsExplanation;
  }

  if (context.attemptCount >= 1 && !currentAnswer) {
    return TutorIntent.Stuck;
  }

  return TutorIntent.NeedsHint;
}
