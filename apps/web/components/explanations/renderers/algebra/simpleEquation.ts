/**
 * @module components/explanations/renderers/algebra/simpleEquation
 *
 * Solves x + b = c (or x - b = c) by showing the inverse operation
 * applied to both sides of the equation.
 *
 * Teaching flow:
 *   1. Reveal the equation (x + 3 = 7)
 *   2. Focus on the +3 term
 *   3. Show "subtract 3 from both sides" with matching -3 on each side
 *   4. Show the +3 and -3 cancelling on the left
 *   5. Show 7 - 3 on the right
 *   6. Reveal the result (x = 4)
 */

import type { ExplanationScene } from "../../engine/scene-types";

export interface SimpleEquationParams {
  /** The constant added or subtracted from x. Use negative for "x - b = c". */
  b: number;
  /** The right-hand side value. */
  c: number;
}

export function buildSimpleEquationScene(
  params: SimpleEquationParams = { b: 3, c: 7 },
): ExplanationScene {
  const { b, c } = params;
  const solution = c - b;
  const isAddition = b >= 0;
  const absB = Math.abs(b);
  // For "x - 3 = 7" (b negative), the inverse is +3. For "x + 3 = 7", inverse is -3.
  const inverseSign = isAddition ? "-" : "+";
  const operatorSign = isAddition ? "+" : "-";

  const W = 800;
  const H = 500;
  const BIG_FS = 72;
  const MED_FS = 48;

  // Layout: left side of equation, = sign, right side
  const leftX  = 220;
  const eqX    = 400;
  const rightX = 580;
  const baselineY = 180;
  const inverseY  = 260;
  const resultY   = 400;

  return {
    id: `simple-equation-${b}-${c}`,
    title: `Solve x ${operatorSign} ${absB} = ${c}`,
    topic: "Algebra",
    viewBox: { width: W, height: H },

    elements: [
      // ─── Original equation: x + 3 = 7 ────────────────────────────────
      // Split into parts so we can target and manipulate them individually
      { type: "text", id: "x-var", content: "x", x: leftX - 50, y: baselineY, fontSize: BIG_FS, weight: "black", color: "#1e293b" },
      { type: "text", id: "op-sign", content: operatorSign, x: leftX + 10, y: baselineY, fontSize: BIG_FS, weight: "bold", color: "#6366f1" },
      { type: "text", id: "b-val", content: String(absB), x: leftX + 70, y: baselineY, fontSize: BIG_FS, weight: "black", color: "#1e293b" },
      { type: "text", id: "eq-sign", content: "=", x: eqX, y: baselineY, fontSize: BIG_FS, weight: "bold", color: "#1e293b" },
      { type: "text", id: "c-val", content: String(c), x: rightX, y: baselineY, fontSize: BIG_FS, weight: "black", color: "#1e293b" },

      // ─── Focus highlight on the +b term ──────────────────────────────
      {
        type: "rect", id: "focus-b",
        x: leftX - 10, y: baselineY - 50, width: 140, height: 100,
        fill: "transparent", stroke: "#f59e0b", strokeWidth: 3, rx: 10,
      },

      // ─── Inverse operation shown below both sides ─────────────────────
      // "- 3" on the left
      { type: "text", id: "left-inverse", content: `${inverseSign} ${absB}`, x: leftX + 70, y: inverseY, fontSize: MED_FS, weight: "bold", color: "#f59e0b" },
      // "- 3" on the right
      { type: "text", id: "right-inverse", content: `${inverseSign} ${absB}`, x: rightX, y: inverseY, fontSize: MED_FS, weight: "bold", color: "#f59e0b" },

      // ─── Cancellation strike for the +b and -b on the left ───────────
      { type: "line", id: "cancel-b",  x1: leftX + 30, y1: baselineY - 5, x2: leftX + 110, y2: baselineY + 5, stroke: "#ef4444", strokeWidth: 4 },
      { type: "line", id: "cancel-left-inv", x1: leftX + 30, y1: inverseY - 5, x2: leftX + 110, y2: inverseY + 5, stroke: "#ef4444", strokeWidth: 4 },

      // ─── Result computation on right: 7 - 3 = 4 ──────────────────────
      { type: "text", id: "right-compute", content: `${c} ${inverseSign} ${absB} = ${solution}`, x: rightX - 20, y: 340, fontSize: 36, weight: "bold", color: "#10b981" },

      // ─── Final result: x = 4 ─────────────────────────────────────────
      { type: "text", id: "x-final", content: "x", x: leftX - 50, y: resultY, fontSize: BIG_FS, weight: "black", color: "#10b981" },
      { type: "text", id: "eq-final", content: "=", x: eqX - 150, y: resultY, fontSize: BIG_FS, weight: "bold", color: "#10b981" },
      { type: "text", id: "solution-val", content: String(solution), x: eqX - 70, y: resultY, fontSize: BIG_FS, weight: "black", color: "#10b981" },

      // ─── Celebration ─────────────────────────────────────────────────
      {
        type: "text", id: "celebration",
        content: `x = ${solution}`,
        x: W / 2 + 150, y: resultY, fontSize: 56, weight: "black", color: "#10b981",
      },
    ],

    steps: [
      // ─── Step 1: Reveal equation ──────────────────────────────────────
      {
        id: "s1-reveal",
        narration: `Let's solve x ${operatorSign} ${absB} = ${c}. We need to find x.`,
        actions: [
          { type: "reveal", target: "x-var", from: "left", duration: 0.4 },
          { type: "reveal", target: "op-sign", from: "top", duration: 0.3, delay: 0.1 },
          { type: "reveal", target: "b-val", from: "right", duration: 0.4, delay: 0.1 },
          { type: "reveal", target: "eq-sign", from: "pop", duration: 0.3, delay: 0.2 },
          { type: "reveal", target: "c-val", from: "right", duration: 0.4, delay: 0.1 },
        ],
      },

      // ─── Step 2: Focus on the +b term ─────────────────────────────────
      {
        id: "s2-focus",
        narration: `The ${operatorSign}${absB} is keeping x from being alone. We need to get rid of it.`,
        actions: [
          { type: "draw", target: "focus-b", duration: 0.8 },
          { type: "focus", target: ["op-sign", "b-val"], effect: "pulse", duration: 0.7, delay: 0.2 },
        ],
      },

      // ─── Step 3: Apply inverse to both sides ─────────────────────────
      {
        id: "s3-inverse",
        narration: `To undo ${operatorSign}${absB}, we ${isAddition ? "subtract" : "add"} ${absB}. What we do to one side, we must do to the other.`,
        actions: [
          { type: "dim", target: "focus-b", opacity: 0.2, duration: 0.3 },
          { type: "reveal", target: "left-inverse", from: "bottom", duration: 0.5, delay: 0.1 },
          { type: "reveal", target: "right-inverse", from: "bottom", duration: 0.5, delay: 0.1 },
          { type: "focus", target: ["left-inverse", "right-inverse"], effect: "pulse", duration: 0.6, delay: 0.2 },
        ],
      },

      // ─── Step 4: Cancel the +b and -b on left ────────────────────────
      {
        id: "s4-cancel",
        narration: `On the left, ${operatorSign}${absB} and ${inverseSign}${absB} cancel out. x stands alone.`,
        actions: [
          { type: "draw", target: "cancel-b", duration: 0.5 },
          { type: "draw", target: "cancel-left-inv", duration: 0.5, delay: 0.1 },
          { type: "dim", target: ["op-sign", "b-val", "left-inverse"], opacity: 0.3, duration: 0.4, delay: 0.2 },
          { type: "focus", target: "x-var", effect: "pulse", duration: 0.6, delay: 0.2 },
        ],
      },

      // ─── Step 5: Compute right side ───────────────────────────────────
      {
        id: "s5-compute",
        narration: `On the right, ${c} ${inverseSign} ${absB} equals ${solution}.`,
        actions: [
          { type: "dim", target: ["c-val", "right-inverse"], opacity: 0.3, duration: 0.3 },
          { type: "reveal", target: "right-compute", from: "pop", duration: 0.5, delay: 0.1 },
          { type: "focus", target: "right-compute", effect: "pulse", duration: 0.6, delay: 0.2 },
        ],
      },

      // ─── Step 6: Reveal final answer ──────────────────────────────────
      {
        id: "s6-answer",
        narration: `So x = ${solution}. Let's check: ${solution} ${operatorSign} ${absB} = ${c} ✓`,
        actions: [
          { type: "dim", target: [
            "x-var", "op-sign", "b-val", "eq-sign", "c-val",
            "focus-b", "left-inverse", "right-inverse",
            "cancel-b", "cancel-left-inv", "right-compute",
          ], opacity: 0, duration: 0.4 },
          { type: "reveal", target: "celebration", from: "pop", duration: 0.8, delay: 0.1 },
          { type: "focus", target: "celebration", effect: "pulse", duration: 0.7, delay: 0.2 },
        ],
      },
    ],
  };
}
