/**
 * @module ai/services/visualExplanationEngine/alignmentVerifier
 *
 * Lightweight alignment verification between explanation text, mathData,
 * and the generated visual plan.
 *
 * Purpose: detect when the AI's structured mathData contradicts the
 * explanation text, so we can fall back to the safer regex path rather
 * than showing a confidently wrong diagram.
 *
 * ─── DESIGN PRINCIPLES ──────────────────────────────────────────────────────
 *
 *   - No symbolic math engine — practical text parsing only
 *   - No AI calls — fully deterministic
 *   - Fast (<1ms) — runs synchronously in the response pipeline
 *   - Conservative: when in doubt, report "low" confidence, not "misaligned"
 *   - Never blocks rendering — only advises the orchestrator
 *
 * ─── WHAT IS CHECKED ────────────────────────────────────────────────────────
 *
 *   1. Result consistency: does the numeric result in mathData match
 *      the result mentioned in the explanation text?
 *   2. Fraction consistency: do fractions in mathData appear in the text?
 *   3. Equation consistency: does the equation solution match?
 *   4. Values presence: do key values from mathData appear in the text?
 *   5. Visual plan data consistency: does the plan's data match mathData?
 */

import type {
  VisualPlan,
  MathData,
  NumberLineData,
  FractionBarData,
  ArrayData,
  BarModelData,
  EquationStepsData,
} from "@mathai/shared-types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VisualAlignmentCheck {
  isAligned:           boolean;
  confidence:          "high" | "medium" | "low";
  issues:              string[];
  fallbackRecommended: boolean;
}

// ─── Text extraction helpers ─────────────────────────────────────────────────

/** Extract all numbers from text (integers and decimals) */
function extractTextNumbers(text: string): number[] {
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  return matches ? [...new Set(matches.map(Number))] : [];
}

/** Extract fractions as "n/d" strings from text */
function extractTextFractions(text: string): string[] {
  const matches = [...text.matchAll(/(\d+)\s*\/\s*(\d+)/g)];
  return matches.map((m) => `${m[1]}/${m[2]}`);
}

/** Check if a number appears in a text (with tolerance for floats) */
function numberAppearsInText(num: number, text: string): boolean {
  const textNums = extractTextNumbers(text);
  if (Number.isInteger(num)) {
    return textNums.includes(num);
  }
  // Float tolerance: check if any extracted number is close
  return textNums.some((n) => Math.abs(n - num) < 0.01);
}

/** Check if a fraction string (e.g. "3/4") appears in text */
function fractionAppearsInText(num: number, den: number, text: string): boolean {
  const fracs = extractTextFractions(text);
  return fracs.includes(`${num}/${den}`);
}

// ─── Individual checks ───────────────────────────────────────────────────────

/**
 * Check 1: Does mathData.result agree with the explanation?
 *
 * We look for the result number or fraction string in the explanation text.
 * This catches cases where the AI says "the answer is 8" but mathData says result: 12.
 */
function checkResultAlignment(
  explanation: string,
  mathData: MathData,
): { ok: boolean; issue?: string } {
  const result = mathData.result;
  if (result === undefined || result === null) return { ok: true };

  if (typeof result === "number") {
    if (numberAppearsInText(result, explanation)) return { ok: true };
    // The result might not literally appear in a conceptual explanation (e.g. "What are fractions?")
    // Only flag this for concrete computation questions
    const hasConcreteAnswer = /=\s*-?\d|answer\s+(is|=)|equals|result|total/i.test(explanation);
    if (!hasConcreteAnswer) return { ok: true }; // conceptual question — no result expected in text
    return { ok: false, issue: `mathData.result (${result}) not found in explanation text` };
  }

  if (typeof result === "string") {
    // Fraction result like "3/4"
    if (explanation.includes(result)) return { ok: true };
    // Normalise: "3/4" might appear as "3 / 4" or "three-fourths"
    const normalised = result.replace(/\s/g, "");
    if (explanation.replace(/\s/g, "").includes(normalised)) return { ok: true };
    const hasConcreteAnswer = /=\s*|answer\s+(is|=)|equals|result|total/i.test(explanation);
    if (!hasConcreteAnswer) return { ok: true };
    return { ok: false, issue: `mathData.result ("${result}") not found in explanation text` };
  }

  return { ok: true };
}

