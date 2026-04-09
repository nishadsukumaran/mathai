/**
 * @module components/explanations/renderers/arithmetic/additionRegrouping
 *
 * Builds an ExplanationScene for addition with regrouping (e.g. 27 + 15 = 42).
 *
 * Teaching flow:
 *   1. Reveal the problem: 27 + 15
 *   2. Highlight the ones column
 *   3. Show that 7 + 5 = 12
 *   4. Carry the 1 ten (move it to the tens column)
 *   5. Write the ones digit (2)
 *   6. Highlight the tens column
 *   7. Compute the final sum (1 + 2 + 1 = 4)
 *   8. Reveal the answer: 42
 *
 * This is built from the same primitives as every other renderer. To add
 * a new arithmetic explanation, copy this file as a starting point.
 */

import type { ExplanationScene } from "../../engine/scene-types";

export function buildAdditionRegroupingScene(a = 27, b = 15): ExplanationScene {
  const sum = a + b;

  // Decompose into tens and ones
  const aTens = Math.floor(a / 10);
  const aOnes = a % 10;
  const bTens = Math.floor(b / 10);
  const bOnes = b % 10;
  const onesSum = aOnes + bOnes;
  const carry = Math.floor(onesSum / 10);
  const onesResult = onesSum % 10;
  const tensResult = aTens + bTens + carry;

  // ─── Layout constants ────────────────────────────────────────────────────
  const W = 800;
  const H = 500;
  const DIGIT_FS = 80;
  const LABEL_FS = 22;

  // Column x positions
  const tensX = 420;
  const onesX = 520;
  const opX   = 260;

  // Y positions
  const topRowY    = 150;  // first number (a)
  const secondRowY = 240;  // second number (b)
  const lineY      = 290;  // horizontal line under numbers
  const resultY    = 360;  // result
  const carryY     = 80;   // small carry digit above tens column

  return {
    id:    `addition-regrouping-${a}-${b}`,
    title: `${a} + ${b}`,
    topic: "Addition",
    viewBox: { width: W, height: H },

    elements: [
      // ─── Column headers (faint labels) ────────────────────────────────
      {
        type: "text", id: "lbl-tens", content: "tens",
        x: tensX, y: 60, fontSize: LABEL_FS, color: "#94a3b8", weight: "bold",
      },
      {
        type: "text", id: "lbl-ones", content: "ones",
        x: onesX, y: 60, fontSize: LABEL_FS, color: "#94a3b8", weight: "bold",
      },

      // ─── First number (a) ─────────────────────────────────────────────
      {
        type: "text", id: "a-tens", content: String(aTens),
        x: tensX, y: topRowY, fontSize: DIGIT_FS, weight: "black", color: "#1e293b",
      },
      {
        type: "text", id: "a-ones", content: String(aOnes),
        x: onesX, y: topRowY, fontSize: DIGIT_FS, weight: "black", color: "#1e293b",
      },

      // ─── Operator ─────────────────────────────────────────────────────
      {
        type: "text", id: "op-plus", content: "+",
        x: opX, y: secondRowY, fontSize: DIGIT_FS, weight: "black", color: "#6366f1",
      },

      // ─── Second number (b) ────────────────────────────────────────────
      {
        type: "text", id: "b-tens", content: String(bTens),
        x: tensX, y: secondRowY, fontSize: DIGIT_FS, weight: "black", color: "#1e293b",
      },
      {
        type: "text", id: "b-ones", content: String(bOnes),
        x: onesX, y: secondRowY, fontSize: DIGIT_FS, weight: "black", color: "#1e293b",
      },

      // ─── Horizontal line ──────────────────────────────────────────────
      {
        type: "line", id: "sum-line",
        x1: opX - 30, y1: lineY, x2: onesX + 50, y2: lineY,
        stroke: "#1e293b", strokeWidth: 4,
      },

      // ─── Ones column focus box (drawn during step 2) ──────────────────
      {
        type: "rect", id: "focus-ones",
        x: onesX - 40, y: topRowY - 55, width: 90, height: 150,
        fill: "transparent", stroke: "#f59e0b", strokeWidth: 3, rx: 10,
      },

      // ─── "7 + 5 = 12" callout (shown during step 3) ────────────────────
      {
        type: "text", id: "callout-ones-sum",
        content: `${aOnes} + ${bOnes} = ${onesSum}`,
        x: 150, y: 220, fontSize: 36, weight: "bold", color: "#f59e0b",
      },

      // ─── Carry digit above tens column ────────────────────────────────
      {
        type: "text", id: "carry-digit", content: String(carry),
        x: tensX, y: carryY, fontSize: 40, weight: "black", color: "#f59e0b",
      },
      {
        type: "text", id: "carry-label", content: "carry",
        x: tensX + 60, y: carryY, fontSize: LABEL_FS, color: "#f59e0b", weight: "bold",
      },

      // ─── Arrow from ones to tens (carry visual) ───────────────────────
      {
        type: "arrow", id: "carry-arrow",
        x1: onesX - 10, y1: lineY + 20, x2: tensX + 5, y2: carryY + 15,
        color: "#f59e0b", strokeWidth: 3, curved: true,
      },

      // ─── Tens column focus box (step 6) ───────────────────────────────
      {
        type: "rect", id: "focus-tens",
        x: tensX - 40, y: carryY - 30, width: 90, height: 230,
        fill: "transparent", stroke: "#6366f1", strokeWidth: 3, rx: 10,
      },

      // ─── Result digits ────────────────────────────────────────────────
      {
        type: "text", id: "result-ones", content: String(onesResult),
        x: onesX, y: resultY, fontSize: DIGIT_FS, weight: "black", color: "#10b981",
      },
      {
        type: "text", id: "result-tens", content: String(tensResult),
        x: tensX, y: resultY, fontSize: DIGIT_FS, weight: "black", color: "#10b981",
      },

      // ─── Final answer banner ──────────────────────────────────────────
      {
        type: "text", id: "final-answer", content: `${a} + ${b} = ${sum}`,
        x: W / 2, y: 450, fontSize: 44, weight: "black", color: "#10b981",
      },
    ],

    steps: [
      // ─── Step 1: Show the problem ─────────────────────────────────────
      {
        id: "s1-setup",
        narration: `Let's add ${a} + ${b}. We'll line up the ones and tens columns.`,
        actions: [
          { type: "reveal", target: ["lbl-tens", "lbl-ones"], from: "fade", duration: 0.4 },
          { type: "reveal", target: ["a-tens", "a-ones"], from: "pop", duration: 0.5, delay: 0.1 },
          { type: "reveal", target: "op-plus", from: "left", duration: 0.4, delay: 0.1 },
          { type: "reveal", target: ["b-tens", "b-ones"], from: "pop", duration: 0.5, delay: 0.1 },
          { type: "draw", target: "sum-line", duration: 0.6, delay: 0.2 },
        ],
      },

      // ─── Step 2: Focus on the ones column ─────────────────────────────
      {
        id: "s2-focus-ones",
        narration: `Start with the ones column. We need to add ${aOnes} and ${bOnes}.`,
        actions: [
          { type: "dim", target: ["a-tens", "b-tens", "lbl-tens"], opacity: 0.2, duration: 0.4 },
          { type: "draw", target: "focus-ones", duration: 0.8, delay: 0.1 },
          { type: "focus", target: ["a-ones", "b-ones"], effect: "pulse", duration: 0.7, delay: 0.3 },
        ],
      },

      // ─── Step 3: Show 7 + 5 = 12 ──────────────────────────────────────
      {
        id: "s3-ones-sum",
        narration: `${aOnes} + ${bOnes} = ${onesSum}. That's more than 9, so we need to regroup.`,
        actions: [
          { type: "reveal", target: "callout-ones-sum", from: "pop", duration: 0.6 },
          { type: "focus", target: "callout-ones-sum", effect: "pulse", duration: 0.6, delay: 0.2 },
        ],
      },

      // ─── Step 4: Carry the 1 ten ──────────────────────────────────────
      {
        id: "s4-carry",
        narration: `${onesSum} is 1 ten and ${onesResult} ones. Carry the 1 to the tens column.`,
        actions: [
          { type: "draw", target: "carry-arrow", duration: 0.8 },
          { type: "reveal", target: ["carry-digit", "carry-label"], from: "top", duration: 0.5, delay: 0.1 },
          { type: "focus", target: "carry-digit", effect: "pulse", duration: 0.6, delay: 0.1 },
        ],
      },

      // ─── Step 5: Write the ones result ────────────────────────────────
      {
        id: "s5-ones-result",
        narration: `Write ${onesResult} in the ones column of the answer.`,
        actions: [
          { type: "dim", target: "callout-ones-sum", opacity: 0.3, duration: 0.3 },
          { type: "reveal", target: "result-ones", from: "bottom", duration: 0.5, delay: 0.1 },
          { type: "focus", target: "result-ones", effect: "pulse", duration: 0.5, delay: 0.1 },
        ],
      },

      // ─── Step 6: Focus on the tens column ─────────────────────────────
      {
        id: "s6-focus-tens",
        narration: `Now the tens column. We have ${aTens} + ${bTens} + ${carry} carried = ${tensResult}.`,
        actions: [
          { type: "dim", target: "focus-ones", opacity: 0.15, duration: 0.3 },
          { type: "dim", target: ["a-ones", "b-ones"], opacity: 0.25, duration: 0.3 },
          { type: "reveal", target: ["a-tens", "b-tens", "lbl-tens"], from: "fade", duration: 0.4 },
          // bring tens back to full opacity
          { type: "dim", target: ["a-tens", "b-tens", "lbl-tens"], opacity: 1, duration: 0.3 },
          { type: "draw", target: "focus-tens", duration: 0.8, delay: 0.2 },
        ],
      },

      // ─── Step 7: Write the tens result ────────────────────────────────
      {
        id: "s7-tens-result",
        narration: `Write ${tensResult} in the tens column.`,
        actions: [
          { type: "reveal", target: "result-tens", from: "bottom", duration: 0.5 },
          { type: "focus", target: "result-tens", effect: "pulse", duration: 0.5, delay: 0.1 },
        ],
      },

      // ─── Step 8: Reveal the final answer ──────────────────────────────
      {
        id: "s8-answer",
        narration: `So ${a} + ${b} = ${sum}. Nice work!`,
        actions: [
          { type: "dim", target: ["focus-ones", "focus-tens", "callout-ones-sum", "carry-arrow"], opacity: 0, duration: 0.4 },
          { type: "reveal", target: "final-answer", from: "pop", duration: 0.7, delay: 0.2 },
          { type: "focus", target: "final-answer", effect: "pulse", duration: 0.6, delay: 0.2 },
        ],
      },
    ],
  };
}
