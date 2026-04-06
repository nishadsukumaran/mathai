/**
 * @module lib/scene-engine/templates
 *
 * Example scene plans for common K-8 math concepts.
 * These serve three purposes:
 *   1. Reference for the AI prompt (few-shot examples)
 *   2. Fallback templates when AI generation fails
 *   3. Test fixtures for the renderer
 *
 * Each template is a pure function that accepts the specific math values
 * and returns a complete ScenePlan.
 */

import type { ScenePlan } from "./types";

// ═════════════════════════════════════════════════════════════════════════════
// 1. Multiplication Array (e.g., 3 x 4 = 12)
// ═════════════════════════════════════════════════════════════════════════════

export function multiplicationArray(a: number, b: number): ScenePlan {
  const product = a * b;
  const dotR = 14;
  const gap = 42;
  const startX = 400 - ((b - 1) * gap) / 2;
  const startY = 180 - ((a - 1) * gap) / 2;

  // Build dots for each row
  const allDots = Array.from({ length: a }, (_, row) =>
    Array.from({ length: b }, (_, col) => ({
      id: `dot-${row}-${col}`,
      type: "dot" as const,
      props: {
        cx: startX + col * gap,
        cy: startY + row * gap,
        r: dotR,
        fill: "#6366f1",
      },
    }))
  );

  return {
    id: `mult-${a}x${b}`,
    title: `${a} x ${b} = ?`,
    topic: "Multiplication",
    palette: "ocean",
    duration: 12,
    steps: [
      // Step 1: Show the question
      {
        id: "question",
        duration: 2.5,
        narration: `Let's figure out ${a} times ${b}.`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 60, text: `${a} x ${b} = ?`, fontSize: 36, anchor: "middle" } },
        ],
        animations: [
          { target: "title", preset: "pop", delay: 0, duration: 0.5 },
        ],
      },
      // Step 2: Build rows one at a time
      {
        id: "build-array",
        duration: 4,
        narration: `We make ${a} rows with ${b} dots in each row.`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 60, text: `${a} x ${b}`, fontSize: 30, anchor: "middle" } },
          { id: "row-label", type: "mathText", props: { x: 400, y: 120, text: `${a} rows of ${b}`, fontSize: 18, color: "#64748b", anchor: "middle" } },
          ...allDots.flat(),
        ],
        animations: [
          { target: "title", preset: "fadeIn", delay: 0, duration: 0.3 },
          { target: "row-label", preset: "slideUp", delay: 0.2, duration: 0.4 },
          ...allDots.flatMap((row, ri) =>
            row.map((dot, ci) => ({
              target: dot.id,
              preset: "pop" as const,
              delay: 0.4 + ri * 0.6 + ci * 0.1,
              duration: 0.3,
            }))
          ),
        ],
      },
      // Step 3: Count and reveal answer
      {
        id: "answer",
        duration: 3,
        narration: `Count them all up - ${a} times ${b} equals ${product}!`,
        elements: [
          ...allDots.flat(),
          { id: "brace", type: "brace", props: {
            x: startX - dotR - 10, y: startY - dotR - 10,
            width: (b - 1) * gap + dotR * 2 + 20,
            height: (a - 1) * gap + dotR * 2 + 20,
            side: "bottom", label: `= ${product}`,
          }},
          { id: "result", type: "mathText", props: { x: 400, y: startY + (a - 1) * gap + 80, text: `${a} x ${b} = ${product}`, fontSize: 32, anchor: "middle", fontWeight: "black" } },
        ],
        animations: [
          ...allDots.flat().map((d) => ({ target: d.id, preset: "fadeIn" as const, delay: 0, duration: 0.2 })),
          { target: "brace", preset: "draw", delay: 0.3, duration: 0.8 },
          { target: "result", preset: "pop", delay: 1.2, duration: 0.5 },
        ],
      },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. Subtraction on Number Line (e.g., 8 - 3 = 5)
// ═════════════════════════════════════════════════════════════════════════════

