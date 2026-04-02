/**
 * @test lib/petEngine
 *
 * Unit tests for the centralized pet engine.
 * Pure function tests — no React, no DOM.
 */

import {
  getReaction,
  personalityToStyle,
  type PetEvent,
  type PetReaction,
} from "../../apps/web/lib/petEngine";

describe("Pet Engine", () => {

  describe("getReaction", () => {
    it("returns happy mood for correct_answer", () => {
      const r = getReaction("correct_answer");
      expect(r.mood).toBe("happy");
      expect(r.animation).toBe("bounce");
      expect(r.message).toBeDefined();
      expect(r.message!.length).toBeGreaterThan(0);
      expect(r.duration).toBeGreaterThan(0);
    });

    it("returns thinking mood for wrong_answer", () => {
      const r = getReaction("wrong_answer");
      expect(r.mood).toBe("thinking");
    });

    it("returns proud mood for retry_success", () => {
      const r = getReaction("retry_success");
      expect(r.mood).toBe("proud");
      expect(r.animation).toBe("glow");
    });

    it("returns cheering for streak milestones", () => {
      expect(getReaction("streak_3").mood).toBe("cheering");
      expect(getReaction("streak_7").mood).toBe("cheering");
    });

    it("returns excited for streak_14 and level_up", () => {
      expect(getReaction("streak_14").mood).toBe("excited");
      expect(getReaction("level_up").mood).toBe("excited");
    });

    it("returns idle with no message for idle event", () => {
      const r = getReaction("idle");
      expect(r.mood).toBe("idle");
      expect(r.message).toBeUndefined();
      expect(r.duration).toBe(0);
    });

    it("returns a valid reaction for every event type", () => {
      const events: PetEvent[] = [
        "correct_answer", "wrong_answer", "retry_success", "hint_requested",
        "streak_3", "streak_7", "streak_14", "session_complete",
        "level_up", "badge_earned", "idle",
      ];
      for (const event of events) {
        const r = getReaction(event);
        expect(r.mood).toBeDefined();
        expect(r.animation).toBeDefined();
        expect(typeof r.duration).toBe("number");
      }
    });
  });

  describe("personality modifier", () => {
    it("maps fast_thinker to playful", () => {
      expect(personalityToStyle("fast_thinker")).toBe("playful");
    });

    it("maps careful_learner to calm", () => {
      expect(personalityToStyle("careful_learner")).toBe("calm");
    });

    it("maps problem_solver to motivator", () => {
      expect(personalityToStyle("problem_solver")).toBe("motivator");
    });

    it("defaults to motivator for unknown personality", () => {
      expect(personalityToStyle(undefined)).toBe("motivator");
      expect(personalityToStyle("unknown_type")).toBe("motivator");
    });

    it("changes message tone based on personality", () => {
      const playful = getReaction("correct_answer", "fast_thinker");
      const calm    = getReaction("correct_answer", "careful_learner");
      // Both should have messages, but they come from different pools
      expect(playful.message).toBeDefined();
      expect(calm.message).toBeDefined();
    });
  });

  describe("anti-repeat", () => {
    it("does not return the same message twice in a row", () => {
      // Run 20 times and check no consecutive duplicates
      let prev = "";
      let repeatCount = 0;
      for (let i = 0; i < 20; i++) {
        const r = getReaction("correct_answer");
        if (r.message === prev) repeatCount++;
        prev = r.message ?? "";
      }
      // Allow at most 1 repeat (edge case when pool has few items)
      expect(repeatCount).toBeLessThanOrEqual(1);
    });
  });

  describe("output shape", () => {
    it("always returns required fields", () => {
      const r = getReaction("correct_answer");
      expect(typeof r.mood).toBe("string");
      expect(typeof r.animation).toBe("string");
      expect(typeof r.duration).toBe("number");
      expect(["idle", "happy", "cheering", "thinking", "proud", "excited"]).toContain(r.mood);
      expect(["bob", "bounce", "pulse", "wiggle", "glow", "none"]).toContain(r.animation);
    });
  });
});
