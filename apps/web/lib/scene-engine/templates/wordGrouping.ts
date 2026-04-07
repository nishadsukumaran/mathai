/**
 * Simple Grouped Word Problem template.
 *
 * Supports: groups 2–6, items per group 2–8 (total ≤ 30)
 * Visual: dot groups in outlined containers.
 *
 * 3-act: show problem → build one group → duplicate all → count total
 */

import type { ScenePlan } from "../types";

export function wordGroupingScene(
  groups: number,
  perGroup: number,
  itemLabel: string = "items",
  groupLabel: string = "groups",
): ScenePlan {
  const total = groups * perGroup;
  const dotR = 10;
  const dotGap = 26;
  const groupGap = Math.min(140, 700 / groups);
  const startX = 400 - ((groups - 1) * groupGap) / 2;
  const groupY = 200;
  const groupColors = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981"];

  // Layout dots in a 2-column grid within each group
  const dotsPerRow = 2;
  const groupH = Math.ceil(perGroup / dotsPerRow) * dotGap + 30;
  const groupW = dotsPerRow * dotGap + 20;

  function dotPos(gi: number, di: number): { cx: number; cy: number } {
    const gx = startX + gi * groupGap;
    const col = di % dotsPerRow;
    const row = Math.floor(di / dotsPerRow);
    return {
      cx: gx - (dotsPerRow - 1) * dotGap / 2 + col * dotGap,
      cy: groupY + row * dotGap,
    };
  }

  return {
    id: `wg-${groups}x${perGroup}`,
    title: `${groups} ${groupLabel} of ${perGroup}`,
    topic: "Word Problems",
    palette: "sunset",
    duration: 16,
    steps: [
      // Step 1: Show the problem
      {
        id: "show",
        duration: 3,
        narration: `${groups} ${groupLabel} with ${perGroup} ${itemLabel} in each. How many in total?`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 80, text: `${groups} ${groupLabel} of ${perGroup} ${itemLabel}`, fontSize: 26, anchor: "middle" } },
          { id: "q", type: "mathText", props: { x: 400, y: 120, text: "How many altogether?", fontSize: 16, color: "#64748b", anchor: "middle" } },
        ],
        animations: [
          { target: "title", preset: "fadeIn", delay: 0, duration: 0.4 },
          { target: "q",     preset: "slideUp", delay: 0.3, duration: 0.4 },
        ],
      },
      // Step 2: Build first group
      {
        id: "first-group",
        duration: 3,
        narration: `One ${groupLabel.replace(/s$/, "")} has ${perGroup} ${itemLabel}.`,
        elements: [
          { id: "g0-box", type: "group", props: {
            x: 400 - groupW / 2, y: groupY - 20,
            width: groupW, height: groupH,
            outline: true, outlineColor: groupColors[0], rx: 12,
          }},
          ...Array.from({ length: perGroup }, (_, di) => {
            const pos = dotPos(0, di);
            // Center in the single-group view
            const cx = 400 - (dotsPerRow - 1) * dotGap / 2 + (di % dotsPerRow) * dotGap;
            const cy = groupY + Math.floor(di / dotsPerRow) * dotGap;
            return {
              id: `d0-${di}`,
              type: "dot" as const,
              props: { cx, cy, r: dotR, fill: groupColors[0] },
            };
          }),
          { id: "g0-lbl", type: "mathText", props: {
            x: 400, y: groupY + groupH - 6,
            text: String(perGroup), fontSize: 16, anchor: "middle", color: "#64748b",
          }},
        ],
        animations: [
          { target: "g0-box", preset: "fadeIn", delay: 0, duration: 0.3 },
          ...Array.from({ length: perGroup }, (_, di) => ({
            target: `d0-${di}`, preset: "pop" as const, delay: 0.3 + di * 0.12, duration: 0.25,
          })),
          { target: "g0-lbl", preset: "fadeIn", delay: 0.3 + perGroup * 0.12 + 0.1, duration: 0.3 },
        ],
      },
      // Step 3: Show all groups
      {
        id: "all-groups",
        duration: 5,
        narration: `Now all ${groups} ${groupLabel} — ${perGroup} ${itemLabel} in each.`,
        elements: [
          ...Array.from({ length: groups }, (_, gi) => [
            // Group box
            {
              id: `ga-${gi}`,
              type: "group" as const,
              props: {
                x: startX + gi * groupGap - groupW / 2, y: groupY - 20,
                width: groupW, height: groupH,
                outline: true, outlineColor: groupColors[gi % groupColors.length]!, rx: 12,
              },
            },
            // Dots in group
            ...Array.from({ length: perGroup }, (_, di) => {
              const pos = dotPos(gi, di);
              return {
                id: `da-${gi}-${di}`,
                type: "dot" as const,
                props: { cx: pos.cx, cy: pos.cy, r: dotR, fill: groupColors[gi % groupColors.length]! },
              };
            }),
            // Count label
            {
              id: `gl-${gi}`,
              type: "mathText" as const,
              props: {
                x: startX + gi * groupGap, y: groupY + groupH - 6,
                text: String(perGroup), fontSize: 14, anchor: "middle" as const, color: "#64748b",
              },
            },
          ]).flat(),
        ],
        animations: [
          ...Array.from({ length: groups }, (_, gi) => [
            { target: `ga-${gi}`, preset: "fadeIn" as const, delay: gi * 0.5, duration: 0.3 },
            ...Array.from({ length: perGroup }, (_, di) => ({
              target: `da-${gi}-${di}`, preset: "pop" as const, delay: gi * 0.5 + 0.15 + di * 0.08, duration: 0.2,
            })),
            { target: `gl-${gi}`, preset: "fadeIn" as const, delay: gi * 0.5 + 0.15 + perGroup * 0.08, duration: 0.2 },
          ]).flat(),
        ],
      },
      // Step 4: Count total + multiplication form
      {
        id: "answer",
        duration: 3,
        narration: `${groups} times ${perGroup} equals ${total}!`,
        elements: [
          { id: "mult", type: "mathText", props: {
            x: 400, y: groupY + groupH + 30,
            text: `${groups} x ${perGroup} = ${total}`,
            fontSize: 32, anchor: "middle", fontWeight: "black",
          }},
        ],
        animations: [
          { target: "mult", preset: "pop", delay: 0.3, duration: 0.5 },
        ],
      },
    ],
  };
}