/**
 * Check 2: Do fractions in mathData appear in the explanation?
 *
 * For fraction_addition/subtraction/equivalence questions, the fractions
 * used in the visual should match what the explanation discusses.
 */
function checkFractionAlignment(
  explanation: string,
  mathData: MathData,
): { ok: boolean; issue?: string } {
  if (!mathData.fractions || mathData.fractions.length === 0) return { ok: true };

  // At least one fraction from mathData should appear in the explanation
  const found = mathData.fractions.some(
    (f) => fractionAppearsInText(f.numerator, f.denominator, explanation)
  );

  if (found) return { ok: true };

  // If no fractions appear, it might be a conceptual explanation
  // ("fractions are parts of a whole") — don't penalise
  const hasSpecificFractions = extractTextFractions(explanation).length > 0;
  if (!hasSpecificFractions) return { ok: true }; // explanation doesn't mention specific fractions either

  return { ok: false, issue: "mathData fractions not found in explanation text" };
}

/**
 * Check 3: Does the equation solution in mathData match the explanation?
 */
function checkEquationAlignment(
  explanation: string,
  mathData: MathData,
): { ok: boolean; issue?: string } {
  if (!mathData.equation?.solution) return { ok: true };

  const solution = mathData.equation.solution;
  // Solution might be a number or expression
  const solutionNum = parseFloat(solution);

  if (!isNaN(solutionNum) && numberAppearsInText(solutionNum, explanation)) return { ok: true };
  if (explanation.includes(solution)) return { ok: true };

  // Check if explanation even mentions solving — conceptual questions might not
  const isSolvingContext = /solve|solution|answer|equals|=\s*\d/i.test(explanation);
  if (!isSolvingContext) return { ok: true };

  return { ok: false, issue: `equation solution ("${solution}") not found in explanation` };
}

/**
 * Check 4: Do key values from mathData appear in the question or explanation?
 *
 * The values array contains the core operands. At least one should appear
 * in either the question text or the explanation.
 */
function checkValuesPresence(
  question: string,
  explanation: string,
  mathData: MathData,
): { ok: boolean; issue?: string } {
  if (!mathData.values || mathData.values.length === 0) return { ok: true };

  const combined = `${question} ${explanation}`;
  const found = mathData.values.some((v) => numberAppearsInText(v, combined));

  if (found) return { ok: true };

  return { ok: false, issue: "None of mathData.values appear in question or explanation" };
}

/**
 * Check 5: Does the visual plan's data match mathData?
 *
 * Cross-reference the concrete numbers in the generated plan against
 * the mathData source values to catch plan-builder bugs.
 */
