/**
 * @test api/services/learningBrain
 *
 * Unit tests for the Learning Brain Engine's decision logic.
 *
 * Strategy: The scorer is a pure function — it takes ExtractedSignals and
 * returns a LearningNextAction. No DB, no network, no mocks needed.
 * We test the scoring and decision logic directly.
 *
 * Scenarios tested:
 *   1. Repeated failure on one topic → remediation decision
 *   2. Low confidence + hint dependency → guided easy practice
 *   3. Revision due on previously strong topic → revise decision
 *   4. Strong recent performance → challenge or continue_path
 *   5. Fast but inaccurate pattern → guided corrective recommendation
 *   6. Slow but accurate pattern → do not punish unnecessarily
 *   7. Brand-new student with no topics → returns null
 *   8. Improving student → continue_path with encouragement
 *   9. Severe misconception gets priority over challenge
 */

// ── Re-implement types inline so tests don't need ts-node path resolution ────

interface TopicSignal {
  topicId:              string;
  topicName:            string;
  masteryScore:         number;
  accuracyRate:         number;
  daysSinceLastPractice: number;
  isWeak:               boolean;
  isStrong:             boolean;
  isNewTopic:           boolean;
  activeMisconceptions: string[];
  hintDependency:       number;
  recentAccuracy:       number | null;
  recentErrorCount:     number;
  isImproving:          boolean;
}

interface StudentSignals {
  confidenceTrend:       "rising" | "stable" | "falling";
  avgConfidence:         number;
  learningPace:         string;
  explanationStyle:     string;
  overallHintDependency: number;
  totalTopicsAttempted: number;
  totalLessonsCompleted: number;
  hasSevereMisconception: boolean;
  interests:            string[];
  fastButInaccurate:    boolean;
  slowButAccurate:      boolean;
}

interface ExtractedSignals {
  topics:  TopicSignal[];
  student: StudentSignals;
}

// ── Import the scorer ────────────────────────────────────────────────────────

// We import the module directly. The scorer has no DB dependencies.
import { decideLearningAction } from "../../api/services/learningBrain/scorer";

// ── Test helpers ─────────────────────────────────────────────────────────────

function makeStudent(overrides: Partial<StudentSignals> = {}): StudentSignals {
  return {
    confidenceTrend:       "stable",
    avgConfidence:         50,
    learningPace:          "standard",
    explanationStyle:      "step_by_step",
    overallHintDependency: 0.5,
    totalTopicsAttempted:  5,
    totalLessonsCompleted: 3,
    hasSevereMisconception: false,
    interests:             [],
    fastButInaccurate:     false,
    slowButAccurate:       false,
    ...overrides,
  };
}

