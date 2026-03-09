/**
 * @test services/gamification/xp_engine
 *
 * Tests for XP calculation, level detection, and progress tracking.
 * These are pure functions — no DB, no AI, fully deterministic.
 */

import { XPEngine, LEVELS, XP_TABLE } from "@/services/gamification/xp_engine";
import { XPReason } from "@/types";

describe("XPEngine", () => {
  let engine: XPEngine;

  beforeEach(() => {
    engine = new XPEngine();
  });

  // ─── calculateXP ────────────────────────────────────────────────────────────

  describe("calculateXP", () => {
    it("returns correct XP for CorrectAnswer", () => {
      expect(engine.calculateXP(XPReason.CorrectAnswer)).toBe(10);
    });

    it("returns correct XP for RetrySuccess", () => {
      expect(engine.calculateXP(XPReason.RetrySuccess)).toBe(6);
    });

    it("returns correct XP for DailyLogin", () => {
      expect(engine.calculateXP(XPReason.DailyLogin)).toBe(5);
    });

    it("returns correct XP for ChallengeComplete", () => {
      expect(engine.calculateXP(XPReason.ChallengeComplete)).toBe(20);
    });

    it("applies bonus multiplier correctly", () => {
      expect(engine.calculateXP(XPReason.CorrectAnswer, undefined, 2)).toBe(20);
    });

    it("uses override value when provided", () => {
      expect(engine.calculateXP(XPReason.BadgeEarned, 25)).toBe(25);
    });

    it("floors the result (no fractional XP)", () => {
      expect(engine.calculateXP(XPReason.CorrectAnswer, 10, 1.5)).toBe(15);
      expect(engine.calculateXP(XPReason.CorrectAnswer, 7, 1.5)).toBe(10); // floor(10.5) = 10
    });
  });

  // ─── getLevelForXP ──────────────────────────────────────────────────────────

  describe("getLevelForXP", () => {
    it("returns level 1 for 0 XP", () => {
      expect(engine.getLevelForXP(0).level).toBe(1);
    });

    it("returns level 1 for 99 XP", () => {
      expect(engine.getLevelForXP(99).level).toBe(1);
    });

    it("returns level 2 for 100 XP", () => {
      expect(engine.getLevelForXP(100).level).toBe(2);
    });

    it("returns level 2 for 282 XP", () => {
      expect(engine.getLevelForXP(282).level).toBe(2);
    });

    it("returns level 3 for 283 XP", () => {
      expect(engine.getLevelForXP(283).level).toBe(3);
    });

    it("returns max level for very high XP", () => {
      const maxLevel = LEVELS[LEVELS.length - 1]!;
      expect(engine.getLevelForXP(999999).level).toBe(maxLevel.level);
    });
  });

  // ─── detectLevelUp ──────────────────────────────────────────────────────────

  describe("detectLevelUp", () => {
    it("returns null when no level-up occurs", () => {
      expect(engine.detectLevelUp(50, 10)).toBeNull();
    });

    it("detects level-up from level 1 to level 2", () => {
      const result = engine.detectLevelUp(95, 10); // 95 + 10 = 105 → level 2
      expect(result).not.toBeNull();
      expect(result!.level).toBe(2);
    });

    it("returns null when XP is added but stays in same level", () => {
      expect(engine.detectLevelUp(200, 50)).toBeNull(); // 250 still level 2
    });

    it("detects level-up spanning multiple levels (large XP award)", () => {
      // Edge case: large XP gain jumps multiple levels
      const result = engine.detectLevelUp(0, 1000);
      expect(result).not.toBeNull();
      expect(result!.level).toBeGreaterThan(2);
    });
  });

  // ─── getLevelProgress ───────────────────────────────────────────────────────

  describe("getLevelProgress", () => {
    it("returns 0 progress at start of level 1", () => {
      expect(engine.getLevelProgress(0)).toBe(0);
    });

    it("returns progress between 0 and 1", () => {
      const progress = engine.getLevelProgress(50);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
    });

    it("returns 1 for max level students", () => {
      expect(engine.getLevelProgress(999999)).toBe(1);
    });
  });

  // ─── xpToNextLevel ──────────────────────────────────────────────────────────

  describe("xpToNextLevel", () => {
    it("returns XP needed to reach level 2 from 0", () => {
      expect(engine.xpToNextLevel(0)).toBe(100);
    });

    it("returns 0 for max level", () => {
      expect(engine.xpToNextLevel(999999)).toBe(0);
    });

    it("returns correct remaining XP mid-level", () => {
      // Level 2 starts at 100, ends at 282. At 200 XP: 82 XP remaining to level 3
      expect(engine.xpToNextLevel(200)).toBe(83); // 283 - 200 = 83
    });
  });

  // ─── XP Table completeness ───────────────────────────────────────────────────

  describe("XP_TABLE completeness", () => {
    it("has an entry for every XPReason enum value", () => {
      const reasons = Object.values(XPReason);
      for (const reason of reasons) {
        expect(XP_TABLE).toHaveProperty(reason);
      }
    });
  });
});
