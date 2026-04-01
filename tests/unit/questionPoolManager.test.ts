/**
 * @test api/services/questionPoolManager
 *
 * Unit tests for the multi-difficulty question pool manager.
 *
 * Tests the pure logic for:
 *   1. easier_question → difficulty decreases correctly
 *   2. harder_question → difficulty increases correctly
 *   3. next_question → difficulty unchanged
 *   4. pool exhaustion fallback works
 *   5. no out-of-bounds errors
 *   6. session remains stable under rapid adaptation changes
 *   7. guardrails prevent excessive oscillation
 *   8. cannot skip difficulty levels
 */

import {
  createDifficultyState,
  resolveNextDifficulty,
  getNextFromPool,
  advancePoolIndex,
  populatePool,
  poolNeedsGeneration,
  totalRemainingQuestions,
  type DifficultyState,
  type PoolDifficulty,
  type QuestionPoolEntry,
} from "../../api/services/questionPoolManager";

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeQuestion(id: string, difficulty = "intermediate"): QuestionPoolEntry {
  return {
    id,
    type:          "fill_in_blank",
    prompt:        `Question ${id}`,
    correctAnswer: "42",
    explanation:   "",
    difficulty:    difficulty as any,
    grade:         "G4",
    conceptTags:   ["test"],
    xpReward:      10,
    topicId:       "g4-test",
  };
}

