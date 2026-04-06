/**
 * @module lib/scene-engine/dispatcher
 *
 * Decides whether a math question should get a scene animation
 * and resolves the plan using template-first routing.
 *
 * Priority:
 *   1. Template match from mathData type + values  (instant, deterministic)
 *   2. Eligible for AI generation                  (async, validated)
 *   3. Not eligible → null                         (no scene shown)
 */

import type { ScenePlan } from "./types";
import type { MathData }  from "@/types";
import {
  multiplicationArray,
  subtractionNumberLine,
  fractionBars,
  divisionGroups,
  equationSolving,
} from "./templates";

// ─── Scene eligibility ───────────────────────────────────────────────────────

/** MathData types that have template coverage */
const TEMPLATE_TYPES = new Set([
  "multiplication",
  "subtraction",
  "addition",
  "division",
  "fraction_addition",
  "equation",
]);

/** MathData types eligible for AI scene generation (no template, but scene-worthy) */
const AI_ELIGIBLE_TYPES = new Set([
  "fraction_subtraction",
  "fraction_equivalence",
  "fraction_comparison",
  "place_value",
  "word_problem",
  "comparison",
]);

export type SceneSource = "template" | "ai" | "none";

export interface DispatchResult {
  source:   SceneSource;
  plan:     ScenePlan | null;
  eligible: boolean;            // true if AI generation would be worth trying
  topic:    string;
}

/**
 * Synchronously attempt to resolve a scene plan from templates.
 * Returns the plan if a template matches, or eligibility info if AI could help.
 */
export function dispatchScene(
  mathData: MathData | undefined | null,
  question: string,
): DispatchResult {
  if (!mathData) {
    return { source: "none", plan: null, eligible: false, topic: "unknown" };
  }

  // ── 1. Try template match ──────────────────────────────────────────────────

  const plan = tryTemplate(mathData, question);
  if (plan) {
    return { source: "template", plan, eligible: false, topic: mathData.type };
  }

  // ── 2. Check AI eligibility ────────────────────────────────────────────────

  if (AI_ELIGIBLE_TYPES.has(mathData.type)) {
    return { source: "none", plan: null, eligible: true, topic: mathData.type };
  }

  // ── 3. Not eligible ────────────────────────────────────────────────────────

  return { source: "none", plan: null, eligible: false, topic: mathData.type };
}

/**
 * Check if a math question is scene-eligible at all (for showing the button).
 */
export function isSceneEligible(mathData: MathData | undefined | null): boolean {
  if (!mathData) return false;
  return TEMPLATE_TYPES.has(mathData.type) || AI_ELIGIBLE_TYPES.has(mathData.type);
}

// ─── Template matching ───────────────────────────────────────────────────────

function tryTemplate(md: MathData, question: string): ScenePlan | null {
  const v = md.values ?? [];

  switch (md.type) {
    case "multiplication": {
      const a = v[0] ?? extractFirstNumber(question) ?? 3;
      const b = v[1] ?? extractSecondNumber(question) ?? 4;
      if (a > 0 && a <= 10 && b > 0 && b <= 10) {
        return multiplicationArray(a, b);
      }
      return null;
    }

    case "subtraction": {
      const a = v[0] ?? extractFirstNumber(question) ?? 8;
      const b = v[1] ?? extractSecondNumber(question) ?? 3;
      if (a >= 0 && a <= 20 && b >= 0 && b <= a) {
        return subtractionNumberLine(a, b);
      }
      return null;
    }

    case "addition": {
      // Addition reuses number line with positive hops (a + b shown as start at a, hop right b)
      const a = v[0] ?? extractFirstNumber(question) ?? 5;
      const b = v[1] ?? extractSecondNumber(question) ?? 3;
      if (a >= 0 && a <= 20 && b >= 0 && b <= 20) {
        // Show as subtraction-style number line but with the sum
        return subtractionNumberLine(a + b, b);
      }
      return null;
    }

    case "division": {
      const total = v[0] ?? md.structure?.total ?? extractFirstNumber(question) ?? 12;
      const divisor = v[1] ?? md.structure?.groups ?? extractSecondNumber(question) ?? 3;
      if (total > 0 && total <= 24 && divisor > 0 && divisor <= 6 && total % divisor === 0) {
        return divisionGroups(total, divisor);
      }
      return null;
    }

    case "fraction_addition": {
      const fracs = md.fractions ?? [];
      if (fracs.length >= 2) {
        const f1 = fracs[0]!;
        const f2 = fracs[1]!;
        if (f1.denominator === f2.denominator && f1.denominator <= 12) {
          return fractionBars(f1.numerator, f1.denominator, f2.numerator, f2.denominator);
        }
      }
      return null;
    }

    case "equation": {
      const eq = md.equation;
      if (eq?.variable && eq.lhs && eq.rhs) {
        // Parse "x + 5 = 12" style
        const match = eq.lhs.match(/(\w)\s*([+-])\s*(\d+)/);
        if (match) {
          const variable = match[1]!;
          const op = match[2] as "+" | "-";
          const constant = parseInt(match[3]!, 10);
          const total = parseInt(eq.rhs, 10);
          if (!isNaN(constant) && !isNaN(total) && total <= 100) {
            return equationSolving(variable, constant, total, op);
          }
        }
      }
      return null;
    }

    default:
      return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractFirstNumber(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function extractSecondNumber(text: string): number | null {
  const matches = text.match(/\d+/g);
  return matches && matches.length >= 2 ? parseInt(matches[1]!, 10) : null;
}
