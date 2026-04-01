/**
 * @test api/services/sessionAdaptationService
 *
 * Unit tests for the Session Adaptation Engine's in-session decision logic.
 *
 * Strategy: decideSessionNextStep is a pure function — it takes session context
 * and the last answer, and returns a SessionNextStep. No DB, no mocks needed.
 *
 * Scenarios tested:
 *   1. 2+ consecutive wrong answers → remediation action
 *   2. repeated hint usage → guided support
 *   3. recovery after struggle → celebrate_and_continue
 *   4. 3+ consecutive correct → harder_question
 *   5. fast + inaccurate pattern → careless corrective guidance
 *   6. slow + accurate pattern → no punishment
 *   7. fatigue / long session → positive stopping recommendation
 *   8. normal answer → next_question
 *   9. visual topic gets visual explanation
 *  10. confidence dropping → easier question
 */

import {
  decideSessionNextStep,
  SessionResponse,
  SessionContext,
} from "../../api/services/sessionAdaptationService";

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeResponse(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    questionId:       "q-1",
    isCorrect:        true,
    attemptCount:     1,
    hintsUsed:        0,
    timeSpentSeconds: 25,
    ...overrides,
  };
}

function makeContext(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    topicId:         "g4-fractions-add",
    totalQuestions:   5,
    currentIndex:    1,
    responses:       [],
    sessionComplete: false,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Session Adaptation — decideSessionNextStep", () => {

  // ── Scenario 1: 2+ consecutive wrong → remediation ──────────────────────

  describe("2 consecutive wrong answers", () => {
    it("returns easier_question", () => {
      const responses = [
        makeResponse({ isCorrect: false, questionId: "q-1" }),
        makeResponse({ isCorrect: false, questionId: "q-2" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 2 });
      const lastAnswer = responses[1]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("easier_question");
      expect(step.difficulty).toBe("easy");
      expect(step.sourceSignals.consecutiveWrong).toBe(true);
    });
  });

  describe("3+ consecutive wrong answers", () => {
    it("returns show_step_by_step or show_visual_explanation", () => {
      const responses = [
        makeResponse({ isCorrect: false, questionId: "q-1" }),
        makeResponse({ isCorrect: false, questionId: "q-2" }),
        makeResponse({ isCorrect: false, questionId: "q-3" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 3 });
      const lastAnswer = responses[2]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(["show_step_by_step", "show_visual_explanation"]).toContain(step.action);
      expect(step.difficulty).toBe("easy");
      expect(step.sourceSignals.consecutiveWrong).toBe(true);
    });
  });

  // ── Scenario 2: Repeated hint usage → guided support ────────────────────

  describe("heavy hint usage (3+ hints across session)", () => {
    it("returns show_step_by_step with hintDependency signal", () => {
      const responses = [
        makeResponse({ isCorrect: true,  hintsUsed: 1, questionId: "q-1" }),
        makeResponse({ isCorrect: false, hintsUsed: 1, questionId: "q-2" }),
        makeResponse({ isCorrect: true,  hintsUsed: 1, questionId: "q-3" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 3 });
      const lastAnswer = responses[2]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("show_step_by_step");
      expect(step.sourceSignals.hintDependency).toBe(true);
      expect(step.explanationPreference).toBe("step_by_step");
    });
  });

  // ── Scenario 3: Recovery after struggle → celebrate ─────────────────────

  describe("recovery: wrong, wrong, then correct", () => {
    it("returns celebrate_and_continue with recovery signal", () => {
      const responses = [
        makeResponse({ isCorrect: false, questionId: "q-1" }),
        makeResponse({ isCorrect: false, questionId: "q-2" }),
        makeResponse({ isCorrect: true,  questionId: "q-3" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 3 });
      const lastAnswer = responses[2]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("celebrate_and_continue");
      expect(step.sourceSignals.sessionRecovery).toBe(true);
    });
  });

  // ── Scenario 4: 3+ correct in a row → harder_question ──────────────────

  describe("3 consecutive correct answers", () => {
    it("returns harder_question with momentum signal", () => {
      const responses = [
        makeResponse({ isCorrect: true, questionId: "q-1" }),
        makeResponse({ isCorrect: true, questionId: "q-2" }),
        makeResponse({ isCorrect: true, questionId: "q-3" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 3 });
      const lastAnswer = responses[2]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("harder_question");
      expect(step.difficulty).toBe("hard");
      expect(step.sourceSignals.consecutiveCorrect).toBe(true);
      expect(step.sourceSignals.masteryProgressing).toBe(true);
    });
  });

  // ── Scenario 5: Fast + inaccurate → careless corrective ─────────────────

  describe("fast but inaccurate pattern (careless)", () => {
    it("returns show_hint with carelessPattern signal", () => {
      const responses = [
        makeResponse({ isCorrect: false, timeSpentSeconds: 8,  questionId: "q-1" }),
        makeResponse({ isCorrect: false, timeSpentSeconds: 10, questionId: "q-2" }),
        makeResponse({ isCorrect: true,  timeSpentSeconds: 12, questionId: "q-3" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 3 });
      const lastAnswer = responses[2]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("show_hint");
      expect(step.sourceSignals.carelessPattern).toBe(true);
    });
  });

  // ── Scenario 6: Slow + accurate → no punishment ─────────────────────────

  describe("slow but accurate student", () => {
    it("does not reduce difficulty or recommend remediation", () => {
      const responses = [
        makeResponse({ isCorrect: true, timeSpentSeconds: 60, questionId: "q-1" }),
        makeResponse({ isCorrect: true, timeSpentSeconds: 55, questionId: "q-2" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 2 });
      const lastAnswer = responses[1]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      // Should be positive: celebrate_and_continue or next_question
      expect(["celebrate_and_continue", "next_question", "harder_question"]).toContain(step.action);
      expect(step.difficulty).not.toBe("easy");
      expect(step.sourceSignals.consecutiveWrong).toBeUndefined();
      expect(step.sourceSignals.carelessPattern).toBeUndefined();
    });
  });

  // ── Scenario 7: Fatigue / long session → positive stop ──────────────────

  describe("fatigue risk — declining accuracy in long session", () => {
    it("returns end_session_positive or switch_to_revision", () => {
      const responses = [
        // First half: good
        makeResponse({ isCorrect: true,  questionId: "q-1", timeSpentSeconds: 20 }),
        makeResponse({ isCorrect: true,  questionId: "q-2", timeSpentSeconds: 22 }),
        makeResponse({ isCorrect: true,  questionId: "q-3", timeSpentSeconds: 25 }),
        // Second half: declining
        makeResponse({ isCorrect: false, questionId: "q-4", timeSpentSeconds: 30 }),
        makeResponse({ isCorrect: false, questionId: "q-5", timeSpentSeconds: 35 }),
        makeResponse({ isCorrect: false, questionId: "q-6", timeSpentSeconds: 40 }),
      ];
      const ctx = makeContext({
        responses,
        currentIndex: 6,
        totalQuestions: 7,
      });
      const lastAnswer = responses[5]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(["end_session_positive", "switch_to_revision"]).toContain(step.action);
      expect(step.sourceSignals.fatigueRisk).toBe(true);
    });
  });

  // ── Scenario 8: Normal single answer → next_question ────────────────────

  describe("single correct answer in normal flow", () => {
    it("returns next_question", () => {
      const responses = [
        makeResponse({ isCorrect: true, questionId: "q-1" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 1 });
      const lastAnswer = responses[0]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("next_question");
    });
  });

  // ── Scenario 9: Visual topic gets visual explanation ─────────────────────

  describe("visual topic with 3+ consecutive wrong", () => {
    it("returns show_visual_explanation", () => {
      const responses = [
        makeResponse({ isCorrect: false, questionId: "q-1" }),
        makeResponse({ isCorrect: false, questionId: "q-2" }),
        makeResponse({ isCorrect: false, questionId: "q-3" }),
      ];
      const ctx = makeContext({
        topicId: "g4-fraction-bars",  // contains "fraction" — visual topic
        responses,
        currentIndex: 3,
      });
      const lastAnswer = responses[2]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("show_visual_explanation");
      expect(step.explanationPreference).toBe("visual");
      expect(step.sourceSignals.visualTopic).toBe(true);
    });
  });

  // ── Scenario 10: Confidence dropping → easier question ──────────────────

  describe("confidence dropping across session", () => {
    it("returns easier_question with confidenceDrop signal", () => {
      const responses = [
        makeResponse({ isCorrect: true,  confidenceBefore: 5, questionId: "q-1" }),
        makeResponse({ isCorrect: true,  confidenceBefore: 4, questionId: "q-2" }),
        makeResponse({ isCorrect: false, confidenceBefore: 2, questionId: "q-3" }),
      ];
      const ctx = makeContext({ responses, currentIndex: 3 });
      const lastAnswer = responses[2]!;

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("easier_question");
      expect(step.sourceSignals.confidenceDrop).toBe(true);
      expect(step.difficulty).toBe("easy");
    });
  });

  // ── Session complete → positive ending ──────────────────────────────────

  describe("session already complete", () => {
    it("returns end_session_positive", () => {
      const ctx = makeContext({ sessionComplete: true, responses: [] });
      const lastAnswer = makeResponse();

      const step = decideSessionNextStep(ctx, lastAnswer);

      expect(step.action).toBe("end_session_positive");
    });
  });

  // ── Output shape validation ─────────────────────────────────────────────

  describe("output shape", () => {
    it("always returns required fields", () => {
      const ctx = makeContext({ responses: [makeResponse()] });
      const step = decideSessionNextStep(ctx, makeResponse());

      expect(typeof step.action).toBe("string");
      expect(typeof step.reason).toBe("string");
      expect(typeof step.encouragement).toBe("string");
      expect(typeof step.sourceSignals).toBe("object");
      expect(step.reason.length).toBeGreaterThan(0);
      expect(step.encouragement.length).toBeGreaterThan(0);
    });
  });
});