function makePool(easyCount: number, medCount: number, hardCount: number): DifficultyState {
  const state = createDifficultyState(
    Array.from({ length: medCount }, (_, i) => makeQuestion(`med-${i}`, "intermediate")),
    "medium",
  );
  populatePool(state, "easy", Array.from({ length: easyCount }, (_, i) => makeQuestion(`easy-${i}`, "beginner")));
  populatePool(state, "hard", Array.from({ length: hardCount }, (_, i) => makeQuestion(`hard-${i}`, "advanced")));
  return state;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Question Pool Manager", () => {

  // ── Initialization ──────────────────────────────────────────────────────

  describe("createDifficultyState", () => {
    it("creates state with medium pool populated", () => {
      const questions = [makeQuestion("q1"), makeQuestion("q2")];
      const state = createDifficultyState(questions, "medium");

      expect(state.current).toBe("medium");
      expect(state.pool.medium).toHaveLength(2);
      expect(state.pool.easy).toHaveLength(0);
      expect(state.pool.hard).toHaveLength(0);
      expect(state.indices).toEqual({ easy: 0, medium: 0, hard: 0 });
    });

    it("respects custom starting difficulty", () => {
      const state = createDifficultyState([makeQuestion("q1")], "easy");
      expect(state.current).toBe("easy");
    });
  });

  // ── Scenario 1: easier_question → difficulty decreases ──────────────────

  describe("easier_question decreases difficulty", () => {
    it("hard → medium", () => {
      const state = makePool(3, 3, 3);
      state.current = "hard";
      const next = resolveNextDifficulty(state, "easier_question");
      expect(next).toBe("medium");
    });

    it("medium → easy", () => {
      const state = makePool(3, 3, 3);
      state.current = "medium";
      const next = resolveNextDifficulty(state, "easier_question");
      expect(next).toBe("easy");
    });

    it("easy → stays easy (floor)", () => {
      const state = makePool(3, 3, 3);
      state.current = "easy";
      const next = resolveNextDifficulty(state, "easier_question");
      expect(next).toBe("easy");
    });
  });

  // ── Scenario 2: harder_question → difficulty increases ──────────────────

  describe("harder_question increases difficulty", () => {
    it("easy → medium", () => {
      const state = makePool(3, 3, 3);
      state.current = "easy";
      const next = resolveNextDifficulty(state, "harder_question");
      expect(next).toBe("medium");
    });

    it("medium → hard", () => {
      const state = makePool(3, 3, 3);
      state.current = "medium";
      const next = resolveNextDifficulty(state, "harder_question");
      expect(next).toBe("hard");
    });

    it("hard → stays hard (ceiling)", () => {
      const state = makePool(3, 3, 3);
      state.current = "hard";
      const next = resolveNextDifficulty(state, "harder_question");
      expect(next).toBe("hard");
    });
  });

  // ── Scenario 3: next_question → difficulty unchanged ────────────────────

  describe("next_question keeps difficulty unchanged", () => {
    it("stays at current difficulty", () => {
      for (const d of ["easy", "medium", "hard"] as PoolDifficulty[]) {
        const state = makePool(3, 3, 3);
        state.current = d;
        const next = resolveNextDifficulty(state, "next_question");
        expect(next).toBe(d);
      }
    });

    it("celebrate_and_continue also keeps difficulty unchanged", () => {
      const state = makePool(3, 3, 3);
      state.current = "medium";
      expect(resolveNextDifficulty(state, "celebrate_and_continue")).toBe("medium");
    });

    it("show_hint keeps difficulty unchanged", () => {
      const state = makePool(3, 3, 3);
      state.current = "hard";
      expect(resolveNextDifficulty(state, "show_hint")).toBe("hard");
    });
  });

  // ── Scenario 4: pool exhaustion fallback ────────────────────────────────

  describe("pool exhaustion falls back to medium", () => {
    it("falls back to medium when easy is exhausted", () => {
      const state = makePool(1, 3, 0);
      state.indices.easy = 1; // exhausted easy pool

      const { question, fromDifficulty } = getNextFromPool(state, "easy");

      expect(question).not.toBeNull();
      expect(fromDifficulty).toBe("medium");
    });

    it("falls back to medium when hard is exhausted", () => {
      const state = makePool(0, 3, 1);
      state.indices.hard = 1; // exhausted hard pool

      const { question, fromDifficulty } = getNextFromPool(state, "hard");

      expect(question).not.toBeNull();
      expect(fromDifficulty).toBe("medium");
    });

    it("returns null when ALL pools exhausted", () => {
      const state = makePool(1, 1, 1);
      state.indices = { easy: 1, medium: 1, hard: 1 };

      const { question } = getNextFromPool(state, "medium");
      expect(question).toBeNull();
    });
  });

  // ── Scenario 5: no out-of-bounds errors ─────────────────────────────────

  describe("no out-of-bounds errors", () => {
    it("handles empty pools gracefully", () => {
      const state = createDifficultyState([], "medium");
      const { question } = getNextFromPool(state, "medium");
      expect(question).toBeNull();
    });

    it("handles advancing past pool end", () => {
      const state = makePool(0, 2, 0);
      advancePoolIndex(state, "medium");
      advancePoolIndex(state, "medium");

      // Now medium is exhausted
      const { question } = getNextFromPool(state, "medium");
      expect(question).toBeNull();
    });
  });

  // ── Scenario 6: rapid adaptation changes ────────────────────────────────

  describe("stability under rapid difficulty changes", () => {
    it("serves correct questions through multiple difficulty shifts", () => {
      const state = makePool(3, 3, 3);

      // Start at medium
      const q1 = getNextFromPool(state, "medium");
      expect(q1.question?.id).toBe("med-0");
      advancePoolIndex(state, "medium");

      // Shift to easy
      const q2 = getNextFromPool(state, "easy");
      expect(q2.question?.id).toBe("easy-0");
      advancePoolIndex(state, "easy");

      // Shift to hard
      const q3 = getNextFromPool(state, "hard");
      expect(q3.question?.id).toBe("hard-0");
      advancePoolIndex(state, "hard");

      // Back to medium — continues where it left off
      const q4 = getNextFromPool(state, "medium");
      expect(q4.question?.id).toBe("med-1");
      advancePoolIndex(state, "medium");

      expect(totalRemainingQuestions(state)).toBe(5); // 2 easy + 1 med + 2 hard
    });
  });

  // ── Scenario 7: guardrails prevent excessive oscillation ────────────────

  describe("guardrails", () => {
    it("prevents more than 2 shifts in 3 questions", () => {
      const state = makePool(3, 3, 3);
      // Simulate oscillation: easy → medium → easy (2 shifts in 3)
      state.recentHistory = ["easy", "medium", "easy"];
      state.current = "easy";

      // Trying to go to medium again (3rd shift in recent window)
      const next = resolveNextDifficulty(state, "harder_question");

      // Guardrail blocks it — stays at easy
      expect(next).toBe("easy");
    });

    it("allows shift when history is stable", () => {
      const state = makePool(3, 3, 3);
      // Stable history: medium, medium, medium
      state.recentHistory = ["medium", "medium", "medium"];
      state.current = "medium";

      const next = resolveNextDifficulty(state, "harder_question");
      expect(next).toBe("hard"); // Allowed — only 1 shift
    });
  });

  // ── Scenario 8: cannot skip difficulty levels ───────────────────────────

  describe("cannot skip difficulty levels", () => {
    it("easier_question from hard goes to medium, not easy", () => {
      const state = makePool(3, 3, 3);
      state.current = "hard";
      expect(resolveNextDifficulty(state, "easier_question")).toBe("medium");
    });

    it("harder_question from easy goes to medium, not hard", () => {
      const state = makePool(3, 3, 3);
      state.current = "easy";
      expect(resolveNextDifficulty(state, "harder_question")).toBe("medium");
    });
  });

  // ── Pool management utilities ───────────────────────────────────────────

  describe("pool utilities", () => {
    it("poolNeedsGeneration returns true for empty pool", () => {
      const state = createDifficultyState([makeQuestion("q1")], "medium");
      expect(poolNeedsGeneration(state, "easy")).toBe(true);
      expect(poolNeedsGeneration(state, "medium")).toBe(false);
      expect(poolNeedsGeneration(state, "hard")).toBe(true);
    });

    it("totalRemainingQuestions counts correctly", () => {
      const state = makePool(2, 3, 2);
      expect(totalRemainingQuestions(state)).toBe(7);

      advancePoolIndex(state, "medium");
      expect(totalRemainingQuestions(state)).toBe(6);

      advancePoolIndex(state, "easy");
      advancePoolIndex(state, "hard");
      expect(totalRemainingQuestions(state)).toBe(4);
    });

    it("advancePoolIndex records history", () => {
      const state = makePool(3, 3, 3);
      advancePoolIndex(state, "easy");
      advancePoolIndex(state, "medium");
      advancePoolIndex(state, "hard");

      expect(state.recentHistory).toEqual(["easy", "medium", "hard"]);
      expect(state.current).toBe("hard");
    });

    it("history bounded to 10 entries", () => {
      const state = makePool(20, 20, 20);
      for (let i = 0; i < 15; i++) {
        advancePoolIndex(state, "medium");
      }
      expect(state.recentHistory.length).toBeLessThanOrEqual(10);
    });
  });
});
