/**
 * @test Integration-style tests for critical product flows.
 *
 * These test the full decision pipelines end-to-end using real function calls.
 * They verify that the systems produce correct, stable output shapes when
 * composed together — catching integration bugs that unit tests miss.
 *
 * Flows tested:
 *   1. Practice submit → adaptation → difficulty selection pipeline
 *   2. Session adaptation + SubmissionResult shape stability
 *   3. Parent dashboard aggregation output shape
 *   4. Visual engine fallback when mathData is invalid
 *   5. Learning Brain → Session Adaptation → Difficulty consistency
 */

import { decideSessionNextStep } from "../../api/services/sessionAdaptationService";
import { decideLearningAction }  from "../../api/services/learningBrain/scorer";
import { extractSignals }         from "../../api/services/learningBrain/signals";
import {
  createDifficultyState,
  resolveNextDifficulty,
  getNextFromPool,
  advancePoolIndex,
} from "../../api/services/questionPoolManager";
import {
  computeLearningScore,
  computeConfidenceSignal,
  computeSupportNeed,
  computeLearningStatus,
  computeLearningPersonality,
  computeConfidenceExplanation,
  computeInsightBasis,
  generateInsights,
  buildMasteryMap,
  buildMasteryClusters,
  buildRecentHighlights,
} from "../../api/services/parentInsightsService";
import { getVisualExplanationSync } from "../../ai/services/visualExplanationEngine";
import { verifyAlignment }          from "../../ai/services/visualExplanationEngine/alignmentVerifier";
import type { MathData }             from "@mathai/shared-types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSessionResponse(overrides: Partial<{
  questionId: string; isCorrect: boolean; attemptCount: number;
  hintsUsed: number; timeSpentSeconds: number; misconceptionTag?: string;
  confidenceBefore?: number;
}> = {}) {
  return {
    questionId: "q-1", isCorrect: true, attemptCount: 1,
    hintsUsed: 0, timeSpentSeconds: 25, ...overrides,
  };
}

function makePoolQuestion(id: string, difficulty = "intermediate") {
  return {
    id, type: "fill_in_blank", prompt: `Q ${id}`, correctAnswer: "42",
    explanation: "", difficulty: difficulty as any, grade: "G4",
    conceptTags: ["test"], xpReward: 10, topicId: "g4-test",
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Integration: Practice submit → adaptation → difficulty pipeline", () => {

  it("struggling student gets easier questions through full pipeline", () => {
    // Step 1: Build session responses showing struggle
    const responses = [
      makeSessionResponse({ isCorrect: false, questionId: "q-1" }),
      makeSessionResponse({ isCorrect: false, questionId: "q-2" }),
    ];

    // Step 2: Adaptation engine decides
    const adaptation = decideSessionNextStep(
      { topicId: "g4-fractions", totalQuestions: 5, currentIndex: 2, responses, sessionComplete: false },
      responses[1]!,
    );
    expect(adaptation.action).toBe("easier_question");

    // Step 3: Difficulty manager resolves
    const pool = createDifficultyState(
      Array.from({ length: 5 }, (_, i) => makePoolQuestion(`med-${i}`)),
      "medium",
    );
    // Populate easy pool
    const easyQs = Array.from({ length: 3 }, (_, i) => makePoolQuestion(`easy-${i}`, "beginner"));
    pool.pool.easy = easyQs;

    const targetDifficulty = resolveNextDifficulty(pool, adaptation.action);
    expect(targetDifficulty).toBe("easy");

    // Step 4: Get question from easy pool
    const { question, fromDifficulty } = getNextFromPool(pool, targetDifficulty);
    expect(question).not.toBeNull();
    expect(question!.id).toBe("easy-0");
    expect(fromDifficulty).toBe("easy");
  });

  it("strong student gets harder questions through full pipeline", () => {
    const responses = [
      makeSessionResponse({ isCorrect: true, questionId: "q-1" }),
      makeSessionResponse({ isCorrect: true, questionId: "q-2" }),
      makeSessionResponse({ isCorrect: true, questionId: "q-3" }),
    ];

    const adaptation = decideSessionNextStep(
      { topicId: "g4-addition", totalQuestions: 5, currentIndex: 3, responses, sessionComplete: false },
      responses[2]!,
    );
    expect(adaptation.action).toBe("harder_question");

    const pool = createDifficultyState(
      Array.from({ length: 5 }, (_, i) => makePoolQuestion(`med-${i}`)),
      "medium",
    );
    pool.pool.hard = Array.from({ length: 3 }, (_, i) => makePoolQuestion(`hard-${i}`, "advanced"));

    const target = resolveNextDifficulty(pool, adaptation.action);
    expect(target).toBe("hard");

    const { question } = getNextFromPool(pool, target);
    expect(question!.id).toBe("hard-0");
  });
});

