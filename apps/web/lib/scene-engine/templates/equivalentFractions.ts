/**
 * Equivalent Fractions template — shows one fraction equals another.
 *
 * Supports: denominators 2–12, multiplier 2–6
 * Visual: same bar re-split to show equivalence.
 *
 * 3-act: show original → split bar → re-split with multiplier → equivalence
 */

import type { ScenePlan } from "../types";

export function equivalentFractionsScene(
  n1: number, d1: number,
  n2: number, d2: number,
): ScenePlan {
  const barW = 400;
  const barH = 50;
  const barX = 400 - barW / 2;
  const barY1 = 160;
  const barY2 = 280;

  return {
    id: `equiv-${n1}${d1}-${n2}${d2}`,
    title: `${n1}/${d1} = ${n2}/${d2}`,
    topic: "Equivalent Fractions",
    palette: "candy",
    duration: 15,
    steps: [
      // Step 1: Show the question
      {
        id: "show",
        duration: 2.5,
        narration: `Is ${n1}/${d1} the same as ${n2}/${d2}? Let's find out!`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 80, text: `${n1}/${d1}  =  ${n2}/${d2} ?`, fontSize: 34, anchor: "middle" } },
        ],
        animations: [
          { target: "title", preset: "pop", delay: 0, duration: 0.5 },
        ],
      },
      // Step 2: Draw the first fraction bar
      {
        id: "first-bar",
        duration: 3.5,
        narration: `Here's ${n1}/${d1} — ${n1} out of ${d1} parts.`,
        elements: [
          { id: "lbl1", type: "mathText", props: { x: 400, y: barY1 - 20, text: `${n1}/${d1}`, fontSize: 22, anchor: "middle", color: "#a855f7" } },
          { id: "bar1", type: "bar", props: { x: barX, y: barY1, width: barW, height: barH, fill: "#e9d5ff", divisions: d1, filledDivisions: n1, rx: 6 } },
          { id: "desc1", type: "mathText", props: { x: 400, y: barY1 + barH + 20, text: `${n1} of ${d1} parts shaded`, fontSize: 14, anchor: "middle", color: "#64748b" } },
        ],
        animations: [
          { target: "lbl1",  preset: "fadeIn",    delay: 0,   duration: 0.3 },
          { target: "bar1",  preset: "slideLeft", delay: 0.3, duration: 0.6 },
          { target: "desc1", preset: "fadeIn",    delay: 0.8, duration: 0.3 },
        ],
      },
      // Step 3: Draw the second fraction bar (same width, different divisions)
      {
        id: "second-bar",
        duration: 3.5,
        narration: `Now ${n2}/${d2} — ${n2} out of ${d2} parts.`,
        elements: [
          { id: "bar1-keep", type: "bar", props: { x: barX, y: barY1, width: barW, height: barH, fill: "#e9d5ff", divisions: d1, filledDivisions: n1, rx: 6 } },
          { id: "lbl1-k",   type: "mathText", props: { x: 400, y: barY1 - 20, text: `${n1}/${d1}`, fontSize: 22, anchor: "middle", color: "#a855f7" } },
          { id: "lbl2",     type: "mathText", props: { x: 400, y: barY2 - 20, text: `${n2}/${d2}`, fontSize: 22, anchor: "middle", color: "#f43f5e" } },
          { id: "bar2",     type: "bar", props: { x: barX, y: barY2, width: barW, height: barH, fill: "#fce7f3", divisions: d2, filledDivisions: n2, rx: 6 } },
          { id: "desc2",    type: "mathText", props: { x: 400, y: barY2 + barH + 20, text: `${n2} of ${d2} parts shaded`, fontSize: 14, anchor: "middle", color: "#64748b" } },
        ],
        animations: [
          { target: "bar1-keep", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "lbl1-k",   preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "lbl2",  preset: "fadeIn",    delay: 0.2, duration: 0.3 },
          { target: "bar2",  preset: "slideLeft", delay: 0.4, duration: 0.6 },
          { target: "desc2", preset: "fadeIn",    delay: 1.0, duration: 0.3 },
        ],
      },
      // Step 4: Highlight both — same shaded area = equal!
      {
        id: "answer",
        duration: 3,
        narration: `Same amount shaded! ${n1}/${d1} = ${n2}/${d2}.`,
        elements: [
          { id: "bar1-fin", type: "bar", props: { x: barX, y: barY1, width: barW, height: barH, fill: "#dcfce7", divisions: d1, filledDivisions: n1, rx: 6 } },
          { id: "bar2-fin", type: "bar", props: { x: barX, y: barY2, width: barW, height: barH, fill: "#dcfce7", divisions: d2, filledDivisions: n2, rx: 6 } },
          { id: "equals",   type: "mathText", props: { x: 400, y: (barY1 + barH + barY2) / 2 + 5, text: "=", fontSize: 30, anchor: "middle", color: "#10b981" } },
          { id: "result",   type: "mathText", props: { x: 400, y: barY2 + barH + 55, text: `${n1}/${d1} = ${n2}/${d2}`, fontSize: 30, anchor: "middle", fontWeight: "black" } },
        ],
        animations: [
          { target: "bar1-fin", preset: "fadeIn",    delay: 0,   duration: 0.2 },
          { target: "bar2-fin", preset: "fadeIn",    delay: 0,   duration: 0.2 },
          { target: "equals",   preset: "pop",       delay: 0.3, duration: 0.4 },
          { target: "bar1-fin", preset: "highlight",  delay: 0.5, duration: 0.8 },
          { target: "bar2-fin", preset: "highlight",  delay: 0.5, duration: 0.8 },
          { target: "result",   preset: "pop",       delay: 1.2, duration: 0.5 },
        ],
      },
    ],
  };
}
