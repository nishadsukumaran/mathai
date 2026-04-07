/**
 * Greater / Less Than Comparison template.
 *
 * Supports: two whole numbers, each 1–999
 * Visual: side-by-side proportional bars with highlight on larger.
 *
 * 3-act: show both numbers → render bars → highlight winner + symbol
 */

import type { ScenePlan } from "../types";

export function comparisonScene(a: number, b: number): ScenePlan {
  const maxVal = Math.max(a, b);
  const barMaxW = 280;
  const barH = 50;
  const barY = 200;
  const leftX = 120;
  const rightX = 410;

  const barW_A = Math.max(20, (a / maxVal) * barMaxW);
  const barW_B = Math.max(20, (b / maxVal) * barMaxW);

  const symbol = a > b ? ">" : a < b ? "<" : "=";
  const winner = a >= b ? "left" : "right";
  const winColor = "#10b981";
  const normalColor = "#6366f1";
  const dimColor = "#cbd5e1";

  return {
    id: `cmp-${a}-${b}`,
    title: `${a} vs ${b}`,
    topic: "Comparison",
    palette: "ocean",
    duration: 13,
    steps: [
      // Step 1: Show both numbers
      {
        id: "show",
        duration: 2.5,
        narration: `Which is bigger — ${a} or ${b}?`,
        elements: [
          { id: "num-a", type: "mathText", props: { x: leftX + barMaxW / 2, y: 120, text: String(a), fontSize: 40, anchor: "middle" } },
          { id: "vs",    type: "mathText", props: { x: 400, y: 120, text: "vs", fontSize: 18, color: "#94a3b8", anchor: "middle" } },
          { id: "num-b", type: "mathText", props: { x: rightX + barMaxW / 2, y: 120, text: String(b), fontSize: 40, anchor: "middle" } },
        ],
        animations: [
          { target: "num-a", preset: "pop",    delay: 0,   duration: 0.4 },
          { target: "vs",    preset: "fadeIn",  delay: 0.3, duration: 0.3 },
          { target: "num-b", preset: "pop",    delay: 0.5, duration: 0.4 },
        ],
      },
      // Step 2: Render bars
      {
        id: "bars",
        duration: 4,
        narration: `Let's compare their sizes.`,
        elements: [
          { id: "lbl-a", type: "mathText", props: { x: leftX + barMaxW / 2, y: barY - 20, text: String(a), fontSize: 20, anchor: "middle", color: "#64748b" } },
          { id: "bar-a", type: "bar",      props: { x: leftX, y: barY, width: barW_A, height: barH, fill: normalColor, rx: 8 } },
          { id: "lbl-b", type: "mathText", props: { x: rightX + barMaxW / 2, y: barY - 20, text: String(b), fontSize: 20, anchor: "middle", color: "#64748b" } },
          { id: "bar-b", type: "bar",      props: { x: rightX, y: barY, width: barW_B, height: barH, fill: normalColor, rx: 8 } },
        ],
        animations: [
          { target: "lbl-a", preset: "fadeIn",   delay: 0,   duration: 0.3 },
          { target: "bar-a", preset: "slideLeft", delay: 0.3, duration: 0.6 },
          { target: "lbl-b", preset: "fadeIn",   delay: 0.8, duration: 0.3 },
          { target: "bar-b", preset: "slideLeft", delay: 1.1, duration: 0.6 },
        ],
      },
      // Step 3: Highlight winner + show symbol
      {
        id: "answer",
        duration: 3.5,
        narration: a === b ? `They're equal! ${a} = ${b}.` : `${Math.max(a, b)} is bigger! ${a} ${symbol} ${b}.`,
        elements: [
          { id: "bar-a-fin", type: "bar", props: {
            x: leftX, y: barY, width: barW_A, height: barH,
            fill: winner === "left" ? winColor : dimColor, rx: 8,
          }},
          { id: "bar-b-fin", type: "bar", props: {
            x: rightX, y: barY, width: barW_B, height: barH,
            fill: winner === "right" ? winColor : dimColor, rx: 8,
          }},
          { id: "result", type: "mathText", props: {
            x: 400, y: barY + barH + 60,
            text: `${a} ${symbol} ${b}`,
            fontSize: 36, anchor: "middle", fontWeight: "black",
          }},
        ],
        animations: [
          { target: "bar-a-fin", preset: "fadeIn",    delay: 0,   duration: 0.3 },
          { target: "bar-b-fin", preset: "fadeIn",    delay: 0,   duration: 0.3 },
          { target: winner === "left" ? "bar-a-fin" : "bar-b-fin", preset: "highlight", delay: 0.4, duration: 0.8 },
          { target: "result",    preset: "pop",       delay: 1.0, duration: 0.5 },
        ],
      },
    ],
  };
}
