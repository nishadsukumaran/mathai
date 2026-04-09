/**
 * @module components/explanations/dispatch
 *
 * Routes a problem specification to the correct scene renderer.
 *
 * Each supported problem type has a keyword-matcher and a renderer factory.
 * If no renderer matches, returns null — the player will fall back to plain
 * text explanation (graceful degradation).
 *
 * ─── Adding a new explanation type ──────────────────────────────────────────
 *
 * 1. Create a renderer factory under `renderers/<category>/<name>.ts` that
 *    exports `build<Name>Scene(params): ExplanationScene`
 * 2. Add a match case below that extracts params from the problem and calls
 *    the factory
 * 3. Register it in SUPPORTED_TYPES
 *
 * The renderer must return a valid ExplanationScene — no other API surface.
 */

import type { ExplanationScene } from "./engine/scene-types";
import { buildAdditionRegroupingScene } from "./renderers/arithmetic/additionRegrouping";
import { buildFractionComparisonScene } from "./renderers/fractions/fractionComparison";
import { buildSimpleEquationScene }     from "./renderers/algebra/simpleEquation";

export type SupportedExplanationType =
  | "addition-regrouping"
  | "fraction-comparison"
  | "simple-equation";

export const SUPPORTED_TYPES: SupportedExplanationType[] = [
  "addition-regrouping",
  "fraction-comparison",
  "simple-equation",
];

export interface ProblemSpec {
  /** Free-form problem text. Used to match against renderers. */
  text?: string;
  /** Optional structured data for precise routing. */
  type?:   SupportedExplanationType;
  params?: Record<string, number>;
}

/**
 * Attempts to match a problem to a scene renderer.
 * Returns null if no renderer can handle the problem — the caller should
 * fall back to plain text explanation.
 */
export function dispatchExplanation(spec: ProblemSpec): ExplanationScene | null {
  // 1. If a type is explicitly requested, route directly.
  if (spec.type) {
    return buildByType(spec.type, spec.params ?? {});
  }

  // 2. Otherwise, pattern-match the free-form text.
  const text = (spec.text ?? "").toLowerCase().trim();
  if (!text) return null;

  // Pattern: "a + b" where a and b are two-digit numbers that require regrouping
  const additionMatch = text.match(/^(\d+)\s*\+\s*(\d+)/);
  if (additionMatch) {
    const a = parseInt(additionMatch[1]!, 10);
    const b = parseInt(additionMatch[2]!, 10);
    if (a >= 10 && a < 100 && b >= 10 && b < 100 && (a % 10) + (b % 10) >= 10) {
      return buildAdditionRegroupingScene(a, b);
    }
  }

  // Pattern: "a/b vs c/d" or "a/b > c/d" etc.
  const fractionMatch = text.match(/(\d+)\s*\/\s*(\d+).*?(\d+)\s*\/\s*(\d+)/);
  if (fractionMatch) {
    const num1 = parseInt(fractionMatch[1]!, 10);
    const den1 = parseInt(fractionMatch[2]!, 10);
    const num2 = parseInt(fractionMatch[3]!, 10);
    const den2 = parseInt(fractionMatch[4]!, 10);
    if (den1 >= 2 && den1 <= 12 && den2 >= 2 && den2 <= 12 && num1 === 1 && num2 === 1) {
      return buildFractionComparisonScene({ num1, den1, num2, den2 });
    }
  }

  // Pattern: "x + b = c" or "x - b = c"
  const equationMatch = text.match(/x\s*([+\-])\s*(\d+)\s*=\s*(\d+)/);
  if (equationMatch) {
    const sign = equationMatch[1];
    const b    = parseInt(equationMatch[2]!, 10);
    const c    = parseInt(equationMatch[3]!, 10);
    const bSigned = sign === "+" ? b : -b;
    return buildSimpleEquationScene({ b: bSigned, c });
  }

  return null;
}

function buildByType(
  type: SupportedExplanationType,
  params: Record<string, number>,
): ExplanationScene | null {
  switch (type) {
    case "addition-regrouping":
      return buildAdditionRegroupingScene(params["a"] ?? 27, params["b"] ?? 15);

    case "fraction-comparison":
      return buildFractionComparisonScene({
        num1: params["num1"] ?? 1,
        den1: params["den1"] ?? 2,
        num2: params["num2"] ?? 1,
        den2: params["den2"] ?? 4,
      });

    case "simple-equation":
      return buildSimpleEquationScene({
        b: params["b"] ?? 3,
        c: params["c"] ?? 7,
      });

    default:
      return null;
  }
}
