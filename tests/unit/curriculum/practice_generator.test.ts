/**
 * @test curriculum/practice_generator
 *
 * Tests for XP calculation and adaptive difficulty adjustment.
 */

import { PracticeGenerator } from "@/curriculum/practice_generator";
import { Difficulty, PracticeMode, XPReason } from "@/types";

describe("PracticeGenerator", () => {
  let generator: PracticeGenerator;

  beforeEach(() => {
    generator = new PracticeGenerator();
  });

  // ─── calculateQuestionXP ─────────────────────────────────────────────────────

  describe("calculateQuestionXP", () => {
    it("awards full XP for correct first attempt in guided mode", () => {
      const result = generator.calculateQuestionXP({
        isCorrect: true, attemptCount: 1, mode: PracticeMode.Guided, baseXP: 10,
      });
      expect(result.amount).toBe(10);
      expect(result.reason).toBe(XPReason.CorrectAnswer);
    });

    it("awards reduced XP for retry success", () => {
      const result = generator.calculateQuestionXP({
        isCorrect: true, attemptCount: 2, mode: PracticeMode.Guided, baseXP: 10,
      });
      expect(result.amount).toBe(6); // 60% of base
      expect(result.reason).toBe(XPReason.RetrySuccess);
    });

    it("awards 0 XP for incorrect answer", () => {
      const result = generator.calculateQuestionXP({
        isCorrect: false, attemptCount: 1, mode: PracticeMode.Guided, baseXP: 10,
      });
      expect(result.amount).toBe(0);
    });

    it("doubles XP for challenge mode", () => {
      const result = generator.calculateQuestionXP({
        isCorrect: true, attemptCount: 1, mode: PracticeMode.Challenge, baseXP: 10,
      });
      expect(result.amount).toBe(20);
      expect(result.reason).toBe(XPReason.ChallengeComplete);
    });
  });

  // ─── adaptDifficulty ────────────────────────────────────────────────────────

  describe("adaptDifficulty", () => {
    it("scales up difficulty after 3 consecutive correct answers", () => {
      const result = generator.adaptDifficulty(Difficulty.Beginner, 3, 0);
      expect(result).toBe(Difficulty.Intermediate);
    });

    it("scales down difficulty after 2 consecutive incorrect answers", () => {
      const result = generator.adaptDifficulty(Difficulty.Advanced, 0, 2);
      expect(result).toBe(Difficulty.Intermediate);
    });

    it("maintains difficulty when performance is mixed", () => {
      const result = generator.adaptDifficulty(Difficulty.Intermediate, 1, 1);
      expect(result).toBe(Difficulty.Intermediate);
    });

    it("does not scale above Challenge difficulty", () => {
      const result = generator.adaptDifficulty(Difficulty.Challenge, 5, 0);
      expect(result).toBe(Difficulty.Challenge);
    });

    it("does not scale below Beginner difficulty", () => {
      const result = generator.adaptDifficulty(Difficulty.Beginner, 0, 5);
      expect(result).toBe(Difficulty.Beginner);
    });
  });
});
