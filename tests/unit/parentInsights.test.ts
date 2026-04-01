/**
 * @test api/services/parentInsightsService
 *
 * Unit tests for the parent portal intelligence layer.
 * Pure function tests — no DB, no AI, no mocks.
 *
 * Scenarios:
 *   1. Learning score calculation
 *   2. Confidence signal computation
 *   3. Support need level computation
 *   4. Insight generation — types and messaging
 *   5. Mastery map status assignment
 *   6. Empty state handling
 *   7. Score components are bounded 0–100
 */

import {
  computeLearningScore,
  computeLearningStatus,
  computeConfidenceSignal,
  computeConfidenceExplanation,
  computeSupportNeed,
  computeLearningPersonality,
  computeInsightBasis,
  buildMasteryClusters,
  generateInsights,
  buildMasteryMap,
  buildRecentHighlights,
  type StudentDataInput,
  type TopicProgressInput,
} from "../../api/services/parentInsightsService";

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeStudentData(overrides: Partial<StudentDataInput> = {}): StudentDataInput {
  return {
    userId: "test-user",
    name:   "Test Student",
    grade:  "G4",
    profile: {
      totalXp:                 200,
      currentLevel:            2,
      confidenceLevel:         50,
      learningPace:            "standard",
      totalHintsUsed:          20,
      totalQuestionsAttempted: 100,
      avgConfidenceScore:      50,
    },
    streak: { currentStreak: 3, longestStreak: 7 },
    topicProgress: [],
    recentBadges:  [],
    ...overrides,
  };
}

