/**
 * Place Value template — breaks a number into tens and ones blocks.
 *
 * Supports: 10–999 (1-digit shows as ones only, 4-digit too cluttered)
 * Visual: grouped bar blocks for hundreds/tens, individual dots for ones.
 *
 * 3-act: show number → split into groups → label + reveal sum
 */

import type { ScenePlan } from "../types";

export function placeValueScene(num: number): ScenePlan {
  const hundreds = Math.floor(num / 100);
  const tens     = Math.floor((num % 100) / 10);
  const ones     = num % 10;

  const cols: { label: string; count: number; color: string; x: number }[] = [];
  let colIdx = 0;

  if (hundreds > 0) cols.push({ label: "Hundreds", count: hundreds, color: "#6366f1", x: 0 });
  if (tens > 0)     cols.push({ label: "Tens",     count: tens,     color: "#06b6d4", x: 0 });
  if (ones > 0)     cols.push({ label: "Ones",     count: ones,     color: "#f59e0b", x: 0 });

  // Center columns
  const colW = 140;
  const totalW = cols.length * colW;
  const startX = 400 - totalW / 2 + colW / 2;
  for (const c of cols) { c.x = startX + colIdx * colW; colIdx++; }

  const blockH = 28;
  const blockGap = 6;
  const blockY = 180;

  // Build expression parts
  const parts: string[] = [];
  if (hundreds > 0) parts.push(`${hundreds * 100}`);
  if (tens > 0)     parts.push(`${tens * 10}`);
  if (ones > 0)     parts.push(`${ones}`);
  const expression = parts.join(" + ");

  return {
    id: `pv-${num}`,
    title: `Place value of ${num}`,
    topic: "Place Value",
    palette: "ocean",
    duration: 14,
    steps: [
      // Step 1: Show the number
      {
        id: "show",
        duration: 2.5,
        narration: `Let's break down the number ${num}.`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 80, text: String(num), fontSize: 48, anchor: "middle" } },
        ],
        animations: [
          { target: "title", preset: "pop", delay: 0, duration: 0.5 },
        ],
      },
      // Step 2: Show columns with blocks
      {
        id: "blocks",
        duration: 5,
        narration: cols.map((c) => `${c.count} ${c.label.toLowerCase()}`).join(", ") + ".",
        elements: [
          { id: "title-sm", type: "mathText", props: { x: 400, y: 60, text: String(num), fontSize: 30, anchor: "middle", color: "#94a3b8" } },
          ...cols.flatMap((col) => [
            // Column label
            { id: `lbl-${col.label}`, type: "mathText" as const, props: {
              x: col.x, y: blockY - 30,
              text: col.label, fontSize: 14, color: "#64748b", anchor: "middle" as const,
            }},
            // Stacked blocks
            ...Array.from({ length: col.count }, (_, i) => ({
              id: `blk-${col.label}-${i}`,
              type: "bar" as const,
              props: {
                x: col.x - 30, y: blockY + i * (blockH + blockGap),
                width: 60, height: blockH,
                fill: col.color, rx: 6,
              },
            })),
            // Value label below blocks
            { id: `val-${col.label}`, type: "mathText" as const, props: {
              x: col.x,
              y: blockY + col.count * (blockH + blockGap) + 16,
              text: col.label === "Hundreds" ? `${col.count * 100}` : col.label === "Tens" ? `${col.count * 10}` : `${col.count}`,
              fontSize: 20, anchor: "middle" as const, fontWeight: "bold" as const,
            }},
          ]),
        ],
        animations: [
          { target: "title-sm", preset: "fadeIn", delay: 0, duration: 0.3 },
          ...cols.flatMap((col, ci) => [
            { target: `lbl-${col.label}`, preset: "fadeIn" as const, delay: 0.3 + ci * 1.2, duration: 0.3 },
            ...Array.from({ length: col.count }, (_, i) => ({
              target: `blk-${col.label}-${i}`,
              preset: "slideUp" as const,
              delay: 0.5 + ci * 1.2 + i * 0.15,
              duration: 0.3,
            })),
            { target: `val-${col.label}`, preset: "fadeIn" as const, delay: 0.5 + ci * 1.2 + col.count * 0.15 + 0.2, duration: 0.3 },
          ]),
        ],
      },
      // Step 3: Reveal sum
      {
        id: "answer",
        duration: 3,
        narration: `${expression} = ${num}. Great job!`,
        elements: [
          { id: "result", type: "mathText", props: { x: 400, y: 250, text: `${expression} = ${num}`, fontSize: 30, anchor: "middle", fontWeight: "black" } },
        ],
        animations: [
          { target: "result", preset: "pop", delay: 0.3, duration: 0.5 },
        ],
      },
    ],
  };
}