describe("Integration: Session adaptation response shape stability", () => {

  it("every adaptation action includes required fields", () => {
    const scenarios = [
      // 2 wrong
      { responses: [makeSessionResponse({ isCorrect: false }), makeSessionResponse({ isCorrect: false, questionId: "q-2" })], idx: 2 },
      // 3 correct
      { responses: [makeSessionResponse(), makeSessionResponse({ questionId: "q-2" }), makeSessionResponse({ questionId: "q-3" })], idx: 3 },
      // recovery
      { responses: [makeSessionResponse({ isCorrect: false }), makeSessionResponse({ isCorrect: false, questionId: "q-2" }), makeSessionResponse({ questionId: "q-3" })], idx: 3 },
      // normal
      { responses: [makeSessionResponse()], idx: 1 },
    ];

    for (const s of scenarios) {
      const step = decideSessionNextStep(
        { topicId: "g4-test", totalQuestions: 5, currentIndex: s.idx, responses: s.responses, sessionComplete: false },
        s.responses[s.responses.length - 1]!,
      );

      expect(typeof step.action).toBe("string");
      expect(typeof step.reason).toBe("string");
      expect(typeof step.encouragement).toBe("string");
      expect(step.reason.length).toBeGreaterThan(0);
      expect(step.encouragement.length).toBeGreaterThan(0);
      expect(typeof step.sourceSignals).toBe("object");
    }
  });
});

describe("Integration: Parent dashboard aggregation output shape", () => {

  it("produces complete dashboard from minimal student data", () => {
    const data = {
      userId: "test", name: "Test", grade: "G4",
      profile: { totalXp: 100, currentLevel: 2, confidenceLevel: 50, learningPace: "standard",
        totalHintsUsed: 10, totalQuestionsAttempted: 50, avgConfidenceScore: 55 },
      streak: { currentStreak: 3, longestStreak: 7 },
      topicProgress: [
        { topicId: "g4-add", masteryScore: 0.8, accuracyRate: 0.85, completionPercent: 1.0, isMastered: true, lastPracticedAt: new Date() },
        { topicId: "g4-sub", masteryScore: 0.3, accuracyRate: 0.4, completionPercent: 0.3, isMastered: false, lastPracticedAt: new Date(Date.now() - 5 * 86400000) },
      ],
      memorySnapshot: undefined,
      recentBadges: [{ name: "First Badge", earnedAt: new Date().toISOString() }],
    };

    const score = computeLearningScore(data);
    const status = computeLearningStatus(score);
    const conf = computeConfidenceSignal(data);
    const confExpl = computeConfidenceExplanation(data);
    const support = computeSupportNeed(data);
    const personality = computeLearningPersonality(data);
    const basis = computeInsightBasis(data);
    const insights = generateInsights(data);
    const masteryMap = buildMasteryMap(data, new Map());
    const clusters = buildMasteryClusters(masteryMap);
    const highlights = buildRecentHighlights(data);

    // Score shape
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(["excellent", "on_track", "needs_attention"]).toContain(status);

    // Confidence
    expect(["rising", "stable", "needs_support"]).toContain(conf);
    expect(confExpl.length).toBeGreaterThan(0);

    // Support
    expect(["low", "moderate", "high"]).toContain(support);

    // Personality
    expect(personality.length).toBeLessThanOrEqual(4);
    for (const t of personality) {
      expect(t.icon.length).toBeGreaterThan(0);
      expect(t.label.length).toBeGreaterThan(0);
    }

    // Insights
    expect(insights.length).toBeLessThanOrEqual(6);

    // Mastery clusters
    expect(clusters.strong.length).toBe(1);
    expect(clusters.weakAreas.length).toBe(1);
    expect(typeof clusters.notStarted).toBe("number");

    // Basis
    expect(basis).toContain("50");

    // Highlights
    expect(Array.isArray(highlights)).toBe(true);
  });

  it("handles empty student data gracefully", () => {
    const data = {
      userId: "empty", name: "New Student", grade: "G4",
      profile: { totalXp: 0, currentLevel: 1, confidenceLevel: 50, learningPace: "standard",
        totalHintsUsed: 0, totalQuestionsAttempted: 0, avgConfidenceScore: 50 },
      streak: { currentStreak: 0, longestStreak: 0 },
      topicProgress: [],
      memorySnapshot: undefined,
      recentBadges: [],
    };

    const score = computeLearningScore(data);
    expect(score.mastery).toBe(0);
    expect(score.effort).toBe(0);

    const insights = generateInsights(data);
    expect(Array.isArray(insights)).toBe(true);

    const clusters = buildMasteryClusters(buildMasteryMap(data, new Map()));
    expect(clusters.notStarted).toBe(0);
  });
});

