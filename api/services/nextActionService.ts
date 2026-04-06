/**
 * @module api/services/nextActionService
 *
 * Post-attempt next-action engine.
 * After any learning interaction (practice, ask-similar, post-animation),
 * determines the best next step for the student.
 *
 * Returns one of:
 *   - retry_similar:       try another problem of the same type
 *   - watch_visual:        watch the animated explanation
 *   - practice_topic:      start a full practice session on this topic
 *   - increase_difficulty:  move to harder problems
 *   - review_later:        topic is solid, move on to something else
 *
 * Uses the Learning Brain for cross-topic recommendations and local
 * heuristics for within-topic decisions.
 */

import { prisma }                  from "../lib/prisma";
import { getNextLearningAction }   from "./learningBrain";
import type { LearningNextAction } from "@mathai/shared-types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NextActionType =
  | "retry_similar"
  | "watch_visual"
  | "practice_topic"
  | "increase_difficulty"
  | "review_later";

export interface NextAction {
  type:         NextActionType;
  topicId:      string;
  topicName?:   string;
  reason:       string;       // child-friendly, 1 sentence
  cta:          string;       // button label
  href?:        string;       // optional deep-link
  brainAction?: LearningNextAction;  // full Learning Brain recommendation if cross-topic
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export async function getNextAction(
  userId: string,
  context: {
    topicId:        string;
    isCorrect:      boolean;
    consecutiveCorrect: number;
    consecutiveWrong:   number;
    hasSceneTemplate:   boolean;  // can we show an animation?
    source:         string;       // where the attempt came from
  },
): Promise<NextAction> {
  const {
    topicId, isCorrect, consecutiveCorrect, consecutiveWrong,
    hasSceneTemplate, source,
  } = context;

  // ── Wrong answer paths ─────────────────────────────────────────────────

  // Got it wrong and hasn't seen visual yet → suggest animation
  if (!isCorrect && hasSceneTemplate && consecutiveWrong >= 1) {
    return {
      type: "watch_visual",
      topicId,
      reason: "Let's see this step by step — watching helps it click.",
      cta: "Watch It",
    };
  }

  // Got it wrong but visual already used or unavailable → retry
  if (!isCorrect) {
    return {
      type: "retry_similar",
      topicId,
      reason: "Almost! Try a similar one — practice makes it stick.",
      cta: "Try Another",
    };
  }

  // ── Correct answer paths ───────────────────────────────────────────────

  // 3+ correct in a row → increase difficulty or move on
  if (consecutiveCorrect >= 3) {
    // Check current mastery to decide
    const progress = await prisma.topicProgress.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });

    const mastery = progress?.masteryScore ?? 0;

    if (mastery >= 0.8) {
      // Already mastered — get Learning Brain's cross-topic recommendation
      const brainAction = await getNextLearningAction(userId);
      if (brainAction) {
        return {
          type: "review_later",
          topicId: brainAction.topicId,
          topicName: brainAction.topicName,
          reason: `Great work! Ready for a new challenge — ${brainAction.topicName}.`,
          cta: "Next Topic",
          href: `/practice?topicId=${brainAction.topicId}&mode=topic_practice`,
          brainAction,
        };
      }
    }

    return {
      type: "increase_difficulty",
      topicId,
      reason: "You're on a roll! Let's try something a bit harder.",
      cta: "Level Up",
      href: `/practice?topicId=${topicId}&mode=topic_practice`,
    };
  }

  // 1-2 correct → keep going with similar
  return {
    type: "retry_similar",
    topicId,
    reason: "Nice work! Keep the momentum going.",
    cta: "Try Another",
  };
}