function makeTopic(overrides: Partial<TopicSignal> = {}): TopicSignal {
  return {
    topicId:               "g4-fractions-add",
    topicName:             "Adding Fractions",
    masteryScore:          0.4,
    accuracyRate:          55,
    daysSinceLastPractice: 2,
    isWeak:                false,
    isStrong:              false,
    isNewTopic:            false,
    activeMisconceptions:  [],
    hintDependency:        0.3,
    recentAccuracy:        null,
    recentErrorCount:      0,
    isImproving:           false,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Learning Brain — decideLearningAction", () => {

  // ── Scenario 1: Repeated failure → remediation ──────────────────────────

  describe("repeated failure on one topic", () => {
    it("returns review_mistake with easy difficulty", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({ avgConfidence: 35 }),
        topics: [
          makeTopic({
            topicId:              "g4-fractions-divide",
            topicName:            "Dividing Fractions",
            masteryScore:         0.2,
            accuracyRate:         30,
            isWeak:               true,
            activeMisconceptions: ["fraction-inversion", "wrong-operation"],
            recentErrorCount:     5,
          }),
          makeTopic({
            topicId:       "g4-addition",
            topicName:     "Addition",
            masteryScore:  0.8,
            isStrong:      true,
          }),
        ],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      expect(action!.type).toBe("review_mistake");
      expect(action!.topicId).toBe("g4-fractions-divide");
      expect(action!.difficulty).toBe("easy");
      expect(action!.sessionMode).toBe("guided");
      expect(action!.sourceSignals.recentErrors).toBe(true);
      expect(action!.sourceSignals.weakArea).toBe(true);
    });
  });

  // ── Scenario 2: Low confidence + hint dependency ────────────────────────

  describe("low confidence + hint dependency", () => {
    it("returns guided easy practice", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({
          avgConfidence:         30,
          overallHintDependency: 1.5,
          confidenceTrend:       "falling",
        }),
        topics: [
          makeTopic({
            topicId:        "g4-place-value",
            topicName:      "Place Value",
            masteryScore:   0.35,
            accuracyRate:   40,
            isWeak:         true,
            hintDependency: 1.8,
          }),
        ],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      expect(action!.difficulty).toBe("easy");
      expect(action!.sessionMode).toBe("guided");
      expect(action!.sourceSignals.lowConfidence).toBe(true);
      expect(action!.sourceSignals.hintDependency).toBe(true);
    });
  });

  // ── Scenario 3: Revision due on previously strong topic ─────────────────

  describe("revision due on a previously mastered topic", () => {
    it("returns revise with medium difficulty", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({ avgConfidence: 70 }),
        topics: [
          makeTopic({
            topicId:               "g4-multiplication",
            topicName:             "Multiplication",
            masteryScore:          0.85,
            accuracyRate:          90,
            isStrong:              true,
            daysSinceLastPractice: 14,
          }),
        ],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      expect(action!.type).toBe("revise");
      expect(action!.sessionMode).toBe("revision");
      expect(action!.sourceSignals.revisionDue).toBe(true);
      expect(action!.sourceSignals.neglectedTopic).toBe(true);
    });
  });

  // ── Scenario 4: Strong recent performance → challenge/continue ──────────

  describe("strong recent performance", () => {
    it("returns challenge for a strong student", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({ avgConfidence: 80 }),
        topics: [
          makeTopic({
            topicId:      "g4-geometry",
            topicName:    "Geometry Basics",
            masteryScore: 0.9,
            accuracyRate: 92,
            isStrong:     true,
            daysSinceLastPractice: 2,
          }),
        ],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      expect(action!.type).toBe("challenge");
      expect(action!.difficulty).toBe("hard");
      expect(action!.sessionMode).toBe("challenge");
    });
  });

  // ── Scenario 5: Fast but inaccurate → corrective guided ─────────────────

  describe("fast but inaccurate pattern", () => {
    it("returns guided practice with easy difficulty", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({
          fastButInaccurate: true,
          avgConfidence:     45,
        }),
        topics: [
          makeTopic({
            topicId:      "g4-subtraction",
            topicName:    "Subtraction",
            masteryScore: 0.45,
            accuracyRate: 40,
            isWeak:       true,
          }),
        ],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      expect(action!.difficulty).toBe("easy");
      expect(action!.sessionMode).toBe("guided");
      expect(action!.sourceSignals.fastButInaccurate).toBe(true);
      // Reason should mention slowing down
      expect(action!.reason.toLowerCase()).toContain("slow");
    });
  });

  // ── Scenario 6: Slow but accurate → don't punish ───────────────────────

  describe("slow but accurate student", () => {
    it("does not reduce difficulty or recommend remediation", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({
          slowButAccurate: true,
          avgConfidence:   65,
        }),
        topics: [
          makeTopic({
            topicId:       "g4-fractions-compare",
            topicName:     "Comparing Fractions",
            masteryScore:  0.78,
            accuracyRate:  85,
            isStrong:      true,
            daysSinceLastPractice: 3,
          }),
        ],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      // Should NOT be review_mistake or easy remediation
      expect(action!.type).not.toBe("review_mistake");
      expect(action!.difficulty).not.toBe("easy");
      expect(action!.sourceSignals.slowButAccurate).toBe(true);
    });
  });

  // ── Scenario 7: Empty topics → null ─────────────────────────────────────

  describe("brand-new student with no topics", () => {
    it("returns null", () => {
      const signals: ExtractedSignals = {
        student: makeStudent(),
        topics:  [],
      };

      const action = decideLearningAction(signals);
      expect(action).toBeNull();
    });
  });

  // ── Scenario 8: Improving student → continue_path ───────────────────────

  describe("improving student on a developing topic", () => {
    it("returns continue_path recognising progress", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({ avgConfidence: 55, confidenceTrend: "rising" }),
        topics: [
          makeTopic({
            topicId:       "g4-decimals",
            topicName:     "Decimals",
            masteryScore:  0.65,
            accuracyRate:  72,
            isImproving:   true,
            daysSinceLastPractice: 1,
          }),
        ],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      expect(action!.type).toBe("continue_path");
      expect(action!.sourceSignals.masteryReady).toBe(true);
      expect(action!.reason.toLowerCase()).toContain("progress");
    });
  });

  // ── Scenario 9: Severe misconception blocks challenge ───────────────────

  describe("severe misconception present alongside strong topic", () => {
    it("prioritises misconception remediation over challenge", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({
          hasSevereMisconception: true,
          avgConfidence:          55,
        }),
        topics: [
          // Strong topic that would normally be "challenge"
          makeTopic({
            topicId:       "g4-geometry",
            topicName:     "Geometry",
            masteryScore:  0.9,
            accuracyRate:  95,
            isStrong:      true,
            daysSinceLastPractice: 2,
          }),
          // Weak topic with severe misconception
          makeTopic({
            topicId:              "g4-fractions-equiv",
            topicName:            "Equivalent Fractions",
            masteryScore:         0.3,
            accuracyRate:         35,
            isWeak:               true,
            activeMisconceptions: ["fraction-comparison"],
            recentErrorCount:     6,
          }),
        ],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      // Should pick the misconception topic, not the challenge
      expect(action!.topicId).toBe("g4-fractions-equiv");
      expect(action!.type).toBe("review_mistake");
    });
  });

  // ── Output shape validation ─────────────────────────────────────────────

  describe("output shape", () => {
    it("returns all required fields with correct types", () => {
      const signals: ExtractedSignals = {
        student: makeStudent(),
        topics:  [makeTopic()],
      };

      const action = decideLearningAction(signals);

      expect(action).not.toBeNull();
      expect(typeof action!.type).toBe("string");
      expect(typeof action!.topicId).toBe("string");
      expect(typeof action!.topicName).toBe("string");
      expect(typeof action!.difficulty).toBe("string");
      expect(typeof action!.reason).toBe("string");
      expect(typeof action!.encouragement).toBe("string");
      expect(typeof action!.sessionMode).toBe("string");
      expect(typeof action!.recommendedQuestionCount).toBe("number");
      expect(typeof action!.explanationPreference).toBe("string");
      expect(typeof action!.sourceSignals).toBe("object");
      expect(action!.recommendedQuestionCount).toBeGreaterThan(0);
      expect(action!.recommendedQuestionCount).toBeLessThanOrEqual(6);
    });

    it("difficulty is one of the allowed values", () => {
      const signals: ExtractedSignals = {
        student: makeStudent(),
        topics:  [makeTopic()],
      };

      const action = decideLearningAction(signals);
      expect(["easy", "medium", "hard", "adaptive"]).toContain(action!.difficulty);
    });

    it("sessionMode is one of the allowed values", () => {
      const signals: ExtractedSignals = {
        student: makeStudent(),
        topics:  [makeTopic()],
      };

      const action = decideLearningAction(signals);
      expect(["focus", "revision", "challenge", "guided"]).toContain(action!.sessionMode);
    });
  });

  // ── Question count adapts to learning pace ──────────────────────────────

  describe("question count adapts to pace", () => {
    it("slow pace → fewer questions", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({ learningPace: "slow" }),
        topics:  [makeTopic()],
      };

      const action = decideLearningAction(signals);
      expect(action!.recommendedQuestionCount).toBeLessThanOrEqual(4);
    });

    it("fast pace → more questions", () => {
      const signals: ExtractedSignals = {
        student: makeStudent({ learningPace: "fast" }),
        topics:  [makeTopic()],
      };

      const action = decideLearningAction(signals);
      expect(action!.recommendedQuestionCount).toBeGreaterThanOrEqual(5);
    });
  });
});
