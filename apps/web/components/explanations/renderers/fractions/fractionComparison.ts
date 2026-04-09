/**
 * @module components/explanations/renderers/fractions/fractionComparison
 *
 * Builds a scene that compares two fractions visually using equal-size
 * rectangles partitioned and shaded to show relative size.
 *
 * Teaching flow:
 *   1. Reveal the question (e.g. "1/2 vs 1/4")
 *   2. Draw two equal-size outlines
 *   3. Partition the first into 2 parts, the second into 4 parts
 *   4. Shade 1 part of each
 *   5. Visually compare the shaded areas
 *   6. Reveal the conclusion (1/2 > 1/4)
 *
 * Accepts any two fractions with the same numerator of 1, denominators 2-8.
 * Future extension: different numerators, LCM-based comparison.
 */

import type { ExplanationScene, VisualElement } from "../../engine/scene-types";

export interface FractionComparisonParams {
  num1:  number;
  den1:  number;
  num2:  number;
  den2:  number;
}

export function buildFractionComparisonScene(
  params: FractionComparisonParams = { num1: 1, den1: 2, num2: 1, den2: 4 },
): ExplanationScene {
  const { num1, den1, num2, den2 } = params;

  // Determine which is larger (assume proper fractions)
  const value1 = num1 / den1;
  const value2 = num2 / den2;
  const comparison =
    value1 > value2 ? "greater" :
    value1 < value2 ? "less" : "equal";
  const comparisonSymbol =
    comparison === "greater" ? ">" :
    comparison === "less"    ? "<" : "=";
  const comparisonWord =
    comparison === "greater" ? "bigger" :
    comparison === "less"    ? "smaller" : "the same as";

  // ─── Layout ──────────────────────────────────────────────────────────
  const W = 800;
  const H = 500;

  // Two equal rectangles, centered with gap between
  const rectW = 260;
  const rectH = 140;
  const rect1X = 100;
  const rect2X = W - 100 - rectW;
  const rectY = 180;

  const elements: VisualElement[] = [];

  // ─── Question (text) ─────────────────────────────────────────────────
  elements.push({
    type: "text",
    id: "question",
    content: `Which is bigger?`,
    x: W / 2,
    y: 60,
    fontSize: 32,
    weight: "bold",
    color: "#1e293b",
  });

  // ─── Fraction labels ─────────────────────────────────────────────────
  elements.push({
    type: "text", id: "frac1-label", content: `${num1}/${den1}`,
    x: rect1X + rectW / 2, y: 130, fontSize: 44, weight: "black", color: "#6366f1",
  });
  elements.push({
    type: "text", id: "frac2-label", content: `${num2}/${den2}`,
    x: rect2X + rectW / 2, y: 130, fontSize: 44, weight: "black", color: "#f59e0b",
  });

  // ─── Rectangle outlines ──────────────────────────────────────────────
  elements.push({
    type: "rect", id: "rect1",
    x: rect1X, y: rectY, width: rectW, height: rectH, rx: 4,
    fill: "transparent", stroke: "#6366f1", strokeWidth: 3,
  });
  elements.push({
    type: "rect", id: "rect2",
    x: rect2X, y: rectY, width: rectW, height: rectH, rx: 4,
    fill: "transparent", stroke: "#f59e0b", strokeWidth: 3,
  });

  // ─── Partition lines for rect1 ───────────────────────────────────────
  // den1 parts → den1-1 vertical lines
  const part1Width = rectW / den1;
  for (let i = 1; i < den1; i++) {
    elements.push({
      type: "line",
      id: `rect1-divider-${i}`,
      x1: rect1X + i * part1Width,
      y1: rectY,
      x2: rect1X + i * part1Width,
      y2: rectY + rectH,
      stroke: "#6366f1",
      strokeWidth: 2,
    });
  }

  // ─── Shaded part for rect1 (first part) ──────────────────────────────
  elements.push({
    type: "rect", id: "rect1-shaded",
    x: rect1X, y: rectY,
    width: part1Width * num1, height: rectH, rx: 0,
    fill: "#6366f1", stroke: "none",
  });

  // ─── Partition lines for rect2 ───────────────────────────────────────
  const part2Width = rectW / den2;
  for (let i = 1; i < den2; i++) {
    elements.push({
      type: "line",
      id: `rect2-divider-${i}`,
      x1: rect2X + i * part2Width,
      y1: rectY,
      x2: rect2X + i * part2Width,
      y2: rectY + rectH,
      stroke: "#f59e0b",
      strokeWidth: 2,
    });
  }

  // ─── Shaded part for rect2 ────────────────────────────────────────────
  elements.push({
    type: "rect", id: "rect2-shaded",
    x: rect2X, y: rectY,
    width: part2Width * num2, height: rectH, rx: 0,
    fill: "#f59e0b", stroke: "none",
  });

  // ─── Comparison symbol (big centered glyph) ───────────────────────────
  elements.push({
    type: "text", id: "compare-symbol", content: comparisonSymbol,
    x: W / 2, y: rectY + rectH / 2, fontSize: 72, weight: "black", color: "#10b981",
  });

  // ─── Final answer banner ──────────────────────────────────────────────
  elements.push({
    type: "text", id: "final-answer",
    content: `${num1}/${den1} is ${comparisonWord} ${num2}/${den2}`,
    x: W / 2, y: 430, fontSize: 32, weight: "black", color: "#10b981",
  });

  // ─── Steps ────────────────────────────────────────────────────────────
  const partitionActions1 = [];
  for (let i = 1; i < den1; i++) {
    partitionActions1.push({
      type: "draw" as const,
      target: `rect1-divider-${i}`,
      duration: 0.4,
      delay: 0.05,
    });
  }
  const partitionActions2 = [];
  for (let i = 1; i < den2; i++) {
    partitionActions2.push({
      type: "draw" as const,
      target: `rect2-divider-${i}`,
      duration: 0.4,
      delay: 0.05,
    });
  }

  return {
    id:    `fraction-comparison-${num1}-${den1}-vs-${num2}-${den2}`,
    title: `${num1}/${den1} vs ${num2}/${den2}`,
    topic: "Fractions",
    viewBox: { width: W, height: H },

    elements,

    steps: [
      // Step 1: Reveal question and fractions
      {
        id: "s1-question",
        narration: `Which is bigger: ${num1}/${den1} or ${num2}/${den2}? Let's draw them to find out.`,
        actions: [
          { type: "reveal", target: "question", from: "top", duration: 0.5 },
          { type: "reveal", target: ["frac1-label", "frac2-label"], from: "pop", duration: 0.5, delay: 0.2 },
        ],
      },

      // Step 2: Draw equal rectangles
      {
        id: "s2-rectangles",
        narration: `We'll start with two rectangles of the same size. They both represent one whole.`,
        actions: [
          { type: "draw", target: "rect1", duration: 0.8 },
          { type: "draw", target: "rect2", duration: 0.8, delay: 0 },
        ],
      },

      // Step 3: Partition rect1 into den1 parts
      {
        id: "s3-partition-1",
        narration: `Divide the first into ${den1} equal ${den1 === 2 ? "halves" : "parts"}.`,
        actions: partitionActions1,
      },

      // Step 4: Partition rect2 into den2 parts
      {
        id: "s4-partition-2",
        narration: `Divide the second into ${den2} equal parts. Notice the parts are smaller.`,
        actions: partitionActions2,
      },

      // Step 5: Shade the fractions
      {
        id: "s5-shade",
        narration: `Shade ${num1} part${num1 !== 1 ? "s" : ""} of the first and ${num2} part${num2 !== 1 ? "s" : ""} of the second.`,
        actions: [
          { type: "reveal", target: "rect1-shaded", from: "left", duration: 0.6 },
          { type: "reveal", target: "rect2-shaded", from: "left", duration: 0.6, delay: 0.1 },
          { type: "focus", target: ["rect1-shaded", "rect2-shaded"], effect: "pulse", duration: 0.6, delay: 0.2 },
        ],
      },

      // Step 6: Compare and reveal answer
      {
        id: "s6-conclude",
        narration: `The shaded ${num1}/${den1} is ${comparisonWord} the shaded ${num2}/${den2}. So ${num1}/${den1} ${comparisonSymbol} ${num2}/${den2}.`,
        actions: [
          { type: "reveal", target: "compare-symbol", from: "pop", duration: 0.6 },
          { type: "focus", target: "compare-symbol", effect: "pulse", duration: 0.6, delay: 0.1 },
          { type: "reveal", target: "final-answer", from: "bottom", duration: 0.6, delay: 0.2 },
        ],
      },
    ],
  };
}