export function subtractionNumberLine(a: number, b: number): ScenePlan {
  const result = a - b;
  const lineMin = 0;
  const lineMax = Math.max(a + 2, 10);

  return {
    id: `sub-${a}-${b}`,
    title: `${a} - ${b} = ?`,
    topic: "Subtraction",
    palette: "sunset",
    duration: 14,
    steps: [
      // Step 1: Show the number line
      {
        id: "setup",
        duration: 3,
        narration: `Let's use a number line to solve ${a} minus ${b}.`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 50, text: `${a} - ${b} = ?`, fontSize: 34, anchor: "middle" } },
          { id: "nline", type: "numberLine", props: {
            x1: 80, y1: 260, x2: 720,
            min: lineMin, max: lineMax, step: 1,
          }},
        ],
        animations: [
          { target: "title", preset: "fadeIn", delay: 0, duration: 0.5 },
          { target: "nline", preset: "draw", delay: 0.3, duration: 1.0 },
        ],
      },
      // Step 2: Start at `a`
      {
        id: "start",
        duration: 3,
        narration: `Start at ${a}.`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 50, text: `${a} - ${b} = ?`, fontSize: 34, anchor: "middle" } },
          { id: "nline", type: "numberLine", props: {
            x1: 80, y1: 260, x2: 720,
            min: lineMin, max: lineMax, step: 1,
            markers: [{ value: a, label: `Start: ${a}`, color: "#f97316" }],
          }},
          { id: "finger", type: "dot", props: { cx: 80 + (a / lineMax) * 640, cy: 240, r: 10, fill: "#f97316" } },
        ],
        animations: [
          { target: "title", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "nline", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "finger", preset: "pop", delay: 0.3, duration: 0.4 },
        ],
      },
      // Step 3: Hop back `b` times
      {
        id: "hops",
        duration: 4,
        narration: `Jump back ${b} spaces.`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 50, text: `${a} - ${b}`, fontSize: 34, anchor: "middle" } },
          { id: "nline", type: "numberLine", props: {
            x1: 80, y1: 260, x2: 720,
            min: lineMin, max: lineMax, step: 1,
            markers: [
              { value: a, label: String(a), color: "#f97316" },
              { value: result, label: String(result), color: "#ec4899" },
            ],
            hops: Array.from({ length: b }, (_, i) => ({
              from: a - i, to: a - i - 1,
              label: i === 0 ? `-${b}` : undefined,
              color: "#ec4899",
            })),
          }},
        ],
        animations: [
          { target: "title", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "nline", preset: "fadeIn", delay: 0, duration: 0.3 },
        ],
      },
      // Step 4: Reveal answer
      {
        id: "answer",
        duration: 3,
        narration: `We land on ${result}. So ${a} minus ${b} equals ${result}!`,
        elements: [
          { id: "nline", type: "numberLine", props: {
            x1: 80, y1: 260, x2: 720,
            min: lineMin, max: lineMax, step: 1,
            markers: [{ value: result, label: `${result}`, color: "#ec4899" }],
          }},
          { id: "result", type: "mathText", props: { x: 400, y: 380, text: `${a} - ${b} = ${result}`, fontSize: 36, anchor: "middle", fontWeight: "black" } },
        ],
        animations: [
          { target: "nline", preset: "fadeIn", delay: 0, duration: 0.3 },
          { target: "result", preset: "pop", delay: 0.5, duration: 0.5 },
        ],
      },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. Fractions with Bars (e.g., 3/4 + 1/4 = 4/4 = 1)
// ═════════════════════════════════════════════════════════════════════════════

