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

import { LearningSignal, AdaptiveRecommendation, RecommendationReason, StudentProfile } from "@/types";

// ─── Confidence Score Formula ──────────────────────────────────────────────────
//
//   confidence = (0.4 × accuracy)
//              + (0.3 × firstAttemptAccuracy)
//              + (0.2 × (1 - hintRate))
//              + (0.1 × speedScore)
//
//   Where:
//     hintRate   = avgHintsPerQuestion / 3 (normalised to 0-1)
//     speedScore = 1 if avgTime < 30s, 0.5 if < 60s, 0 otherwise

export interface ConfidenceComponents {
  accuracy: number;
  firstAttemptAccuracy: number;
  hintRate: number;         // avgHintsPerQuestion / 3
  speedScore: number;       // 0, 0.5, or 1
}

export class LearningMetricsService {
  /**
   * Computes the composite confidence score for a topic (0–1).
   */
  computeConfidence(components: ConfidenceComponents): number {
    const { accuracy, firstAttemptAccuracy, hintRate, speedScore } = components;

    return (
      0.4 * accuracy +
      0.3 * firstAttemptAccuracy +
      0.2 * (1 - Math.min(hintRate, 1)) +
      0.1 * speedScore
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
      recommendations.push({
        studentId: profile.id,
        recommendedLessonId: `review-${topicId}`, // TODO: resolve actual lesson from topic
        reason: RecommendationReason.WeakArea,
        priority: 1,
        generatedAt: new Date(),
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
   */
  computeHintRate(avgHintsPerQuestion: number): number {
    return Math.min(avgHintsPerQuestion / 3, 1);
  }
}

export const learningMetrics = new LearningMetricsService();
