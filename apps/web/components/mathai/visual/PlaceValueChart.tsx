/**
 * @module components/mathai/visual/PlaceValueChart
 *
 * Place value chart — renders digit blocks stacked in columns
 * (Thousands | Hundreds | Tens | Ones).
 *
 * Each column shows the digit as a stack of unit squares plus
 * the column header. Highlighted columns are tinted indigo.
 *
 * E.g. 3,456 →  [3 cubes][4 cubes][5 cubes][6 cubes]
 */

"use client";

import type { PlaceValueChartData } from "@/types";

interface PlaceValueChartProps {
  data:      PlaceValueChartData;
  animated?: boolean;
}

const COLUMN_ORDER = ["thousands", "hundreds", "tens", "ones"] as const;
const COLUMN_LABEL: Record<string, string> = {
  thousands: "Thousands",
  hundreds:  "Hundreds",
  tens:      "Tens",
  ones:      "Ones",
};

const COL_W     = 72;
const COL_GAP   = 8;
const BLOCK_H   = 18;
const BLOCK_W   = 40;
const HEADER_H  = 28;
const PAD       = 16;
const MAX_STACK = 12; // cap display at 12 blocks; show "…" for more

export function PlaceValueChart({ data, animated = true }: PlaceValueChartProps) {
  const { digits, highlight = [] } = data;

  // Only render columns that have a digit entry
  const cols = COLUMN_ORDER.filter((col) => digits[col] !== undefined);
  if (cols.length === 0) return null;

  const maxDigit = Math.max(...cols.map((c) => Math.min(digits[c] ?? 0, MAX_STACK)), 1);
  const svgH     = HEADER_H + maxDigit * (BLOCK_H + 2) + PAD * 2 + 24; // 24 for digit label at bottom
  const svgW     = cols.length * (COL_W + COL_GAP) - COL_GAP + PAD * 2;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxWidth: Math.min(svgW, 480) }}
      aria-label="place value chart"
      role="img"
    >
      {cols.map((col, ci) => {
        const isHighlighted = highlight.includes(col);
        const digit         = digits[col] ?? 0;
        const blockCount    = Math.min(digit, MAX_STACK);
        const colX          = PAD + ci * (COL_W + COL_GAP);
        const fillBase      = isHighlighted ? "#6366f1" : "#94a3b8";
        const headerFill    = isHighlighted ? "#eef2ff" : "#f8fafc";
        const headerBorder  = isHighlighted ? "#6366f1" : "#e2e8f0";

        return (
          <g key={col}>
            {/* Column header */}
            <rect
              x={colX}
              y={PAD}
              width={COL_W}
              height={HEADER_H}
              rx={6}
              fill={headerFill}
              stroke={headerBorder}
              strokeWidth={1.5}
            />
            <text
              x={colX + COL_W / 2}
              y={PAD + HEADER_H / 2 + 5}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={isHighlighted ? "#4f46e5" : "#64748b"}
              fontFamily="inherit"
            >
              {COLUMN_LABEL[col]}
            </text>

            {/* Divider line */}
            {ci < cols.length - 1 && (
              <line
                x1={colX + COL_W + COL_GAP / 2}
                y1={PAD}
                x2={colX + COL_W + COL_GAP / 2}
                y2={svgH - PAD}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {/* Stacked blocks — drawn bottom to top */}
            {Array.from({ length: blockCount }).map((_, bi) => {
              const blockY = svgH - PAD - 24 - (bi + 1) * (BLOCK_H + 2);
              const delay  = animated ? (ci * 3 + (blockCount - 1 - bi)) * 0.04 : 0;
              return (
                <rect
                  key={bi}
                  x={colX + (COL_W - BLOCK_W) / 2}
                  y={blockY}
                  width={BLOCK_W}
                  height={BLOCK_H}
                  rx={3}
                  fill={fillBase}
                  opacity={0.75 + bi * 0.02}
                  stroke="white"
                  strokeWidth={1}
                  style={
                    animated
                      ? { animation: `popIn 0.2s ${delay.toFixed(2)}s ease-out both` }
                      : {}
                  }
                />
              );
            })}

            {/* Overflow label */}
            {digit > MAX_STACK && (
              <text
                x={colX + COL_W / 2}
                y={svgH - PAD - 24 - MAX_STACK * (BLOCK_H + 2) - 4}
                textAnchor="middle"
                fontSize={11}
                fill={fillBase}
                fontWeight={600}
                fontFamily="inherit"
              >
                ⋯
              </text>
            )}

            {/* Digit value at bottom */}
            <text
              x={colX + COL_W / 2}
              y={svgH - PAD - 4}
              textAnchor="middle"
              fontSize={16}
              fontWeight={800}
              fill={isHighlighted ? "#4f46e5" : "#334155"}
              fontFamily="inherit"
            >
              {digit}
            </text>
          </g>
        );
      })}

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
