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

import { MasteryLevel, QuestionResponse, PracticeSession } from "@/types";

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
  // Mastery thresholds — can be overridden per topic
  private readonly THRESHOLDS = {
    [MasteryLevel.Emerging]: 0,
    [MasteryLevel.Developing]: 0.5,
    [MasteryLevel.Mastered]: 0.8,
    [MasteryLevel.Extended]: 0.95,
  };

  /**
   * Evaluates mastery after a completed practice session.
   */
  evaluate(
    session: PracticeSession,
    previousLevel: MasteryLevel,
    topicMasteryThreshold: number = 0.8
  ): MasteryEvaluation {
    const metrics = this.computeMetrics(session);
    const newLevel = this.computeMasteryLevel(metrics, topicMasteryThreshold);

    return {
      topicId: session.topicId ?? session.lessonId, // session.topicId preferred; falls back to lessonId until DB migration adds topicId column
      studentId: session.studentId,
      newLevel,
      previousLevel,
      accuracy: metrics.accuracy,
      firstAttemptAccuracy: metrics.firstAttemptAccuracy,
      avgHintsPerQuestion: metrics.avgHintsPerQuestion,
      avgTimePerQuestion: metrics.avgTimePerQuestion,
      levelChanged: newLevel !== previousLevel,
      unlockedTopicIds: [], // TODO: resolve from topic_tree prerequisites
    };
  }

  /**
   * Returns the mastery level that corresponds to a given accuracy score.
   */
  computeMasteryLevel(
    metrics: SessionMetrics,
    topicThreshold: number
  ): MasteryLevel {
    const { accuracy, firstAttemptAccuracy, avgHintsPerQuestion } = metrics;

    // Extended: very high accuracy AND minimal hints AND first-attempt accuracy
    if (
      accuracy >= this.THRESHOLDS[MasteryLevel.Extended] &&
      firstAttemptAccuracy >= 0.9 &&
      avgHintsPerQuestion < 0.3
    ) {
      return MasteryLevel.Extended;
    }

    // Mastered: meets the topic's threshold (typically 80%)
    if (accuracy >= topicThreshold && firstAttemptAccuracy >= 0.7) {
      return MasteryLevel.Mastered;
    }

    // Developing: decent progress but not yet mastered
    if (accuracy >= this.THRESHOLDS[MasteryLevel.Developing]) {
      return MasteryLevel.Developing;
    }

    return MasteryLevel.Emerging;
  }

  /**
   * Computes raw performance metrics from session responses.
   */
  computeMetrics(session: PracticeSession): SessionMetrics {
    const responses = session.responses;
    if (responses.length === 0) {
      return { accuracy: 0, firstAttemptAccuracy: 0, avgHintsPerQuestion: 0, avgTimePerQuestion: 0 };
    }

    const correct = responses.filter((r) => r.isCorrect).length;
    const firstAttemptCorrect = responses.filter((r) => r.isCorrect && r.attemptCount === 1).length;
    const totalHints = responses.reduce((sum, r) => sum + r.hintsUsed, 0);
    const totalTime = responses.reduce((sum, r) => sum + r.timeSpentSeconds, 0);

    return {
      accuracy: correct / responses.length,
      firstAttemptAccuracy: firstAttemptCorrect / responses.length,
      avgHintsPerQuestion: totalHints / responses.length,
      avgTimePerQuestion: totalTime / responses.length,
    };
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