export function fractionBars(
  num1: number, den1: number,
  num2: number, den2: number
): ScenePlan {
  const resultNum = num1 + num2;
  const simplified = resultNum === den1 ? "1" : `${resultNum}/${den1}`;
  const barW = 400, barH = 50, barX = 200, gap = 20;

  return {
    id: `frac-${num1}-${den1}-${num2}-${den2}`,
    title: `${num1}/${den1} + ${num2}/${den2} = ?`,
    topic: "Fractions",
    palette: "forest",
    duration: 15,
    steps: [
      // Step 1: Show first fraction bar
      {
        id: "first",
        duration: 3.5,
        narration: `This bar shows ${num1} out of ${den1} parts shaded.`,
        elements: [
          { id: "label1", type: "mathText", props: { x: 400, y: 60, text: `${num1}/${den1}`, fontSize: 32, anchor: "middle" } },
          { id: "bar1", type: "bar", props: { x: barX, y: 120, width: barW, height: barH, fill: "#d1fae5", divisions: den1, filledDivisions: num1, rx: 6 } },
          { id: "desc1", type: "mathText", props: { x: 400, y: 200, text: `${num1} of ${den1} parts`, fontSize: 16, color: "#64748b", anchor: "middle" } },
        ],
        animations: [
          { target: "label1", preset: "fadeIn", delay: 0, duration: 0.4 },
          { target: "bar1", preset: "slideLeft", delay: 0.3, duration: 0.6 },
          { target: "desc1", preset: "fadeIn", delay: 0.8, duration: 0.4 },
        ],
      },
      // Step 2: Show second fraction bar
      {
        id: "second",
        duration: 3.5,
        narration: `Now add ${num2} out of ${den2} more parts.`,
        elements: [
          { id: "bar1", type: "bar", props: { x: barX, y: 120, width: barW, height: barH, fill: "#d1fae5", divisions: den1, filledDivisions: num1, rx: 6 } },
          { id: "plus", type: "mathText", props: { x: 400, y: 200, text: "+", fontSize: 28, anchor: "middle" } },
          { id: "label2", type: "mathText", props: { x: 400, y: 230, text: `${num2}/${den2}`, fontSize: 32, anchor: "middle" } },
          { id: "bar2", type: "bar", props: { x: barX, y: 260, width: barW, height: barH, fill: "#dbeafe", divisions: den2, filledDivisions: num2, rx: 6 } },
        ],
        animations: [
          { target: "bar1", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "plus", preset: "pop", delay: 0.2, duration: 0.3 },
          { target: "label2", preset: "fadeIn", delay: 0.3, duration: 0.4 },
          { target: "bar2", preset: "slideLeft", delay: 0.5, duration: 0.6 },
        ],
      },
      // Step 3: Combine into result bar
      {
        id: "combine",
        duration: 4,
        narration: `Together, ${num1} plus ${num2} gives us ${resultNum} parts out of ${den1}.`,
        elements: [
          { id: "bar1", type: "bar", props: { x: barX, y: 120, width: barW, height: barH, fill: "#d1fae5", divisions: den1, filledDivisions: num1, rx: 6 } },
          { id: "bar2", type: "bar", props: { x: barX, y: 180 + gap, width: barW, height: barH, fill: "#dbeafe", divisions: den2, filledDivisions: num2, rx: 6 } },
          { id: "equals", type: "mathText", props: { x: 400, y: 290, text: "=", fontSize: 28, anchor: "middle" } },
          { id: "result-bar", type: "bar", props: { x: barX, y: 310, width: barW, height: barH, fill: "#dcfce7", divisions: den1, filledDivisions: resultNum, rx: 6 } },
          { id: "result", type: "mathText", props: { x: 400, y: 400, text: `${num1}/${den1} + ${num2}/${den2} = ${simplified}`, fontSize: 28, anchor: "middle", fontWeight: "black" } },
        ],
        animations: [
          { target: "bar1", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "bar2", preset: "fadeIn", delay: 0, duration: 0.2 },
          { target: "equals", preset: "pop", delay: 0.3, duration: 0.3 },
          { target: "result-bar", preset: "slideUp", delay: 0.6, duration: 0.6 },
          { target: "result", preset: "pop", delay: 1.4, duration: 0.5 },
        ],
      },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. Division with Groups (e.g., 12 / 3 = 4)
// ═════════════════════════════════════════════════════════════════════════════

export function divisionGroups(total: number, divisor: number): ScenePlan {
  const perGroup = total / divisor;
  const dotR = 10;
  const groupGap = 160;
  const dotGap = 28;
  const groupStartX = 400 - ((divisor - 1) * groupGap) / 2;

  // All dots (ungrouped initially, then grouped)
  const ungrouped = Array.from({ length: total }, (_, i) => ({
    id: `dot-${i}`,
    type: "dot" as const,
    props: {
      cx: 120 + (i % 6) * dotGap,
      cy: 160 + Math.floor(i / 6) * dotGap,
      r: dotR, fill: "#6366f1",
    },
  }));

  const grouped = Array.from({ length: divisor }, (_, g) =>
    Array.from({ length: perGroup }, (_, d) => ({
      id: `dot-${g * perGroup + d}`,
      type: "dot" as const,
      props: {
        cx: groupStartX + g * groupGap + (d % 2) * dotGap,
        cy: 200 + Math.floor(d / 2) * dotGap,
        r: dotR, fill: ["#6366f1", "#06b6d4", "#f59e0b"][g % 3],
      },
    }))
  );

  const groupBoxes = Array.from({ length: divisor }, (_, g) => ({
    id: `group-${g}`,
    type: "group" as const,
    props: {
      x: groupStartX + g * groupGap - 24,
      y: 175,
      width: dotGap + 48, height: Math.ceil(perGroup / 2) * dotGap + 30,
      outline: true,
      outlineColor: ["#6366f1", "#06b6d4", "#f59e0b"][g % 3],
      rx: 12,
    },
  }));

  return {
    id: `div-${total}-${divisor}`,
    title: `${total} / ${divisor} = ?`,
    topic: "Division",
    palette: "ocean",
    duration: 14,
    steps: [
      {
        id: "show-all",
        duration: 3,
        narration: `We have ${total} dots. Let's split them into ${divisor} equal groups.`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 60, text: `${total} / ${divisor} = ?`, fontSize: 34, anchor: "middle" } },
          ...ungrouped,
        ],
        animations: [
          { target: "title", preset: "fadeIn", delay: 0, duration: 0.4 },
          ...ungrouped.map((d, i) => ({ target: d.id, preset: "pop" as const, delay: 0.3 + i * 0.04, duration: 0.25 })),
        ],
      },
      {
        id: "sort-groups",
        duration: 5,
        narration: `Share them equally: ${perGroup} dots in each group.`,
        elements: [
          { id: "title", type: "mathText", props: { x: 400, y: 60, text: `${total} / ${divisor}`, fontSize: 30, anchor: "middle" } },
          ...groupBoxes,
          ...grouped.flat(),
          ...Array.from({ length: divisor }, (_, g) => ({
            id: `glabel-${g}`,
            type: "mathText" as const,
            props: {
              x: groupStartX + g * groupGap,
              y: 175 + Math.ceil(perGroup / 2) * dotGap + 45,
              text: `${perGroup}`, fontSize: 20, anchor: "middle" as const, color: "#64748b",
            },
          })),
        ],
        animations: [
          { target: "title", preset: "fadeIn", delay: 0, duration: 0.2 },
          ...groupBoxes.map((g, i) => ({ target: g.id, preset: "fadeIn" as const, delay: 0.2 + i * 0.4, duration: 0.5 })),
          ...grouped.flatMap((group, gi) =>
            group.map((d, di) => ({ target: d.id, preset: "pop" as const, delay: 0.5 + gi * 0.4 + di * 0.1, duration: 0.3 }))
          ),
          ...Array.from({ length: divisor }, (_, g) => ({ target: `glabel-${g}`, preset: "slideUp" as const, delay: 1 + g * 0.4, duration: 0.3 })),
        ],
      },
      {
        id: "answer",
        duration: 3,
        narration: `Each group has ${perGroup}. So ${total} divided by ${divisor} equals ${perGroup}!`,
        elements: [
          ...groupBoxes,
          ...grouped.flat(),
          { id: "result", type: "mathText", props: { x: 400, y: 420, text: `${total} / ${divisor} = ${perGroup}`, fontSize: 34, anchor: "middle", fontWeight: "black" } },
        ],
        animations: [
          ...groupBoxes.map((g) => ({ target: g.id, preset: "fadeIn" as const, delay: 0, duration: 0.2 })),
          ...grouped.flat().map((d) => ({ target: d.id, preset: "fadeIn" as const, delay: 0, duration: 0.2 })),
          { target: "result", preset: "pop", delay: 0.5, duration: 0.5 },
        ],
      },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. Whiteboard Equation Solving (e.g., x + 5 = 12)
// ═════════════════════════════════════════════════════════════════════════════

export function equationSolving(
  variable: string,
  constant: number,
  total: number,
  op: "+" | "-" = "+"
): ScenePlan {
  const answer = op === "+" ? total - constant : total + constant;
  const lineY = (i: number) => 120 + i * 70;

  return {
    id: `eq-${variable}-${op}-${constant}-${total}`,
    title: `Solve: ${variable} ${op} ${constant} = ${total}`,
    topic: "Equations",
    palette: "candy",
    duration: 16,
    steps: [
      // Step 1: Show the equation
      {
        id: "show",
        duration: 3,
        narration: `We need to find what ${variable} equals.`,
        elements: [
          { id: "eq", type: "mathText", props: { x: 400, y: lineY(0), text: `${variable} ${op} ${constant} = ${total}`, fontSize: 36, anchor: "middle" } },
          { id: "goal", type: "mathText", props: { x: 400, y: lineY(0) + 40, text: `Find ${variable}`, fontSize: 16, color: "#8b5cf6", anchor: "middle" } },
        ],
        animations: [
          { target: "eq", preset: "pop", delay: 0, duration: 0.5 },
          { target: "goal", preset: "fadeIn", delay: 0.5, duration: 0.4 },
        ],
      },
      // Step 2: Subtract/add both sides
      {
        id: "isolate",
        duration: 4,
        narration: op === "+"
          ? `Subtract ${constant} from both sides to get ${variable} alone.`
          : `Add ${constant} to both sides to get ${variable} alone.`,
        elements: [
          { id: "eq1", type: "mathText", props: { x: 400, y: lineY(0), text: `${variable} ${op} ${constant} = ${total}`, fontSize: 30, anchor: "middle", color: "#64748b" } },
          { id: "op-left", type: "mathText", props: {
            x: 300, y: lineY(1),
            text: op === "+" ? `- ${constant}` : `+ ${constant}`,
            fontSize: 22, color: "#f43f5e", anchor: "middle",
          }},
          { id: "op-right", type: "mathText", props: {
            x: 500, y: lineY(1),
            text: op === "+" ? `- ${constant}` : `+ ${constant}`,
            fontSize: 22, color: "#f43f5e", anchor: "middle",
          }},
          { id: "line", type: "bar", props: { x: 180, y: lineY(1) + 18, width: 440, height: 2, fill: "#cbd5e1" } },
          { id: "eq2", type: "mathText", props: {
            x: 400, y: lineY(2),
            text: `${variable} = ${answer}`,
            fontSize: 34, anchor: "middle", fontWeight: "black",
          }},
        ],
        animations: [
          { target: "eq1", preset: "fadeIn", delay: 0, duration: 0.3 },
          { target: "op-left", preset: "slideUp", delay: 0.4, duration: 0.4 },
          { target: "op-right", preset: "slideUp", delay: 0.6, duration: 0.4 },
          { target: "line", preset: "draw", delay: 1.0, duration: 0.4 },
          { target: "eq2", preset: "pop", delay: 1.6, duration: 0.5 },
        ],
      },
      // Step 3: Verify
      {
        id: "verify",
        duration: 4,
        narration: `Check: ${answer} ${op} ${constant} = ${total}. It works!`,
        elements: [
          { id: "result", type: "mathText", props: { x: 400, y: lineY(0), text: `${variable} = ${answer}`, fontSize: 34, anchor: "middle", fontWeight: "black" } },
          { id: "check-label", type: "mathText", props: { x: 400, y: lineY(1) - 10, text: "Check:", fontSize: 18, color: "#64748b", anchor: "middle" } },
          { id: "check", type: "mathText", props: { x: 400, y: lineY(1) + 20, text: `${answer} ${op} ${constant} = ${total}`, fontSize: 26, color: "#10b981", anchor: "middle" } },
          { id: "tick", type: "mathText", props: { x: 400, y: lineY(2) + 10, text: "Correct!", fontSize: 28, color: "#10b981", anchor: "middle", fontWeight: "black" } },
        ],
        animations: [
          { target: "result", preset: "fadeIn", delay: 0, duration: 0.3 },
          { target: "check-label", preset: "fadeIn", delay: 0.4, duration: 0.3 },
          { target: "check", preset: "slideUp", delay: 0.6, duration: 0.5 },
          { target: "tick", preset: "pop", delay: 1.4, duration: 0.5 },
        ],
      },
    ],
  };
}
