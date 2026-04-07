/**
 * Fraction Comparison template — compares two fractions visually.
 *
 * Supports: denominators 2–12
 * Visual: two equal-width bars divided differently, shaded portions compared.
 *
 * 3-act: show fractions → draw bars → highlight larger + symbol
 */

import type { ScenePlan } from "../types";

export function fractionComparisonScene(
  n1: number, d1: number,
  n2: number, d2: number,
): ScenePlan {
  const val1 = n1 / d1;
  const val2 = n2 / d2;
  const symbol = val1 > val2 ? ">" : val1 < val2 ? "<" : "=";
  const winIdx = val1 >= val2 ? 0 : 1;

  const barW = 340;
  const barH = 50;
  const barX = 400 - barW / 2;
  const barY1 = 170;
  const barY2 = 270;

  const winColor = "#10b981";
  const dimColor = "#e2e8f0";
  const fill1 = "#dbeafe";
  const fill2 = "#fce7f3";

  return {
    id: `frac-cmp-${n1}${d1}-${n2}${d2}`,
    title: `${n1}/${d1} vs ${n2}/${d2}`,
    topic: "Fraction Comparison",
    palette: "forest",
    duration: 14,
    steps: [
      // Step 1: Show both fractions
      {
        id: "show",
        duration: 2.5,
        narration: `Which is bigger — ${n1}/${d1} or ${n2}/${d2}?`,
        elements: [
          { id: "f1", type: "mathText", props: { x: 280, y: 100, text: `${n1}/${d1}`, fontSize: 36, anchor: "middle" } },
          { id: "vs", type: "mathText", props: { x: 400, y: 100, text: "vs", fontSize: 18, color: "#94a3b8", anchor: "middle" } },
          { id: "f2", type: "mathText", props: { x: 520, y: 100, text: `${n2}/${d2}`, fontSize: 36, anchor: "middle" } },
        ],
        animations: [
          { target: "f1", preset: "pop",    delay: 0,   duration: 0.4 },
          { target: "vs", preset: "fadeIn",  delay: 0.3, duration: 0.3 },
          { target: "f2", preset: "pop",    delay: 0.5, duration: 0.4 },
        ],
      },
      // Step 2: Draw first bar
      {
        id: "bar1",
        duration: 3,
        narration: `${n1} out of ${d1} parts shaded.`,
        elements: [
          { id: "lbl1", type: "mathText", props: { x: barX - 10, y: barY1 + barH / 2 + 5, text: `${n1}/${d1}`, fontSize: 16, anchor: "end", color: "#64748b" } },
          { id: "b1",   type: "bar",      props: { x: barX, y: barY1, width: barW, height: barH, fill: fill1, divisions: d1, filledDivisions: n1, rx: 6 } },
        ],
        animations: [
          { target: "lbl1", preset: "fadeIn",    delay: 0,   duration: 0.3 },
          { target: "b1",   preset: "slideLeft", delay: 0.3, duration: 0.6 },
        ],
      },
      // Step 3: Draw second bar
      {
        id: "bar2",
        duration: 3,
        narration: `${n2} out of ${d2} parts shaded.`,
        elements: [
          { id: "b1-keep", type: "bar",      props: { x: barX, y: barY1, width: barW, height: barH, fill: fill1, divisions: d1, filledDivisions: n1, rx: 6 } },
          { id: "lbl1-k",  type: "mathText", props: { x: barX - 10, y: barY1 + barH / 2 + 5, text: `${n1}/${d1}`, fontSize: 16, anchor: "end", color: "#64748b" } },
          { id: "lbl2",    type: "mathText", props: { x: barX - 10, y: barY2 + barH / 2 + 5, text: `${n2}/${d2}`, fontSize: 16, anchor: "end", color: "#64748b" } },
          { id: "b2",      type: "bar",      props: { x: barX, y: barY2, width: barW, height: barH, fill: fill2, divisions: d2, filledDivisions: n2, rx: 6 } },
        ],
        animations: [
          { target: "b1-keep", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "lbl1-k",  preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "lbl2",    preset: "fadeIn",    delay: 0.2, duration: 0.3 },
          { target: "b2",      preset: "slideLeft", delay: 0.4, duration: 0.6 },
        ],
      },
      // Step 4: Highlight winner + answer
      {
        id: "answer",
        duration: 3,
        narration: val1 === val2
          ? `They're equal! ${n1}/${d1} = ${n2}/${d2}.`
          : `${winIdx === 0 ? `${n1}/${d1}` : `${n2}/${d2}`} is bigger!`,
        elements: [
          { id: "b1-fin", type: "bar", props: {
            x: barX, y: barY1, width: barW, height: barH,
            fill: winIdx === 0 ? "#dcfce7" : dimColor, divisions: d1, filledDivisions: n1, rx: 6,
          }},
          { id: "b2-fin", type: "bar", props: {
            x: barX, y: barY2, width: barW, height: barH,
            fill: winIdx === 1 ? "#dcfce7" : dimColor, divisions: d2, filledDivisions: n2, rx: 6,
          }},
          { id: "result", type: "mathText", props: {
            x: 400, y: barY2 + barH + 50,
            text: `${n1}/${d1} ${symbol} ${n2}/${d2}`,
            fontSize: 30, anchor: "middle", fontWeight: "black",
          }},
        ],
        animations: [
          { target: "b1-fin", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "b2-fin", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: winIdx === 0 ? "b1-fin" : "b2-fin", preset: "highlight", delay: 0.3, duration: 0.8 },
          { target: "result", preset: "pop", delay: 1.0, duration: 0.5 },
        ],
      },
    ],
  };
}