describe("Integration: Visual engine fallback when mathData is invalid", () => {

  it("produces valid plan from regex when mathData has wrong type", () => {
    const invalidMathData: MathData = { type: "multiplication" as any, values: [] };
    const result = getVisualExplanationSync("What is 1/4 + 2/3?", invalidMathData);

    // Should fall back to regex-based fraction detection
    expect(result.plan).not.toBeNull();
    expect(result.plan!.diagramType).toBe("fraction_bar");
  });

  it("alignment verifier catches severe mathData/explanation mismatch", () => {
    // 2+ issues: wrong result (199 not in text) + wrong values (777,888 not in question or text)
    const explanation = "The answer equals forty-two.";
    const badMathData: MathData = {
      type: "addition", values: [777, 888], result: 199,
      fractions: [{ numerator: 99, denominator: 13 }],
    };

    const check = verifyAlignment(explanation, "What is the total?", badMathData, null);

    expect(check.issues.length).toBeGreaterThanOrEqual(2);
    expect(check.fallbackRecommended).toBe(true);
    expect(check.isAligned).toBe(false);
  });

  it("produces no visual for conceptual question without forcing", () => {
    const result = getVisualExplanationSync("What is a prime number?");
    // Should be worked_steps_only → null plan
    expect(result.intent.visualType).toBe("worked_steps_only");
    expect(result.plan).toBeNull();
  });
});

describe("Integration: Learning Brain → Adaptation → Difficulty consistency", () => {

  it("brain weak-area recommendation flows into correct session adaptation", () => {
    // Step 1: Brain recommends remediation for weak topic
    const signals = extractSignals(
      [{ topicId: "g4-fractions", masteryScore: 0.2, accuracyRate: 0.3, lastPracticedAt: new Date(),
         isUnlocked: true, isMastered: false, completionPercent: 0.3 }],
      new Map([["g4-fractions", "Fractions"]]),
      {
        version: 1, lessonsStarted: [], lessonsCompleted: [], topicsAttempted: ["g4-fractions"],
        strongTopics: [], weakTopics: [{ topicId: "g4-fractions", topicName: "Fractions",
          masteryScore: 0.2, accuracyRate: 0.3, lastAttempt: null, activeMisconceptions: ["fraction-add"] }],
        activeMistakePatterns: [{ topicId: "g4-fractions", topicName: "Fractions", tag: "fraction-add", count: 5, lastSeenAt: new Date().toISOString() }],
        hintDependencyByTopic: {}, confidenceTrend: "falling", avgConfidenceScore: 30,
        preferredExplanationStyle: "step_by_step", learningPace: "standard", interests: [],
        recentSessions: [], suggestedFocusTopics: ["g4-fractions"], lastRefreshedAt: new Date().toISOString(),
      },
    );

    const brainAction = decideLearningAction(signals);
    expect(brainAction).not.toBeNull();
    expect(brainAction!.type).toBe("review_mistake");
    expect(brainAction!.difficulty).toBe("easy");

    // Step 2: Student starts session and immediately struggles
    const sessionResponses = [
      makeSessionResponse({ isCorrect: false, questionId: "q-1" }),
      makeSessionResponse({ isCorrect: false, questionId: "q-2" }),
    ];

    const adaptation = decideSessionNextStep(
      { topicId: "g4-fractions", totalQuestions: 3, currentIndex: 2,
        responses: sessionResponses, sessionComplete: false },
      sessionResponses[1]!,
    );

    // Adaptation should also recommend easier path
    expect(adaptation.action).toBe("easier_question");
    expect(adaptation.difficulty).toBe("easy");

    // Step 3: Difficulty manager should resolve to easy
    const pool = createDifficultyState(
      [makePoolQuestion("med-1")],
      "medium",
    );
    const target = resolveNextDifficulty(pool, adaptation.action);
    expect(target).toBe("easy");
  });
});
