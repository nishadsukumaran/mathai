/**
 * @test ai/services/visualExplanationEngine/planBuilder (mathData-driven)
 *
 * Tests the structured mathData → VisualPlan pipeline.
 * Pure function tests — no AI, no DB.
 *
 * Scenarios:
 *   1. mathData-driven number_line plan (addition/subtraction)
 *   2. mathData-driven fraction_bar plan
 *   3. mathData-driven array plan (multiplication with structure)
 *   4. mathData-driven place_value plan
 *   5. mathData-driven bar_model plan (word problem)
 *   6. mathData-driven equation_steps plan
 *   7. Fallback to regex when mathData is missing
 *   8. Fallback to regex when mathData is invalid/partial
 *   9. Mapping: mathData type → correct visual type
 *  10. Invalid mathData is safely discarded
 */

import { buildVisualPlan, isValidPlan } from "../../ai/services/visualExplanationEngine/planBuilder";
import { classifyHeuristic }            from "../../ai/services/visualExplanationEngine/classifier";
import { getVisualExplanationSync }     from "../../ai/services/visualExplanationEngine";
import type { MathData }                from "@mathai/shared-types";

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeIntent(visualType: string) {
  return classifyHeuristic("placeholder");  // default intent, will be overridden
}

function numberLineIntent() {
  return { ...classifyHeuristic("what is 3 + 5"), visualType: "number_line" as const };
}

function fractionIntent() {
  return { ...classifyHeuristic("what is 1/4"), visualType: "fraction_bar" as const };
}

function arrayIntent() {
  return { ...classifyHeuristic("3 times 4"), visualType: "array_model" as const };
}

function placeValueIntent() {
  return { ...classifyHeuristic("place value 345"), visualType: "place_value" as const };
}

function barModelIntent() {
  return { ...classifyHeuristic("how many altogether"), visualType: "bar_model" as const };
}

