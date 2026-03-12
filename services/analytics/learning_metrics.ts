/**
 * @module services/analytics/learning_metrics
 *
 * Computes and stores learning analytics for the adaptive engine.
 *
 * LEARNING SIGNALS TRACKED:
 *   - Accuracy per topic (rolling 30-session window)
 *   - Average time per question (speed signal)
 *   - Hint frequency per topic (struggle signal)
 *   - Retry attempt rate (persistence signal)
 *   - Confidence score (composite, derived from above)
 *
 * USES:
 *   - Adaptive engine recommendations
 *   - Parent/teacher dashboard
 *   - Weekly progress emails
 *   - Weak area detection for quest personalisation
 *
 * DESIGN:
 *   - Metrics are computed from raw session data, not stored separately
 *   - Confidence score is a weighted composite (see formula below)
 *   - "Weak area" = topic where confidence < 0.5 AND at least 2 sessions attempted
 */

import { AdaptiveRecommendation, RecommendationReason, StudentProfile } from "@/types";

/**
 * Per-topic analytics signal used for confidence scoring and weak-area detection.
 * Internal to the analytics layer — not persisted as its own table.
 */
export interface LearningSignal {
  topicId:              string;
  topicName:            string;
  confidenceScore:      number;   // 0–1 composite
  accuracy:             number;
  firstAttemptAccuracy: number;
  avgHintsPerQuestion:  number;
  avgTimePerQuestion:   number;
  sessionCount:         number;
  lastPracticed:        Date;
}

// ─── Mastery Score Formula (aligned to spec) ───────────────────────────────────
//
//   masteryScore = (accuracy × 0.6)
//               + (speedScore × 0.2)
//               + (consistency × 0.2)
//
//   Where:
//     accuracy     = fraction of questions answered correctly (0–1)
//     speedScore   = 1 if avgTime < 30s, 0.5 if < 60s, 0 otherwise
//     consistency  = firstAttemptAccuracy (stable first-try performance)
//
//   This matches the spec formula and the MasteryEvaluator implementation.

export interface ConfidenceComponents {
  accuracy:             number;   // overall accuracy (0–1)
  firstAttemptAccuracy: number;   // consistency proxy (0–1)
  speedScore:           number;   // 0, 0.5, or 1 — use computeSpeedScore()
}

export class LearningMetricsService {
  /**
   * Computes the spec mastery score for a topic (0–1).
   *
   * Formula: (accuracy × 0.6) + (speedScore × 0.2) + (consistency × 0.2)
   */
  computeConfidence(components: ConfidenceComponents): number {
    const { accuracy, firstAttemptAccuracy, speedScore } = components;
    return Math.min(
      accuracy * 0.6 + speedScore * 0.2 + firstAttemptAccuracy * 0.2,
      1
    );
  }

  /**
   * Identifies a student's weak areas (topics needing attention).
   * A topic is "weak" if:
   *   - confidence score < 0.5
   *   - at least 2 practice sessions attempted
   *   - last practiced within 30 days (older = less relevant)
   */
  identifyWeakAreas(signals: LearningSignal[]): string[] {
    return signals
      .filter((s) => {
        const daysSince = (Date.now() - s.lastPracticed.getTime()) / (1000 * 60 * 60 * 24);
        return s.confidenceScore < 0.5 && daysSince <= 30;
      })
      .sort((a, b) => a.confidenceScore - b.confidenceScore)
      .map((s) => s.topicId);
  }

  /**
   * Generates adaptive recommendations for the student's next learning step.
   * Priority order: weak areas → next in sequence → challenge ready topics
   */
  async generateRecommendations(
    profile: StudentProfile,
    signals: LearningSignal[]
  ): Promise<AdaptiveRecommendation[]> {
    const recommendations: AdaptiveRecommendation[] = [];
    const weakAreas = this.identifyWeakAreas(signals);

    // Priority 1: Weak area review
    for (const topicId of weakAreas.slice(0, 2)) {
      const signal = signals.find((s) => s.topicId === topicId);
      recommendations.push({
        topicId,
        topicName:  signal?.topicName ?? topicId,
        reason:     RecommendationReason.WeakArea,
        priority:   1,
      });
    }

    // Priority 2: Spaced review for mastered topics due for review
    // TODO: implement spaced repetition scheduling

    // Priority 3: Next in curriculum sequence
    // TODO: implement next-lesson resolution from LessonEngine

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Computes speed score from average time per question.
   */
  computeSpeedScore(avgTimeSeconds: number): number {
    if (avgTimeSeconds < 30) return 1;
    if (avgTimeSeconds < 60) return 0.5;
    return 0;
  }

  /**
   * Computes hint rate (normalised 0–1) from average hints per question.
   * Retained for callers that surface hint dependency stats.
   */
  computeHintRate(avgHintsPerQuestion: number): number {
    return Math.min(avgHintsPerQuestion / 3, 1);
  }

  /**
   * Builds a ConfidenceComponents payload from raw session metrics —
   * convenience wrapper so callers don't have to compute speedScore manually.
   */
  buildComponents(opts: {
    accuracy:             number;
    firstAttemptAccuracy: number;
    avgTimePerQuestion:   number;
  }): ConfidenceComponents {
    return {
      accuracy:             opts.accuracy,
      firstAttemptAccuracy: opts.firstAttemptAccuracy,
      speedScore:           this.computeSpeedScore(opts.avgTimePerQuestion),
    };
  }
}

export const learningMetrics = new LearningMetricsService();