function checkPlanDataAlignment(
  plan: VisualPlan | null,
  mathData: MathData,
): { ok: boolean; issue?: string } {
  if (!plan) return { ok: true };

  switch (plan.diagramType) {
    case "number_line": {
      const d = plan.data as NumberLineData;
      // The arrow should reference values from mathData
      if (d.arrow && mathData.values && mathData.values.length >= 2) {
        const a = mathData.values[0]!;
        const result = typeof mathData.result === "number" ? mathData.result : null;
        if (d.arrow.from !== a && d.point !== a) {
          return { ok: false, issue: `Number line start point (${d.arrow.from}) doesn't match mathData value (${a})` };
        }
        if (result !== null && d.arrow.to !== result) {
          return { ok: false, issue: `Number line arrow endpoint (${d.arrow.to}) doesn't match mathData result (${result})` };
        }
      }
      break;
    }

    case "fraction_bar": {
      const d = plan.data as FractionBarData;
      if (d.fractions && mathData.fractions && mathData.fractions.length > 0) {
        // Check first fraction matches
        const planFirst = d.fractions[0];
        const dataFirst = mathData.fractions[0];
        if (planFirst && dataFirst &&
            (planFirst.numerator !== dataFirst.numerator || planFirst.denominator !== dataFirst.denominator)) {
          return { ok: false, issue: `Fraction bar (${planFirst.numerator}/${planFirst.denominator}) doesn't match mathData (${dataFirst.numerator}/${dataFirst.denominator})` };
        }
      }
      break;
    }

    case "array": {
      const d = plan.data as ArrayData;
      if (mathData.structure?.groups && mathData.structure.itemsPerGroup) {
        if (d.rows !== Math.min(mathData.structure.groups, 10) ||
            d.cols !== Math.min(mathData.structure.itemsPerGroup, 10)) {
          return { ok: false, issue: `Array dimensions (${d.rows}x${d.cols}) don't match mathData structure (${mathData.structure.groups}x${mathData.structure.itemsPerGroup})` };
        }
      }
      break;
    }

    case "bar_model": {
      const d = plan.data as BarModelData;
      if (d.bars && mathData.wordProblem?.known) {
        // First bar value should match first known value
        const planVal = d.bars[0]?.value;
        const dataVal = mathData.wordProblem.known[0]?.value;
        if (planVal !== undefined && dataVal !== undefined && planVal !== dataVal) {
          return { ok: false, issue: `Bar model first value (${planVal}) doesn't match mathData (${dataVal})` };
        }
      }
      break;
    }

    case "equation_steps": {
      const d = plan.data as EquationStepsData;
      if (d.steps && mathData.equation) {
        // First step should contain the equation
        const firstExpr = d.steps[0]?.expression ?? "";
        const lhs = mathData.equation.lhs;
        if (lhs && !firstExpr.includes(lhs)) {
          return { ok: false, issue: `Equation steps don't start with mathData equation LHS ("${lhs}")` };
        }
      }
      break;
    }
  }

  return { ok: true };
}

// ─── Main verification function ──────────────────────────────────────────────

/**
 * Verify alignment between explanation text, mathData, and visual plan.
 *
 * Returns a structured check result. The orchestrator uses this to decide
 * whether to trust the mathData-driven visual or fall back to regex/text-only.
 *
 * @param explanation - The AI-generated explanation text
 * @param question    - The student's original question
 * @param mathData    - Structured math data from AI (may be undefined)
 * @param plan        - The generated visual plan (may be null)
 */
export function verifyAlignment(
  explanation: string,
  question: string,
  mathData: MathData | undefined,
  plan: VisualPlan | null,
): VisualAlignmentCheck {
  // No mathData — nothing to verify (regex fallback is inherently lower-precision)
  if (!mathData) {
    return { isAligned: true, confidence: "low", issues: [], fallbackRecommended: false };
  }

  const issues: string[] = [];

  // Run all checks
  const resultCheck   = checkResultAlignment(explanation, mathData);
  const fractionCheck = checkFractionAlignment(explanation, mathData);
  const equationCheck = checkEquationAlignment(explanation, mathData);
  const valuesCheck   = checkValuesPresence(question, explanation, mathData);
  const planCheck     = checkPlanDataAlignment(plan, mathData);

  if (!resultCheck.ok)   issues.push(resultCheck.issue!);
  if (!fractionCheck.ok) issues.push(fractionCheck.issue!);
  if (!equationCheck.ok) issues.push(equationCheck.issue!);
  if (!valuesCheck.ok)   issues.push(valuesCheck.issue!);
  if (!planCheck.ok)     issues.push(planCheck.issue!);

  // Determine confidence and alignment
  const issueCount = issues.length;

  if (issueCount === 0) {
    return { isAligned: true, confidence: "high", issues: [], fallbackRecommended: false };
  }

  if (issueCount === 1) {
    // One issue = partial mismatch — could be a parsing edge case
    // Use visual but with lower confidence
    return { isAligned: true, confidence: "medium", issues, fallbackRecommended: false };
  }

  // 2+ issues = likely genuine mismatch — recommend fallback
  return {
    isAligned: false,
    confidence: "low",
    issues,
    fallbackRecommended: true,
  };
}