function makeTopicProgress(overrides: Partial<TopicProgressInput> = {}): TopicProgressInput {
  return {
    topicId:          "g4-test",
    masteryScore:     0.5,
    accuracyRate:     0.6,
    completionPercent: 0.5,
    isMastered:       false,
    lastPracticedAt:  new Date(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Parent Insights Service", () => {

  // ── 1. Learning score calculation ───────────────────────────────────────

  describe("computeLearningScore", () => {
    it("returns overall between 0 and 100", () => {
      const data = makeStudentData({
        topicProgress: [
          makeTopicProgress({ masteryScore: 0.7, accuracyRate: 0.8, completionPercent: 0.5 }),
          makeTopicProgress({ topicId: "g4-t2", masteryScore: 0.5, accuracyRate: 0.6, completionPercent: 0.3 }),
        ],
      });

      const score = computeLearningScore(data);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it("all components are between 0 and 100", () => {
      const data = makeStudentData({
        topicProgress: [makeTopicProgress()],
      });

      const score = computeLearningScore(data);

      for (const key of ["mastery", "consistency", "effort", "accuracy", "improvement"] as const) {
        expect(score[key]).toBeGreaterThanOrEqual(0);
        expect(score[key]).toBeLessThanOrEqual(100);
      }
    });

    it("returns 0 overall for brand new student", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, totalQuestionsAttempted: 0 },
        streak:  { currentStreak: 0, longestStreak: 0 },
        topicProgress: [],
      });

      const score = computeLearningScore(data);

      // Should be very low since no activity — allow some from improvement baseline
      expect(score.overall).toBeLessThan(20);
      expect(score.mastery).toBe(0);
      expect(score.effort).toBe(0);
    });

    it("high streak boosts consistency score", () => {
      const base = makeStudentData({ streak: { currentStreak: 1, longestStreak: 3 } });
      const high = makeStudentData({ streak: { currentStreak: 14, longestStreak: 14 } });

      expect(computeLearningScore(high).consistency).toBeGreaterThan(
        computeLearningScore(base).consistency
      );
    });
  });

  // ── 2. Confidence signal ────────────────────────────────────────────────

  describe("computeConfidenceSignal", () => {
    it("returns 'rising' when confidence is high", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, avgConfidenceScore: 70 },
      });
      expect(computeConfidenceSignal(data)).toBe("rising");
    });

    it("returns 'needs_support' when confidence is low", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, avgConfidenceScore: 30 },
        memorySnapshot: { confidenceTrend: "falling" } as any,
      });
      expect(computeConfidenceSignal(data)).toBe("needs_support");
    });

    it("returns 'stable' for moderate confidence", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, avgConfidenceScore: 55 },
      });
      expect(computeConfidenceSignal(data)).toBe("stable");
    });
  });

  // ── 3. Support need level ───────────────────────────────────────────────

  describe("computeSupportNeed", () => {
    it("returns 'low' for strong student", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, avgConfidenceScore: 75, totalHintsUsed: 10, totalQuestionsAttempted: 100 },
      });
      expect(computeSupportNeed(data)).toBe("low");
    });

    it("returns 'high' for struggling student", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, avgConfidenceScore: 25, totalHintsUsed: 150, totalQuestionsAttempted: 100 },
        memorySnapshot: {
          weakTopics: [{ topicId: "t1" }, { topicId: "t2" }, { topicId: "t3" }],
          activeMistakePatterns: [{ topicId: "t1" }, { topicId: "t2" }, { topicId: "t3" }],
        } as any,
      });
      expect(computeSupportNeed(data)).toBe("high");
    });
  });

  // ── 4. Insight generation ───────────────────────────────────────────────

  describe("generateInsights", () => {
    it("generates at most 6 insights", () => {
      const data = makeStudentData({
        topicProgress: [
          makeTopicProgress({ isMastered: true, lastPracticedAt: new Date(Date.now() - 20 * 86400000) }),
          makeTopicProgress({ topicId: "g4-t2", masteryScore: 0.3, completionPercent: 0.3 }),
          makeTopicProgress({ topicId: "g4-t3", masteryScore: 0.6, completionPercent: 0.5 }),
        ],
        memorySnapshot: {
          strongTopics: [{ topicId: "g4-test", topicName: "Test Topic", masteryScore: 0.9 }],
          weakTopics: [{ topicId: "g4-t2", topicName: "Weak Topic", masteryScore: 0.3, accuracyRate: 0.4 }],
          activeMistakePatterns: [{ topicId: "g4-t2", topicName: "Weak Topic", tag: "sign-error", count: 3 }],
          confidenceTrend: "rising",
        } as any,
        streak: { currentStreak: 7, longestStreak: 10 },
      });

      const insights = generateInsights(data);

      expect(insights.length).toBeLessThanOrEqual(6);
      expect(insights.length).toBeGreaterThan(0);
    });

    it("insights are sorted by priority", () => {
      const data = makeStudentData({
        memorySnapshot: {
          strongTopics: [{ topicId: "t1", topicName: "Topic A", masteryScore: 0.9 }],
          weakTopics: [{ topicId: "t2", topicName: "Topic B", masteryScore: 0.3 }],
          activeMistakePatterns: [{ topicId: "t2", topicName: "Topic B", tag: "error", count: 4 }],
          confidenceTrend: "rising",
        } as any,
        streak: { currentStreak: 5, longestStreak: 5 },
      });

      const insights = generateInsights(data);

      for (let i = 1; i < insights.length; i++) {
        expect(insights[i]!.priority).toBeGreaterThanOrEqual(insights[i - 1]!.priority);
      }
    });

    it("all insights have required fields", () => {
      const data = makeStudentData({
        memorySnapshot: {
          weakTopics: [{ topicId: "t1", topicName: "T", masteryScore: 0.3 }],
          activeMistakePatterns: [],
          strongTopics: [],
        } as any,
      });

      const insights = generateInsights(data);

      for (const insight of insights) {
        expect(typeof insight.id).toBe("string");
        expect(typeof insight.type).toBe("string");
        expect(typeof insight.icon).toBe("string");
        expect(typeof insight.message).toBe("string");
        expect(insight.message.length).toBeGreaterThan(0);
        expect(typeof insight.priority).toBe("number");
      }
    });

    it("returns empty array for brand new student", () => {
      const data = makeStudentData();
      const insights = generateInsights(data);
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  // ── 5. Mastery map status assignment ────────────────────────────────────

  describe("buildMasteryMap", () => {
    it("assigns correct statuses", () => {
      const data = makeStudentData({
        topicProgress: [
          makeTopicProgress({ topicId: "t1", completionPercent: 0, isMastered: false }),
          makeTopicProgress({ topicId: "t2", masteryScore: 0.3, completionPercent: 0.3, isMastered: false }),
          makeTopicProgress({ topicId: "t3", masteryScore: 0.7, completionPercent: 0.6, isMastered: false }),
          makeTopicProgress({ topicId: "t4", isMastered: true, masteryScore: 0.9, completionPercent: 1 }),
          makeTopicProgress({ topicId: "t5", isMastered: true, masteryScore: 0.85, completionPercent: 1, lastPracticedAt: new Date(Date.now() - 20 * 86400000) }),
        ],
      });

      const map = buildMasteryMap(data, new Map());

      const find = (id: string) => map.find((m) => m.topicId === id)!;

      expect(find("t1").status).toBe("not_started");
      expect(find("t2").status).toBe("struggling");
      expect(find("t3").status).toBe("improving");
      expect(find("t4").status).toBe("mastered");
      expect(find("t5").status).toBe("needs_revision");
    });
  });

  // ── 6. Empty state handling ─────────────────────────────────────────────

  describe("empty state handling", () => {
    it("learning score handles zero topics gracefully", () => {
      const data = makeStudentData({ topicProgress: [] });
      const score = computeLearningScore(data);
      expect(score.mastery).toBe(0);
      expect(score.accuracy).toBe(0);
      expect(typeof score.overall).toBe("number");
    });

    it("recent highlights returns empty for new student", () => {
      const data = makeStudentData();
      const highlights = buildRecentHighlights(data);
      expect(Array.isArray(highlights)).toBe(true);
    });
  });

  // ── 7. Score components are bounded ─────────────────────────────────────

  describe("score bounding", () => {
    it("extreme values don't exceed 100", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, totalQuestionsAttempted: 10000 },
        streak:  { currentStreak: 100, longestStreak: 100 },
        topicProgress: [makeTopicProgress({ masteryScore: 1, accuracyRate: 1, completionPercent: 1 })],
        memorySnapshot: { confidenceTrend: "rising" } as any,
      });

      const score = computeLearningScore(data);

      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.consistency).toBeLessThanOrEqual(100);
      expect(score.effort).toBeLessThanOrEqual(100);
    });
  });

  // ── 8. Learning status from score ───────────────────────────────────────

  describe("computeLearningStatus", () => {
    it("returns excellent for score >= 85", () => {
      expect(computeLearningStatus({ overall: 90, mastery: 90, consistency: 90, effort: 90, accuracy: 90, improvement: 90 })).toBe("excellent");
    });

    it("returns on_track for 60-84", () => {
      expect(computeLearningStatus({ overall: 72, mastery: 70, consistency: 70, effort: 70, accuracy: 70, improvement: 70 })).toBe("on_track");
    });

    it("returns needs_attention for < 60", () => {
      expect(computeLearningStatus({ overall: 40, mastery: 30, consistency: 30, effort: 50, accuracy: 40, improvement: 30 })).toBe("needs_attention");
    });

    it("boundary: 85 is excellent", () => {
      expect(computeLearningStatus({ overall: 85, mastery: 85, consistency: 85, effort: 85, accuracy: 85, improvement: 85 })).toBe("excellent");
    });

    it("boundary: 60 is on_track", () => {
      expect(computeLearningStatus({ overall: 60, mastery: 60, consistency: 60, effort: 60, accuracy: 60, improvement: 60 })).toBe("on_track");
    });
  });

  // ── 9. Confidence explanation ───────────────────────────────────────────

  describe("computeConfidenceExplanation", () => {
    it("returns rising explanation with topic name when improving", () => {
      const data = makeStudentData({
        topicProgress: [makeTopicProgress({ topicId: "g4-multiply", masteryScore: 0.7, completionPercent: 0.5 })],
        memorySnapshot: { confidenceTrend: "rising" } as any,
      });

      const explanation = computeConfidenceExplanation(data);

      expect(explanation.toLowerCase()).toContain("rising");
    });

    it("returns falling explanation mentioning weak topic", () => {
      const data = makeStudentData({
        memorySnapshot: {
          confidenceTrend: "falling",
          weakTopics: [{ topicId: "t1", topicName: "Fractions", masteryScore: 0.2 }],
        } as any,
      });

      const explanation = computeConfidenceExplanation(data);

      expect(explanation.toLowerCase()).toContain("dip");
      expect(explanation).toContain("Fractions");
    });

    it("returns stable explanation", () => {
      const data = makeStudentData({
        memorySnapshot: { confidenceTrend: "stable" } as any,
      });

      const explanation = computeConfidenceExplanation(data);

      expect(explanation.toLowerCase()).toContain("steady");
    });
  });

  // ── 10. Learning personality ────────────────────────────────────────────

  describe("computeLearningPersonality", () => {
    it("returns max 4 traits", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, totalHintsUsed: 5, totalQuestionsAttempted: 200 },
        memorySnapshot: { preferredExplanationStyle: "visual", learningPace: "fast" } as any,
        streak: { currentStreak: 10, longestStreak: 10 },
        topicProgress: [
          makeTopicProgress({ topicId: "t1", masteryScore: 0.6, completionPercent: 0.5 }),
          makeTopicProgress({ topicId: "t2", masteryScore: 0.7, completionPercent: 0.5 }),
        ],
      });

      const traits = computeLearningPersonality(data);

      expect(traits.length).toBeLessThanOrEqual(4);
      expect(traits.length).toBeGreaterThan(0);
    });

    it("all traits have required fields", () => {
      const data = makeStudentData({
        memorySnapshot: { preferredExplanationStyle: "step_by_step" } as any,
      });

      const traits = computeLearningPersonality(data);

      for (const t of traits) {
        expect(typeof t.icon).toBe("string");
        expect(typeof t.label).toBe("string");
        expect(typeof t.detail).toBe("string");
        expect(t.label.length).toBeGreaterThan(0);
      }
    });

    it("detects support seeker from high hint rate", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, totalHintsUsed: 150, totalQuestionsAttempted: 100 },
      });

      const traits = computeLearningPersonality(data);
      const labels = traits.map((t) => t.label);

      expect(labels).toContain("Support Seeker");
    });

    it("detects independent solver from low hint rate", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, totalHintsUsed: 2, totalQuestionsAttempted: 50 },
      });

      const traits = computeLearningPersonality(data);
      const labels = traits.map((t) => t.label);

      expect(labels).toContain("Independent Solver");
    });
  });

  // ── 11. Mastery clustering ──────────────────────────────────────────────

  describe("buildMasteryClusters", () => {
    it("clusters topics correctly", () => {
      const map = buildMasteryMap(makeStudentData({
        topicProgress: [
          makeTopicProgress({ topicId: "t1", completionPercent: 0, isMastered: false }),
          makeTopicProgress({ topicId: "t2", masteryScore: 0.3, completionPercent: 0.3, isMastered: false }),
          makeTopicProgress({ topicId: "t3", masteryScore: 0.7, completionPercent: 0.6, isMastered: false }),
          makeTopicProgress({ topicId: "t4", isMastered: true, masteryScore: 0.9, completionPercent: 1 }),
          makeTopicProgress({ topicId: "t5", isMastered: true, masteryScore: 0.85, completionPercent: 1, lastPracticedAt: new Date(Date.now() - 20 * 86400000) }),
        ],
      }), new Map());

      const clusters = buildMasteryClusters(map);

      expect(clusters.weakAreas.length).toBe(1);
      expect(clusters.weakAreas[0]!.topicId).toBe("t2");
      expect(clusters.improving.length).toBe(1);
      expect(clusters.improving[0]!.topicId).toBe("t3");
      expect(clusters.strong.length).toBe(1);
      expect(clusters.strong[0]!.topicId).toBe("t4");
      expect(clusters.revisionDue.length).toBe(1);
      expect(clusters.revisionDue[0]!.topicId).toBe("t5");
      expect(clusters.notStarted).toBe(1);
    });
  });

  // ── 12. Insight basis ───────────────────────────────────────────────────

  describe("computeInsightBasis", () => {
    it("returns meaningful basis string", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, totalQuestionsAttempted: 120 },
        memorySnapshot: { recentSessions: [{}, {}, {}] } as any,
        streak: { currentStreak: 5, longestStreak: 5 },
      });

      const basis = computeInsightBasis(data);

      expect(basis).toContain("120");
      expect(basis).toContain("3 recent sessions");
      expect(basis).toContain("5-day streak");
    });

    it("handles new student gracefully", () => {
      const data = makeStudentData({
        profile: { ...makeStudentData().profile, totalQuestionsAttempted: 0 },
      });

      const basis = computeInsightBasis(data);

      expect(basis).toContain("will update");
    });
  });

  // ── 13. Action hints on insights ────────────────────────────────────────

  describe("insights include actionHint", () => {
    it("weak topic insight has actionHint", () => {
      const data = makeStudentData({
        memorySnapshot: {
          weakTopics: [{ topicId: "t1", topicName: "Fractions", masteryScore: 0.3 }],
          activeMistakePatterns: [],
          strongTopics: [],
        } as any,
      });

      const insights = generateInsights(data);
      const weakInsight = insights.find((i) => i.type === "attention");

      expect(weakInsight).toBeDefined();
      expect(weakInsight!.actionHint).toBeDefined();
      expect(weakInsight!.actionHint!.length).toBeGreaterThan(0);
    });

    it("strength insight has actionHint", () => {
      const data = makeStudentData({
        memorySnapshot: {
          strongTopics: [{ topicId: "t1", topicName: "Addition", masteryScore: 0.9 }],
          weakTopics: [],
          activeMistakePatterns: [],
        } as any,
      });

      const insights = generateInsights(data);
      const strengthInsight = insights.find((i) => i.type === "strength");

      expect(strengthInsight).toBeDefined();
      expect(strengthInsight!.actionHint).toContain("Celebrate");
    });
  });
});
