/**
 * @test curriculum/mastery_evaluator
 *
 * Tests for mastery level computation from session metrics.
 * Core to the adaptive engine — must be rock solid.
 */

import { MasteryEvaluator } from "@/curriculum/mastery_evaluator";
import { MasteryLevel, PracticeMode, PracticeSession, QuestionResponse } from "@/types";

describe("MasteryEvaluator", () => {
  let evaluator: MasteryEvaluator;

  beforeEach(() => {
    evaluator = new MasteryEvaluator();
  });

  // ─── computeMetrics ──────────────────────────────────────────────────────────

  describe("computeMetrics", () => {
    it("computes 100% accuracy for all correct first attempts", () => {
      const session = buildSession([
        { isCorrect: true, attemptCount: 1, hintsUsed: 0, timeSpentSeconds: 20 },
        { isCorrect: true, attemptCount: 1, hintsUsed: 0, timeSpentSeconds: 25 },
      ]);

      const metrics = evaluator.computeMetrics(session);
      expect(metrics.accuracy).toBe(1);
      expect(metrics.firstAttemptAccuracy).toBe(1);
      expect(metrics.avgHintsPerQuestion).toBe(0);
    });

    it("computes 50% accuracy for half correct", () => {
      const session = buildSession([
        { isCorrect: true, attemptCount: 1, hintsUsed: 0, timeSpentSeconds: 30 },
        { isCorrect: false, attemptCount: 2, hintsUsed: 1, timeSpentSeconds: 60 },
      ]);

      const metrics = evaluator.computeMetrics(session);
      expect(metrics.accuracy).toBe(0.5);
    });

    it("distinguishes first-attempt accuracy from retry accuracy", () => {
      const session = buildSession([
        { isCorrect: true, attemptCount: 1, hintsUsed: 0, timeSpentSeconds: 30 }, // first attempt
        { isCorrect: true, attemptCount: 2, hintsUsed: 1, timeSpentSeconds: 60 }, // retry
      ]);

      const metrics = evaluator.computeMetrics(session);
      expect(metrics.accuracy).toBe(1);
      expect(metrics.firstAttemptAccuracy).toBe(0.5); // only 1 of 2 was first-attempt
    });

    it("returns zeros for empty session", () => {
      const session = buildSession([]);
      const metrics = evaluator.computeMetrics(session);
      expect(metrics.accuracy).toBe(0);
      expect(metrics.firstAttemptAccuracy).toBe(0);
      expect(metrics.avgHintsPerQuestion).toBe(0);
    });
  });

  // ─── computeMasteryLevel ─────────────────────────────────────────────────────

  describe("computeMasteryLevel", () => {
    it("returns Mastered for 85% accuracy with 70% first-attempt", () => {
      const level = evaluator.computeMasteryLevel(
        { accuracy: 0.85, firstAttemptAccuracy: 0.75, avgHintsPerQuestion: 0.5, avgTimePerQuestion: 40 },
        0.8
      );
      expect(level).toBe(MasteryLevel.Mastered);
    });

    it("returns Extended for 95%+ accuracy, 90%+ first-attempt, minimal hints", () => {
      const level = evaluator.computeMasteryLevel(
        { accuracy: 0.97, firstAttemptAccuracy: 0.95, avgHintsPerQuestion: 0.1, avgTimePerQuestion: 25 },
        0.8
      );
      expect(level).toBe(MasteryLevel.Extended);
    });

    it("returns Developing for 60% accuracy", () => {
      const level = evaluator.computeMasteryLevel(
        { accuracy: 0.6, firstAttemptAccuracy: 0.5, avgHintsPerQuestion: 1.5, avgTimePerQuestion: 90 },
        0.8
      );
      expect(level).toBe(MasteryLevel.Developing);
    });

    it("returns Emerging for below 50% accuracy", () => {
      const level = evaluator.computeMasteryLevel(
        { accuracy: 0.4, firstAttemptAccuracy: 0.3, avgHintsPerQuestion: 2, avgTimePerQuestion: 120 },
        0.8
      );
      expect(level).toBe(MasteryLevel.Emerging);
    });

    it("does NOT return Mastered if first-attempt accuracy is below 70%", () => {
      // Even if overall accuracy is 85%, if first-attempt is low, not mastered
      const level = evaluator.computeMasteryLevel(
        { accuracy: 0.85, firstAttemptAccuracy: 0.6, avgHintsPerQuestion: 0.5, avgTimePerQuestion: 40 },
        0.8
      );
      expect(level).not.toBe(MasteryLevel.Mastered);
    });
  });

  // ─── needsReview ─────────────────────────────────────────────────────────────

  describe("needsReview", () => {
    it("mastered topics need review after 14 days", () => {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      expect(evaluator.needsReview(fifteenDaysAgo, MasteryLevel.Mastered)).toBe(true);
    });

    it("mastered topics practiced recently do not need review", () => {
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      expect(evaluator.needsReview(yesterday, MasteryLevel.Mastered)).toBe(false);
    });

    it("emerging topics need review after only 2 days", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(evaluator.needsReview(threeDaysAgo, MasteryLevel.Emerging)).toBe(true);
    });
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ResponseStub = Pick<QuestionResponse, "isCorrect" | "attemptCount" | "hintsUsed" | "timeSpentSeconds">;

function buildSession(responseStubs: ResponseStub[]): PracticeSession {
  const responses: QuestionResponse[] = responseStubs.map((r, i) => ({
    questionId: `q-${i}`,
    studentAnswer: "stub",
    submittedAt: new Date(),
    ...r,
  }));

  return {
    id: "session-test",
    studentId: "student-test",
    lessonId: "lesson-test",
    mode: PracticeMode.Guided,
    startedAt: new Date(),
    questions: [],
    responses,
    xpEarned: 0,
    accuracyPercent: 0,
  };
}
