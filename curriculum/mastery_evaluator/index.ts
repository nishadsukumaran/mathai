/**
 * @module curriculum/mastery_evaluator
 *
 * Evaluates a student's mastery level for a topic after a practice session.
 *
 * MASTERY LEVELS:
 *   NotStarted  — no practice attempted
 *   Emerging    — <50% accuracy, needs more foundational work
 *   Developing  — 50–79% accuracy, progressing but not fluent
 *   Mastered    — 80–94% accuracy, ready to advance
 *   Extended    — 95%+ accuracy with no hints, can tackle challenge problems
 *
 * MASTERY SIGNALS CONSIDERED:
 *   - Accuracy across all attempts (not just first-attempt correct)
 *   - First-attempt accuracy (higher weight — measures true understanding)
 *   - Average hints used per question
 *   - Average time per question (very fast may indicate memorisation, not understanding)
 *   - Consistency across sessions (not just one good session)
 *
 * MASTERY DOES NOT EXPIRE — but review is recommended if:
 *   - 14+ days since last practice
 *   - Student scores below threshold on a related higher-level topic
 *
 * SIDE EFFECTS (triggered by the mastery evaluator):
 *   - Unlocks the next topic in the curriculum tree
 *   - Awards the topic mastery badge
 *   - May trigger a "challenge ready" adaptive recommendation
 */

import { MasteryLevel, QuestionResponse, ActivePracticeSession } from "@/types";

export interface MasteryEvaluation {
  topicId: string;
  studentId: string;
  newLevel: MasteryLevel;
  previousLevel: MasteryLevel;
  accuracy: number;               // 0–1 overall accuracy
  firstAttemptAccuracy: number;   // 0–1 first-attempt only
  avgHintsPerQuestion: number;
  avgTimePerQuestion: number;     // seconds
  levelChanged: boolean;
  unlockedTopicIds: string[];     // topics newly unlocked by this mastery
}

export class MasteryEvaluator {
  // ── Spec mastery score formula ──────────────────────────────────────────────
  //
  //   masteryScore = (accuracy × 0.6) + (speedScore × 0.2) + (consistency × 0.2)
  //
  //   accuracy     = fraction of questions answered correctly (0–1)
  //   speedScore   = 1 if avgTime < 30s, 0.5 if < 60s, 0 otherwise
  //   consistency  = firstAttemptAccuracy (measures stable understanding, not retry luck)
  //
  // Mastery levels by score band:
  //   0.0 – 0.39  →  Emerging    (needs foundational work)
  //   0.4 – 0.69  →  Developing  (progressing)
  //   0.7 – 0.89  →  Mastered    (ready to advance)
  //   0.9 – 1.0   →  Extended    (ready for challenge problems)

  /**
   * Evaluates mastery after a completed practice session.
   */
  evaluate(
    session: ActivePracticeSession,
    previousLevel: MasteryLevel,
    _topicMasteryThreshold: number = 0.8   // kept for API compat; spec uses fixed bands
  ): MasteryEvaluation {
    const metrics  = this.computeMetrics(session);
    const newLevel = this.computeMasteryLevel(metrics);

    return {
      topicId:             session.topicId ?? session.lessonId,
      studentId:           session.userId,
      newLevel,
      previousLevel,
      accuracy:            metrics.accuracy,
      firstAttemptAccuracy: metrics.firstAttemptAccuracy,
      avgHintsPerQuestion: metrics.avgHintsPerQuestion,
      avgTimePerQuestion:  metrics.avgTimePerQuestion,
      levelChanged:        newLevel !== previousLevel,
      unlockedTopicIds:    [], // TODO: resolve from topic_tree prerequisites
    };
  }

  /**
   * Computes the spec mastery score (0–1) and maps it to a MasteryLevel.
   *
   * Formula: (accuracy × 0.6) + (speedScore × 0.2) + (consistency × 0.2)
   */
  computeMasteryLevel(metrics: SessionMetrics): MasteryLevel {
    const speedScore    = this.computeSpeedScore(metrics.avgTimePerQuestion);
    const masteryScore  = (metrics.accuracy * 0.6)
                        + (speedScore       * 0.2)
                        + (metrics.firstAttemptAccuracy * 0.2);

    if (masteryScore >= 0.9)  return MasteryLevel.Extended;
    if (masteryScore >= 0.7)  return MasteryLevel.Mastered;
    if (masteryScore >= 0.4)  return MasteryLevel.Developing;
    return MasteryLevel.Emerging;
  }

  /**
   * Computes the spec mastery score as a number (0–1).
   * Exposed for callers that need the numeric score (e.g. TopicProgress update).
   */
  computeMasteryScore(metrics: SessionMetrics): number {
    const speedScore = this.computeSpeedScore(metrics.avgTimePerQuestion);
    return Math.min(
      (metrics.accuracy * 0.6) + (speedScore * 0.2) + (metrics.firstAttemptAccuracy * 0.2),
      1
    );
  }

  /**
   * Computes raw performance metrics from session responses.
   */
  computeMetrics(session: ActivePracticeSession): SessionMetrics {
    const responses = session.responses;
    if (responses.length === 0) {
      return { accuracy: 0, firstAttemptAccuracy: 0, avgHintsPerQuestion: 0, avgTimePerQuestion: 0 };
    }

    const correct             = responses.filter((r) => r.isCorrect).length;
    const firstAttemptCorrect = responses.filter((r) => r.isCorrect && r.attemptCount === 1).length;
    const totalHints          = responses.reduce((sum, r) => sum + r.hintsUsed, 0);
    const totalTime           = responses.reduce((sum, r) => sum + r.timeSpentSeconds, 0);

    return {
      accuracy:             correct / responses.length,
      firstAttemptAccuracy: firstAttemptCorrect / responses.length,
      avgHintsPerQuestion:  totalHints / responses.length,
      avgTimePerQuestion:   totalTime / responses.length,
    };
  }

  /**
   * Maps average time per question to a speed score (0, 0.5, or 1).
   */
  private computeSpeedScore(avgTimeSeconds: number): number {
    if (avgTimeSeconds < 30) return 1;
    if (avgTimeSeconds < 60) return 0.5;
    return 0;
  }

  /**
   * Determines if a topic needs spaced review based on time elapsed.
   */
  needsReview(lastPracticed: Date, masteryLevel: MasteryLevel): boolean {
    const daysSince = (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);

    const reviewIntervals: Record<MasteryLevel, number> = {
      [MasteryLevel.NotStarted]: 0,
      [MasteryLevel.Emerging]: 2,
      [MasteryLevel.Developing]: 5,
      [MasteryLevel.Mastered]: 14,
      [MasteryLevel.Extended]: 30,
    };

    return daysSince > (reviewIntervals[masteryLevel] ?? 14);
  }
}

// ─── Internal Types ────────────────────────────────────────────────────────────

export interface SessionMetrics {
  accuracy: number;
  firstAttemptAccuracy: number;
  avgHintsPerQuestion: number;
  avgTimePerQuestion: number;
}

export const masteryEvaluator = new MasteryEvaluator();
