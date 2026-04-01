/**
 * @test ai/services/visualExplanationEngine
 *
 * Unit tests for the Visual Explanation Engine's classifier and plan builder.
 * Pure function tests — no AI calls, no DB, no mocks.
 *
 * Scenarios:
 *   1. Correct visual selection by concept
 *   2. Fallback heuristic selection
 *   3. Plan validation
 *   4. Plan builder produces valid renderer data
 *   5. Phase 2 types fall back to worked_steps_only
 *   6. Graceful fallback for ambiguous questions
 *   7. Number extraction from question text
 *   8. Fraction extraction from question text
 */

import {
  classifyHeuristic,
  enforcePhase1,
} from "../../ai/services/visualExplanationEngine/classifier";

import {
  buildVisualPlan,
  isValidPlan,
} from "../../ai/services/visualExplanationEngine/planBuilder";

import {
  getVisualExplanationSync,
} from "../../ai/services/visualExplanationEngine";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Visual Explanation Engine", () => {

  // ── 1. Correct visual selection by concept ──────────────────────────────

  describe("heuristic classifier — concept matching", () => {
    it("fractions → fraction_bar", () => {
      expect(classifyHeuristic("What is 1/4 + 2/3?").visualType).toBe("fraction_bar");
      expect(classifyHeuristic("Show me equivalent fractions").visualType).toBe("fraction_bar");
      expect(classifyHeuristic("How do numerators work?").visualType).toBe("fraction_bar");
    });

    it("addition/subtraction → number_line", () => {
      expect(classifyHeuristic("What is 8 + 5?").visualType).toBe("number_line");
      expect(classifyHeuristic("Show subtraction on a number line").visualType).toBe("number_line");
      expect(classifyHeuristic("What are negative numbers?").visualType).toBe("number_line");
    });

    it("multiplication → array_model", () => {
      expect(classifyHeuristic("What is 3 × 4?").visualType).toBe("array_model");
      expect(classifyHeuristic("Show multiplication as groups").visualType).toBe("array_model");
      expect(classifyHeuristic("times table for 6").visualType).toBe("array_model");
    });

    it("division → array_model", () => {
      expect(classifyHeuristic("What is 12 ÷ 3?").visualType).toBe("array_model");
      expect(classifyHeuristic("sharing 20 equally among 4").visualType).toBe("array_model");
    });

    it("place value → place_value", () => {
      expect(classifyHeuristic("What is the place value of 3 in 345?").visualType).toBe("place_value");
      expect(classifyHeuristic("Explain regrouping").visualType).toBe("place_value");
      expect(classifyHeuristic("tens and ones in 42").visualType).toBe("place_value");
    });

    it("word problems → bar_model", () => {
      expect(classifyHeuristic("How many more apples does Sam have than Tom?").visualType).toBe("bar_model");
      expect(classifyHeuristic("What is the total of 15 and 23?").visualType).toBe("bar_model");
    });

    it("algebra/equations → equation_steps", () => {
      expect(classifyHeuristic("Solve x + 3 = 10").visualType).toBe("equation_steps");
      expect(classifyHeuristic("How do I balance an equation?").visualType).toBe("equation_steps");
    });
  });

  // ── 2. Fallback for ambiguous/no-match questions ────────────────────────

  describe("fallback to worked_steps_only", () => {
    it("returns worked_steps_only for non-visual questions", () => {
      expect(classifyHeuristic("What is pi?").visualType).toBe("worked_steps_only");
      expect(classifyHeuristic("Define a prime number").visualType).toBe("worked_steps_only");
    });

    it("returns confidence 0.5 for fallback", () => {
      const intent = classifyHeuristic("What is math?");
      expect(intent.confidence).toBe(0.5);
    });
  });

  // ── 3. Phase 1 enforcement ──────────────────────────────────────────────

  describe("Phase 1 enforcement", () => {
    it("passes Phase 1 types through unchanged", () => {
      const intent = classifyHeuristic("What is 3/4?");
      expect(enforcePhase1(intent).visualType).toBe("fraction_bar");
    });

    it("downgrades geometry_sketch to worked_steps_only", () => {
      const intent = { ...classifyHeuristic("triangle"), visualType: "geometry_sketch" as const };
      expect(enforcePhase1(intent).visualType).toBe("worked_steps_only");
    });

    it("downgrades logic_flow to worked_steps_only", () => {
      const intent = { ...classifyHeuristic("x"), visualType: "logic_flow" as const };
      expect(enforcePhase1(intent).visualType).toBe("worked_steps_only");
    });

    it("downgrades comparison_model to worked_steps_only", () => {
      const intent = { ...classifyHeuristic("x"), visualType: "comparison_model" as const };
      expect(enforcePhase1(intent).visualType).toBe("worked_steps_only");
    });
  });

  // ── 4. Plan builder produces valid data ─────────────────────────────────

  describe("plan builder — valid renderer data", () => {
    it("builds valid number_line plan with extracted numbers", () => {
      const intent = classifyHeuristic("What is 3 + 5?");
      const plan = buildVisualPlan(intent, "What is 3 + 5?");

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("number_line");
      expect(isValidPlan(plan)).toBe(true);

      const data = plan!.data as any;
      expect(typeof data.min).toBe("number");
      expect(typeof data.max).toBe("number");
      expect(data.max).toBeGreaterThan(data.min);
    });

    it("builds valid fraction_bar plan with extracted fractions", () => {
      const intent = classifyHeuristic("What is 1/4 + 2/3?");
      const plan = buildVisualPlan(intent, "What is 1/4 + 2/3?");

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("fraction_bar");
      expect(isValidPlan(plan)).toBe(true);

      const data = plan!.data as any;
      expect(data.fractions.length).toBe(2);
      expect(data.fractions[0].numerator).toBe(1);
      expect(data.fractions[0].denominator).toBe(4);
    });

    it("builds valid array plan for multiplication", () => {
      const intent = classifyHeuristic("What is 3 × 4?");
      const plan = buildVisualPlan(intent, "What is 3 × 4?");

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("array");
      expect(isValidPlan(plan)).toBe(true);

      const data = plan!.data as any;
      expect(data.rows).toBe(3);
      expect(data.cols).toBe(4);
    });

    it("builds valid place_value plan", () => {
      const intent = classifyHeuristic("What is the place value of 345?");
      const plan = buildVisualPlan(intent, "What is the place value of 345?");

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("place_value_chart");
      expect(isValidPlan(plan)).toBe(true);
    });

    it("builds valid bar_model plan", () => {
      const intent = classifyHeuristic("Sam has 15 and Tom has 23. How many altogether?");
      const plan = buildVisualPlan(intent, "Sam has 15 and Tom has 23. How many altogether?");

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("bar_model");
      expect(isValidPlan(plan)).toBe(true);
    });

    it("builds valid equation_steps plan", () => {
      const intent = classifyHeuristic("Solve x + 3 = 10");
      const plan = buildVisualPlan(intent, "Solve x + 3 = 10");

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("equation_steps");
      expect(isValidPlan(plan)).toBe(true);
    });
  });

  // ── 5. Plan validation ──────────────────────────────────────────────────

  describe("plan validation", () => {
    it("rejects null plans", () => {
      expect(isValidPlan(null)).toBe(false);
    });

    it("rejects plans with missing data", () => {
      expect(isValidPlan({ diagramType: "number_line", data: {} as any })).toBe(false);
    });

    it("rejects fraction_bar with empty fractions array", () => {
      expect(isValidPlan({
        diagramType: "fraction_bar",
        data: { fractions: [] },
      })).toBe(false);
    });

    it("rejects array with zero rows", () => {
      expect(isValidPlan({
        diagramType: "array",
        data: { rows: 0, cols: 5 },
      })).toBe(false);
    });

    it("accepts valid number_line plan", () => {
      expect(isValidPlan({
        diagramType: "number_line",
        data: { min: 0, max: 10, step: 1 },
      })).toBe(true);
    });
  });

  // ── 6. worked_steps_only returns null plan ──────────────────────────────

  describe("worked_steps_only produces no visual", () => {
    it("buildVisualPlan returns null for worked_steps_only", () => {
      const intent = classifyHeuristic("What is pi?");
      expect(intent.visualType).toBe("worked_steps_only");
      expect(buildVisualPlan(intent, "What is pi?")).toBeNull();
    });
  });

  // ── 7. Full pipeline (sync) ─────────────────────────────────────────────

  describe("full pipeline — getVisualExplanationSync", () => {
    it("produces valid plan for fraction question", () => {
      const result = getVisualExplanationSync("What is 3/4 + 1/2?");
      expect(result.intent.visualType).toBe("fraction_bar");
      expect(result.plan).not.toBeNull();
      expect(result.plan!.diagramType).toBe("fraction_bar");
    });

    it("produces null plan for non-visual question", () => {
      const result = getVisualExplanationSync("Define a whole number");
      expect(result.plan).toBeNull();
    });

    it("extracts correct intent metadata", () => {
      const result = getVisualExplanationSync("Solve x + 5 = 12");
      expect(result.intent.visualType).toBe("equation_steps");
      expect(result.intent.needsStepByStep).toBe(true);
      expect(result.intent.animationLevel).toBe("guided");
    });
  });

  // ── 8. Anti-patterns prevent misclassification ──────────────────────────

  describe("anti-patterns", () => {
    it("fraction question does not match array_model", () => {
      // "fraction" in the question should block array_model for multiplication
      const intent = classifyHeuristic("Multiply fractions 1/2 × 3/4");
      expect(intent.visualType).toBe("fraction_bar");
    });

    it("decimal question does not match basic addition number_line", () => {
      // "decimal" is an anti-pattern for simple addition rule
      const intent = classifyHeuristic("How do I add decimals?");
      // Should still get number_line via the number-line rule, not the addition rule
      expect(["number_line", "worked_steps_only"]).toContain(intent.visualType);
    });
  });

  // ── 9. Array clamping for safety ────────────────────────────────────────

  describe("safety bounds", () => {
    it("clamps array dimensions to 10", () => {
      const intent = classifyHeuristic("What is 15 × 20?");
      const plan = buildVisualPlan(intent, "What is 15 × 20?");
      if (plan && plan.diagramType === "array") {
        const data = plan.data as any;
        expect(data.rows).toBeLessThanOrEqual(10);
        expect(data.cols).toBeLessThanOrEqual(10);
      }
    });
  });
});
