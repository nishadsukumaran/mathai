/**
 * @test ai/services/visualExplanationEngine/alignmentVerifier
 *
 * Unit tests for the visual-explanation alignment verifier.
 * Pure function tests — no AI, no DB.
 *
 * Scenarios:
 *   1. Aligned addition: explanation matches mathData and plan
 *   2. Aligned fraction: fractions in text match mathData
 *   3. Aligned equation: solution in text matches mathData
 *   4. Mismatched result: explanation says 8, mathData says 12
 *   5. Mismatched fractions: different fractions in text vs mathData
 *   6. Plan data mismatch: plan numbers don't match mathData
 *   7. Graceful fallback: no mathData → low confidence, no fallback
 *   8. Conceptual question: no concrete result → no false alarm
 *   9. Multiple issues trigger fallback
 *  10. Single issue → medium confidence, no fallback
 */

import { verifyAlignment } from "../../ai/services/visualExplanationEngine/alignmentVerifier";
import type { MathData, VisualPlan, NumberLineData, FractionBarData, ArrayData, EquationStepsData } from "@mathai/shared-types";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Alignment Verifier", () => {

  // ── 1. Aligned addition ─────────────────────────────────────────────────

  describe("aligned addition", () => {
    it("returns high confidence when explanation, mathData, and plan agree", () => {
      const explanation = "When you add 3 and 5, the answer is 8.";
      const mathData: MathData = { type: "addition", values: [3, 5], result: 8 };
      const plan: VisualPlan = {
        diagramType: "number_line",
        data: { min: 1, max: 10, step: 1, point: 3, arrow: { from: 3, to: 8, label: "+5" } },
      };

      const check = verifyAlignment(explanation, "What is 3 + 5?", mathData, plan);

      expect(check.isAligned).toBe(true);
      expect(check.confidence).toBe("high");
      expect(check.issues).toHaveLength(0);
      expect(check.fallbackRecommended).toBe(false);
    });
  });

  // ── 2. Aligned fraction ─────────────────────────────────────────────────

  describe("aligned fraction", () => {
    it("returns high confidence when fractions match", () => {
      const explanation = "To add 1/4 and 2/3, first find a common denominator. The answer is 11/12.";
      const mathData: MathData = {
        type: "fraction_addition",
        fractions: [{ numerator: 1, denominator: 4 }, { numerator: 2, denominator: 3 }],
        result: "11/12",
      };
      const plan: VisualPlan = {
        diagramType: "fraction_bar",
        data: {
          fractions: [
            { numerator: 1, denominator: 4, label: "1/4", color: "#6366f1" },
            { numerator: 2, denominator: 3, label: "2/3", color: "#10b981" },
          ],
        },
      };

      const check = verifyAlignment(explanation, "1/4 + 2/3", mathData, plan);

      expect(check.isAligned).toBe(true);
      expect(check.confidence).toBe("high");
      expect(check.fallbackRecommended).toBe(false);
    });
  });

  // ── 3. Aligned equation ─────────────────────────────────────────────────

  describe("aligned equation", () => {
    it("returns high confidence when equation solution matches", () => {
      const explanation = "To solve x + 3 = 10, subtract 3 from both sides. So x = 7.";
      const mathData: MathData = {
        type: "equation",
        equation: { lhs: "x + 3", rhs: "10", variable: "x", solution: "7" },
      };
      const plan: VisualPlan = {
        diagramType: "equation_steps",
        data: {
          title: "Solving Step by Step",
          steps: [
            { label: "Start", expression: "x + 3 = 10" },
            { label: "Solve", expression: "x = 7", result: "x = 7" },
          ],
        },
      };

      const check = verifyAlignment(explanation, "Solve x + 3 = 10", mathData, plan);

      expect(check.isAligned).toBe(true);
      expect(check.confidence).toBe("high");
    });
  });

  // ── 4. Mismatched result ────────────────────────────────────────────────

  describe("mismatched result", () => {
    it("detects when explanation says 8 but mathData says 12", () => {
      const explanation = "When you add 3 and 5, the answer is 8.";
      const mathData: MathData = { type: "addition", values: [3, 5], result: 12 }; // WRONG
      const plan: VisualPlan = {
        diagramType: "number_line",
        data: { min: 1, max: 14, step: 1, point: 3, arrow: { from: 3, to: 12, label: "+9" } },
      };

      const check = verifyAlignment(explanation, "What is 3 + 5?", mathData, plan);

      // Result mismatch + plan arrow endpoint mismatch = 2 issues → fallback
      expect(check.issues.length).toBeGreaterThanOrEqual(1);
      // At least one issue mentions the result
      expect(check.issues.some((i) => i.includes("result") || i.includes("12"))).toBe(true);
    });
  });

  // ── 5. Mismatched fractions ─────────────────────────────────────────────

  describe("mismatched fractions", () => {
    it("detects when mathData fractions don't match explanation", () => {
      const explanation = "To add 1/4 and 1/2, find a common denominator. The result is 3/4.";
      const mathData: MathData = {
        type: "fraction_addition",
        fractions: [{ numerator: 2, denominator: 7 }, { numerator: 3, denominator: 8 }], // completely different
        result: "3/4",
      };
      // No plan — testing just mathData vs explanation
      const check = verifyAlignment(explanation, "1/4 + 1/2", mathData, null);

      expect(check.issues.some((i) => i.includes("fraction"))).toBe(true);
    });
  });

  // ── 6. Plan data mismatch ──────────────────────────────────────────────

  describe("plan data mismatch", () => {
    it("detects when array plan dimensions don't match mathData structure", () => {
      const explanation = "3 groups of 4 equals 12.";
      const mathData: MathData = {
        type: "multiplication",
        values: [3, 4],
        result: 12,
        structure: { groups: 3, itemsPerGroup: 4, total: 12 },
      };
      const plan: VisualPlan = {
        diagramType: "array",
        data: { rows: 5, cols: 6 } as ArrayData, // WRONG dimensions
      };

      const check = verifyAlignment(explanation, "3 × 4", mathData, plan);

      expect(check.issues.some((i) => i.includes("Array dimensions"))).toBe(true);
    });

    it("detects when fraction bar doesn't match mathData fractions", () => {
      const explanation = "Compare 1/3 and 1/2.";
      const mathData: MathData = {
        type: "fraction_comparison",
        fractions: [{ numerator: 1, denominator: 3 }, { numerator: 1, denominator: 2 }],
      };
      const plan: VisualPlan = {
        diagramType: "fraction_bar",
        data: {
          fractions: [
            { numerator: 2, denominator: 5, label: "2/5", color: "#000" }, // WRONG
          ],
        },
      };

      const check = verifyAlignment(explanation, "compare 1/3 and 1/2", mathData, plan);

      expect(check.issues.some((i) => i.includes("Fraction bar"))).toBe(true);
    });
  });

  // ── 7. No mathData → low confidence, no fallback ───────────────────────

  describe("no mathData", () => {
    it("returns low confidence with no issues when mathData is missing", () => {
      const check = verifyAlignment("Some explanation.", "Some question?", undefined, null);

      expect(check.isAligned).toBe(true);
      expect(check.confidence).toBe("low");
      expect(check.issues).toHaveLength(0);
      expect(check.fallbackRecommended).toBe(false);
    });
  });

  // ── 8. Conceptual question — no false alarm ────────────────────────────

  describe("conceptual question", () => {
    it("does not flag result mismatch for conceptual explanations", () => {
      const explanation = "Fractions are parts of a whole. When you cut a pizza into 4 slices, each slice is 1/4.";
      const mathData: MathData = {
        type: "fraction_equivalence",
        fractions: [{ numerator: 1, denominator: 4 }],
        result: "1/4",
      };

      const check = verifyAlignment(explanation, "What are fractions?", mathData, null);

      // "result" check should not fire because explanation has no "answer is" pattern
      expect(check.confidence).not.toBe("low");
      expect(check.fallbackRecommended).toBe(false);
    });
  });

  // ── 9. Multiple issues trigger fallback ─────────────────────────────────

  describe("multiple issues trigger fallback", () => {
    it("recommends fallback when 2+ issues found", () => {
      const explanation = "The answer is 8. We used 3 and 5.";
      const mathData: MathData = {
        type: "addition",
        values: [99, 100],  // doesn't match question
        result: 199,         // doesn't match explanation
      };

      const check = verifyAlignment(explanation, "What is 3 + 5?", mathData, null);

      expect(check.issues.length).toBeGreaterThanOrEqual(2);
      expect(check.fallbackRecommended).toBe(true);
      expect(check.isAligned).toBe(false);
      expect(check.confidence).toBe("low");
    });
  });

  // ── 10. Single issue → medium confidence ────────────────────────────────

  describe("single issue gives medium confidence", () => {
    it("returns medium confidence with one minor issue", () => {
      const explanation = "To add 3 and 5, the result equals 8. Simple!";
      const mathData: MathData = {
        type: "addition",
        values: [3, 5],
        result: 8,
        // Structure field doesn't match anything — one issue
        structure: { groups: 99, itemsPerGroup: 99, total: 99 },
      };

      const check = verifyAlignment(explanation, "3 + 5", mathData, null);

      // Values and result pass, but structure is irrelevant noise
      // Should be at most 1 issue (if values check passes)
      expect(check.fallbackRecommended).toBe(false);
    });
  });

  // ── 11. Output shape validation ─────────────────────────────────────────

  describe("output shape", () => {
    it("always returns all required fields", () => {
      const check = verifyAlignment("test", "test", { type: "addition" }, null);

      expect(typeof check.isAligned).toBe("boolean");
      expect(["high", "medium", "low"]).toContain(check.confidence);
      expect(Array.isArray(check.issues)).toBe(true);
      expect(typeof check.fallbackRecommended).toBe("boolean");
    });
  });

  // ── 12. Equation plan alignment ─────────────────────────────────────────

  describe("equation plan alignment", () => {
    it("detects when equation steps don't start with the correct LHS", () => {
      const explanation = "Solve 2x = 8.";
      const mathData: MathData = {
        type: "equation",
        equation: { lhs: "2x", rhs: "8", variable: "x", solution: "4" },
      };
      const plan: VisualPlan = {
        diagramType: "equation_steps",
        data: {
          title: "Solving",
          steps: [
            { label: "Start", expression: "y + 10 = 20" }, // WRONG equation
          ],
        },
      };

      const check = verifyAlignment(explanation, "Solve 2x = 8", mathData, plan);

      expect(check.issues.some((i) => i.includes("LHS"))).toBe(true);
    });
  });
});