function equationIntent() {
  return { ...classifyHeuristic("solve x + 3 = 10"), visualType: "equation_steps" as const };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("MathData-Driven Plan Builder", () => {

  // ── 1. Number line from mathData ────────────────────────────────────────

  describe("number_line from mathData", () => {
    it("builds precise number line for addition", () => {
      const mathData: MathData = {
        type:   "addition",
        values: [3, 5],
        result: 8,
      };

      const plan = buildVisualPlan(numberLineIntent(), "What is 3 + 5?", mathData);

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("number_line");
      const d = plan!.data as any;
      expect(d.point).toBe(3);
      expect(d.arrow.from).toBe(3);
      expect(d.arrow.to).toBe(8);
      expect(d.arrow.label).toContain("+5");
    });

    it("builds precise number line for subtraction", () => {
      const mathData: MathData = {
        type:   "subtraction",
        values: [10, 3],
        result: 7,
      };

      const plan = buildVisualPlan(numberLineIntent(), "What is 10 - 3?", mathData);

      expect(plan).not.toBeNull();
      const d = plan!.data as any;
      expect(d.point).toBe(10);
      expect(d.arrow.from).toBe(10);
      expect(d.arrow.to).toBe(7);
      expect(d.arrow.label).toContain("−3");
    });
  });

  // ── 2. Fraction bar from mathData ───────────────────────────────────────

  describe("fraction_bar from mathData", () => {
    it("builds precise fraction bars from structured fractions", () => {
      const mathData: MathData = {
        type:      "fraction_addition",
        fractions: [
          { numerator: 1, denominator: 4 },
          { numerator: 2, denominator: 3 },
        ],
        result: "11/12",
      };

      const plan = buildVisualPlan(fractionIntent(), "1/4 + 2/3", mathData);

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("fraction_bar");
      const d = plan!.data as any;
      expect(d.fractions).toHaveLength(2);
      expect(d.fractions[0].numerator).toBe(1);
      expect(d.fractions[0].denominator).toBe(4);
      expect(d.fractions[1].numerator).toBe(2);
      expect(d.fractions[1].denominator).toBe(3);
    });

    it("sets showEquivalent for equivalence type", () => {
      const mathData: MathData = {
        type:      "fraction_equivalence",
        fractions: [{ numerator: 1, denominator: 2 }, { numerator: 2, denominator: 4 }],
      };

      const plan = buildVisualPlan(fractionIntent(), "Are 1/2 and 2/4 equivalent?", mathData);

      const d = plan!.data as any;
      expect(d.showEquivalent).toBe(true);
    });
  });

  // ── 3. Array from mathData ──────────────────────────────────────────────

  describe("array from mathData", () => {
    it("builds array from structure field (groups × itemsPerGroup)", () => {
      const mathData: MathData = {
        type:      "multiplication",
        values:    [3, 4],
        result:    12,
        structure: { groups: 3, itemsPerGroup: 4, total: 12 },
      };

      const plan = buildVisualPlan(arrayIntent(), "3 × 4", mathData);

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("array");
      const d = plan!.data as any;
      expect(d.rows).toBe(3);
      expect(d.cols).toBe(4);
    });

    it("falls back to values when structure is missing", () => {
      const mathData: MathData = {
        type:   "multiplication",
        values: [5, 6],
        result: 30,
      };

      const plan = buildVisualPlan(arrayIntent(), "5 × 6", mathData);

      expect(plan).not.toBeNull();
      const d = plan!.data as any;
      expect(d.rows).toBe(5);
      expect(d.cols).toBe(6);
    });

    it("clamps array dimensions to 10", () => {
      const mathData: MathData = {
        type:      "multiplication",
        values:    [15, 20],
        structure: { groups: 15, itemsPerGroup: 20, total: 300 },
      };

      const plan = buildVisualPlan(arrayIntent(), "15 × 20", mathData);

      const d = plan!.data as any;
      expect(d.rows).toBeLessThanOrEqual(10);
      expect(d.cols).toBeLessThanOrEqual(10);
    });
  });

  // ── 4. Place value from mathData ────────────────────────────────────────

  describe("place_value from mathData", () => {
    it("builds place value chart from values", () => {
      const mathData: MathData = {
        type:   "place_value",
        values: [345],
      };

      const plan = buildVisualPlan(placeValueIntent(), "place value of 345", mathData);

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("place_value_chart");
      const d = plan!.data as any;
      expect(d.digits.hundreds).toBe(3);
      expect(d.digits.tens).toBe(4);
      expect(d.digits.ones).toBe(5);
    });
  });

  // ── 5. Bar model from mathData (word problem) ──────────────────────────

  describe("bar_model from mathData (word problem)", () => {
    it("builds bar model from wordProblem structure", () => {
      const mathData: MathData = {
        type:        "word_problem",
        values:      [15, 23],
        result:      38,
        wordProblem: {
          known:     [{ label: "Sam's apples", value: 15 }, { label: "Tom's apples", value: 23 }],
          unknown:   { label: "Total apples" },
          operation: "addition",
        },
      };

      const plan = buildVisualPlan(barModelIntent(), "Sam has 15 apples, Tom has 23", mathData);

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("bar_model");
      const d = plan!.data as any;
      expect(d.bars).toHaveLength(2);
      expect(d.bars[0].label).toBe("Sam's apples");
      expect(d.bars[0].value).toBe(15);
      expect(d.bars[1].label).toBe("Tom's apples");
      expect(d.bars[1].value).toBe(23);
      expect(d.total.label).toBe("Total apples");
    });
  });

  // ── 6. Equation steps from mathData ─────────────────────────────────────

  describe("equation_steps from mathData", () => {
    it("builds equation steps with solving progression", () => {
      const mathData: MathData = {
        type:     "equation",
        equation: { lhs: "x + 3", rhs: "10", variable: "x", solution: "7" },
        steps:    ["x + 3 = 10", "x = 10 - 3", "x = 7"],
      };

      const plan = buildVisualPlan(equationIntent(), "Solve x + 3 = 10", mathData);

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("equation_steps");
      const d = plan!.data as any;
      expect(d.steps.length).toBeGreaterThanOrEqual(3);
      // First step is the original equation
      expect(d.steps[0].expression).toContain("x + 3");
      // Last step has the solution
      const lastStep = d.steps[d.steps.length - 1];
      expect(lastStep.expression).toContain("7");
    });
  });

  // ── 7. Fallback to regex when mathData is missing ───────────────────────

  describe("regex fallback when mathData is missing", () => {
    it("builds number line from question text when no mathData", () => {
      const plan = buildVisualPlan(numberLineIntent(), "What is 7 + 3?");

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("number_line");
      expect(isValidPlan(plan)).toBe(true);
    });

    it("builds fraction bar from question text when no mathData", () => {
      const plan = buildVisualPlan(fractionIntent(), "What is 1/4 + 2/3?");

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("fraction_bar");
    });
  });

  // ── 8. Fallback when mathData is partial ────────────────────────────────

  describe("partial mathData handling", () => {
    it("falls back to regex when mathData has no values", () => {
      const mathData: MathData = { type: "addition" };

      const plan = buildVisualPlan(numberLineIntent(), "What is 3 + 5?", mathData);

      // Should still produce a valid plan (from regex fallback)
      expect(plan).not.toBeNull();
      expect(isValidPlan(plan)).toBe(true);
    });

    it("uses mathData fractions even without values field", () => {
      const mathData: MathData = {
        type:      "fraction_addition",
        fractions: [{ numerator: 3, denominator: 8 }],
      };

      const plan = buildVisualPlan(fractionIntent(), "3/8 of a pizza", mathData);

      expect(plan).not.toBeNull();
      const d = plan!.data as any;
      expect(d.fractions[0].numerator).toBe(3);
    });
  });

  // ── 9. mathData type → visual type mapping ──────────────────────────────

  describe("mathData type overrides intent visual type", () => {
    it("multiplication mathData produces array even if intent says number_line", () => {
      const mathData: MathData = {
        type:      "multiplication",
        values:    [3, 4],
        result:    12,
        structure: { groups: 3, itemsPerGroup: 4, total: 12 },
      };

      // Intent says number_line, but mathData says multiplication → array
      const plan = buildVisualPlan(numberLineIntent(), "3 × 4", mathData);

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("array");
    });

    it("equation mathData produces equation_steps", () => {
      const mathData: MathData = {
        type:     "equation",
        equation: { lhs: "2x", rhs: "8", variable: "x", solution: "4" },
      };

      const plan = buildVisualPlan(numberLineIntent(), "2x = 8", mathData);

      expect(plan).not.toBeNull();
      expect(plan!.diagramType).toBe("equation_steps");
    });
  });

  // ── 10. Invalid mathData is safely discarded ────────────────────────────

  describe("invalid mathData handling", () => {
    it("ignores mathData with zero-denominator fractions", () => {
      // This would be caught by validateMathData in the service,
      // but planBuilder also handles it gracefully
      const mathData: MathData = {
        type:      "fraction_addition",
        fractions: [],  // empty after validation
      };

      const plan = buildVisualPlan(fractionIntent(), "What is 1/4 + 1/2?", mathData);

      // Falls back to regex — still produces valid plan
      expect(plan).not.toBeNull();
      expect(isValidPlan(plan)).toBe(true);
    });
  });

  // ── 11. Full pipeline with mathData ─────────────────────────────────────

  describe("full pipeline (getVisualExplanationSync with mathData)", () => {
    it("produces precise plan from mathData", () => {
      const mathData: MathData = {
        type:      "fraction_addition",
        fractions: [{ numerator: 1, denominator: 3 }, { numerator: 1, denominator: 6 }],
        result:    "1/2",
      };

      const result = getVisualExplanationSync("What is 1/3 + 1/6?", mathData);

      expect(result.plan).not.toBeNull();
      expect(result.plan!.diagramType).toBe("fraction_bar");
      const d = result.plan!.data as any;
      expect(d.fractions[0].denominator).toBe(3);
      expect(d.fractions[1].denominator).toBe(6);
    });

    it("falls back gracefully when mathData is undefined", () => {
      const result = getVisualExplanationSync("What is 1/3 + 1/6?");

      expect(result.plan).not.toBeNull();
      expect(isValidPlan(result.plan)).toBe(true);
    });
  });
});
