/**
 * @test services/gamification/badges_engine
 *
 * Tests for badge evaluation logic, event-filtered lookups, and conversion.
 * All tests are pure — no DB, no randomness, fully deterministic.
 */

import {
  BadgesEngine,
  BadgeDefinition,
  BadgeCheckContext,
  BadgeTriggerEvent,
  BADGE_REGISTRY,
} from "@/services/gamification/badges_engine";
import { BadgeCategory } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<BadgeCheckContext> = {}): BadgeCheckContext {
  return {
    event: BadgeTriggerEvent.SessionCompleted,
    studentStats: {
      totalSessions: 1,
      totalCorrectFirstAttempt: 5,
      totalRetrySuccesses: 0,
      streakDays: 0,
      topicsExplored: 1,
      masteredTopics: 0,
    },
    ...overrides,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("BadgesEngine", () => {
  let engine: BadgesEngine;

  beforeEach(() => {
    engine = new BadgesEngine();
  });

  // ── evaluate() ──────────────────────────────────────────────────────────────

  describe("evaluate", () => {
    it("returns no badges when no conditions are met", () => {
      const context = makeContext();
      const result = engine.evaluate(context, []);
      // Default context has 0 streak, 0 mastereds, 0 retry successes, no session stats
      // No badge should fire with these defaults
      expect(result).toHaveLength(0);
    });

    it("returns 'perfect score' badge when accuracy=1 and hintsUsed=0", () => {
      const context = makeContext({
        sessionStats: { accuracy: 1, hintsUsed: 0, timeSeconds: 120, mode: "practice" },
      });
      const result = engine.evaluate(context, []);
      const ids = result.map((b) => b.id);
      expect(ids).toContain("badge-perfect-score");
      // flying-solo badge also fires (hintsUsed === 0)
      expect(ids).toContain("badge-no-hints");
    });

    it("does NOT return 'perfect score' if hints were used", () => {
      const context = makeContext({
        sessionStats: { accuracy: 1, hintsUsed: 2, timeSeconds: 90, mode: "practice" },
      });
      const result = engine.evaluate(context, []);
      const ids = result.map((b) => b.id);
      expect(ids).not.toContain("badge-perfect-score");
    });

    it("does NOT return 'flying solo' if hints were used", () => {
      const context = makeContext({
        sessionStats: { accuracy: 0.8, hintsUsed: 3, timeSeconds: 90, mode: "practice" },
      });
      const ids = engine.evaluate(context, []).map((b) => b.id);
      expect(ids).not.toContain("badge-no-hints");
    });

    it("returns 'topic conqueror' when masteredTopics === 1", () => {
      const context = makeContext({
        studentStats: {
          totalSessions: 5,
          totalCorrectFirstAttempt: 20,
          totalRetrySuccesses: 2,
          streakDays: 0,
          topicsExplored: 2,
          masteredTopics: 1,
        },
      });
      const ids = engine.evaluate(context, []).map((b) => b.id);
      expect(ids).toContain("badge-first-mastery");
    });

    it("does NOT return 'topic conqueror' again if already earned", () => {
      const context = makeContext({
        studentStats: {
          totalSessions: 5,
          totalCorrectFirstAttempt: 20,
          totalRetrySuccesses: 2,
          streakDays: 0,
          topicsExplored: 2,
          masteredTopics: 1,
        },
      });
      const ids = engine.evaluate(context, ["badge-first-mastery"]).map((b) => b.id);
      expect(ids).not.toContain("badge-first-mastery");
    });

    it("returns streak badge at exactly 3 days", () => {
      const context = makeContext({
        studentStats: {
          totalSessions: 3,
          totalCorrectFirstAttempt: 10,
          totalRetrySuccesses: 0,
          streakDays: 3,
          topicsExplored: 1,
          masteredTopics: 0,
        },
      });
      const ids = engine.evaluate(context, []).map((b) => b.id);
      expect(ids).toContain("badge-streak-3");
    });

    it("does NOT return streak-3 badge at 4 days (exact match check)", () => {
      const context = makeContext({
        studentStats: {
          totalSessions: 4,
          totalCorrectFirstAttempt: 10,
          totalRetrySuccesses: 0,
          streakDays: 4,
          topicsExplored: 1,
          masteredTopics: 0,
        },
      });
      const ids = engine.evaluate(context, []).map((b) => b.id);
      expect(ids).not.toContain("badge-streak-3");
    });

    it("returns speedster badge for fast challenge completion", () => {
      const context = makeContext({
        sessionStats: { accuracy: 0.8, hintsUsed: 0, timeSeconds: 45, mode: "challenge" },
      });
      const ids = engine.evaluate(context, []).map((b) => b.id);
      expect(ids).toContain("badge-speedster");
    });

    it("does NOT return speedster badge for non-challenge mode", () => {
      const context = makeContext({
        sessionStats: { accuracy: 1, hintsUsed: 0, timeSeconds: 45, mode: "practice" },
      });
      const ids = engine.evaluate(context, []).map((b) => b.id);
      expect(ids).not.toContain("badge-speedster");
    });

    it("returns comeback kid at exactly 10 retry successes", () => {
      const context = makeContext({
        studentStats: {
          totalSessions: 10,
          totalCorrectFirstAttempt: 30,
          totalRetrySuccesses: 10,
          streakDays: 0,
          topicsExplored: 3,
          masteredTopics: 0,
        },
      });
      const ids = engine.evaluate(context, []).map((b) => b.id);
      expect(ids).toContain("badge-comeback-kid");
    });

    it("returns math explorer at 5 topics explored", () => {
      const context = makeContext({
        studentStats: {
          totalSessions: 8,
          totalCorrectFirstAttempt: 25,
          totalRetrySuccesses: 3,
          streakDays: 0,
          topicsExplored: 5,
          masteredTopics: 0,
        },
      });
      const ids = engine.evaluate(context, []).map((b) => b.id);
      expect(ids).toContain("badge-explorer");
    });

    it("filters out all already-earned badges", () => {
      const allBadgeIds = BADGE_REGISTRY.map((b) => b.id);
      // Give student a 7-day streak with perfect session
      const context = makeContext({
        studentStats: {
          totalSessions: 7,
          totalCorrectFirstAttempt: 40,
          totalRetrySuccesses: 10,
          streakDays: 7,
          topicsExplored: 5,
          masteredTopics: 1,
        },
        sessionStats: { accuracy: 1, hintsUsed: 0, timeSeconds: 45, mode: "challenge" },
      });
      // Pre-mark everything as earned
      const result = engine.evaluate(context, allBadgeIds);
      expect(result).toHaveLength(0);
    });
  });

  // ── toEarnedBadge() ─────────────────────────────────────────────────────────

  describe("toEarnedBadge", () => {
    it("converts a definition to a Badge record", () => {
      const def = BADGE_REGISTRY[0]!;
      const badge = engine.toEarnedBadge(def);

      expect(badge.id).toBe(def.id);
      expect(badge.name).toBe(def.name);
      expect(badge.description).toBe(def.description);
      expect(badge.iconUrl).toBe(def.iconUrl);
      expect(badge.category).toBe(def.category);
      expect(badge.xpBonus).toBe(def.xpBonus);
      expect(badge.earnedAt).toBeInstanceOf(Date);
    });

    it("sets earnedAt to approximately now", () => {
      const before = Date.now();
      const badge = engine.toEarnedBadge(BADGE_REGISTRY[0]!);
      const after = Date.now();
      expect(badge.earnedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(badge.earnedAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  // ── getBadgesForEvent() ──────────────────────────────────────────────────────

  describe("getBadgesForEvent", () => {
    it("returns only session-completion badges for SessionCompleted event", () => {
      const badges = engine.getBadgesForEvent(BadgeTriggerEvent.SessionCompleted);
      const ids = badges.map((b) => b.id);
      expect(ids).toContain("badge-perfect-score");
      expect(ids).toContain("badge-no-hints");
      expect(ids).not.toContain("badge-streak-3");
      expect(ids).not.toContain("badge-first-mastery");
    });

    it("returns streak badges for StreakUpdated event", () => {
      const badges = engine.getBadgesForEvent(BadgeTriggerEvent.StreakUpdated);
      const ids = badges.map((b) => b.id);
      expect(ids).toContain("badge-streak-3");
      expect(ids).toContain("badge-streak-7");
      expect(ids).toContain("badge-streak-30");
      expect(ids).not.toContain("badge-perfect-score");
    });

    it("returns mastery badges for LessonMastered event", () => {
      const badges = engine.getBadgesForEvent(BadgeTriggerEvent.LessonMastered);
      const ids = badges.map((b) => b.id);
      expect(ids).toContain("badge-first-mastery");
      expect(ids).toContain("badge-explorer");
    });

    it("returns speedster for ChallengeCompleted event", () => {
      const badges = engine.getBadgesForEvent(BadgeTriggerEvent.ChallengeCompleted);
      const ids = badges.map((b) => b.id);
      expect(ids).toContain("badge-speedster");
    });
  });

  // ── BADGE_REGISTRY integrity ─────────────────────────────────────────────────

  describe("BADGE_REGISTRY", () => {
    it("has no duplicate badge IDs", () => {
      const ids = BADGE_REGISTRY.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("every badge has required fields", () => {
      for (const badge of BADGE_REGISTRY) {
        expect(badge.id).toBeTruthy();
        expect(badge.name).toBeTruthy();
        expect(badge.description).toBeTruthy();
        expect(badge.iconUrl).toBeTruthy();
        expect(Object.values(BadgeCategory)).toContain(badge.category);
        expect(badge.xpBonus).toBeGreaterThanOrEqual(0);
        expect(typeof badge.check).toBe("function");
      }
    });
  });
});
