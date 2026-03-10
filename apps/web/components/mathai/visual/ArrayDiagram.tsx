/**
 * @module components/mathai/visual/ArrayDiagram
 *
 * Array/grid diagram for multiplication and grouping concepts.
 * Renders rows × cols circles with optional colour groups.
 * E.g. 3 groups of 4 = 12 — highlight each group a different colour.
 */

"use client";

import type { ArrayData } from "@/types";

interface ArrayDiagramProps {
  data:      ArrayData;
  animated?: boolean;
}

const DOT_R    = 12;
const DOT_GAP  = 8;
const CELL     = DOT_R * 2 + DOT_GAP;
const PAD      = 16;

const GROUP_COLOURS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
];

export function ArrayDiagram({ data, animated = true }: ArrayDiagramProps) {
  const { rows, cols, highlightGroups } = data;

  const svgW = cols * CELL + PAD * 2;
  const svgH = rows * CELL + PAD * 2;

  // Build a flat index → color map from highlight groups
  const colorMap: Record<number, string> = {};
  if (highlightGroups) {
    highlightGroups.forEach((g, gi) => {
      const col = g.color ?? GROUP_COLOURS[gi % GROUP_COLOURS.length]!;
      for (let k = g.start; k < g.start + g.size; k++) {
        colorMap[k] = col;
      }
    });
  }

  const dots: { cx: number; cy: number; idx: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({
        cx:  PAD + c * CELL + DOT_R,
        cy:  PAD + r * CELL + DOT_R,
        idx: r * cols + c,
      });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxWidth: Math.min(svgW, 480) }}
      aria-label={`${rows} × ${cols} array showing ${rows * cols} items`}
      role="img"
    >
      {dots.map(({ cx, cy, idx }) => {
        const fill  = colorMap[idx] ?? "#e2e8f0";
        const delay = animated ? idx * 0.025 : 0;
        return (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={DOT_R}
            fill={fill}
            stroke={fill === "#e2e8f0" ? "#cbd5e1" : "white"}
            strokeWidth={1.5}
            style={
              animated
                ? { animation: `popIn 0.25s ${delay.toFixed(2)}s ease-out both` }
                : {}
            }
          />
        );
      })}

      {/* Group brackets: draw a rounded rect around each group */}
      {highlightGroups?.map((g, gi) => {
        const col = g.color ?? GROUP_COLOURS[gi % GROUP_COLOURS.length]!;
        const startRow = Math.floor(g.start / cols);
        const endRow   = Math.floor((g.start + g.size - 1) / cols);
        const startCol = g.start % cols;
        const endCol   = (g.start + g.size - 1) % cols;

        // Only draw bracket if the group is on consecutive dots in same row band
        if (startRow !== endRow) return null;
        return (
          <rect
            key={gi}
            x={PAD + startCol * CELL - 4}
            y={PAD + startRow * CELL - 4}
            width={(endCol - startCol + 1) * CELL}
            height={CELL}
            rx={DOT_R + 4}
            fill="none"
            stroke={col}
            strokeWidth={2.5}
            strokeDasharray="4 2"
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
}
