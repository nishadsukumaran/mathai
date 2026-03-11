/**
 * @module components/mathai/visual/FractionBar
 *
 * Visual fraction bars. Each row shows one fraction as a horizontal bar
 * divided into denominator parts, with numerator parts filled in colour.
 * Multiple fractions are stacked for easy comparison.
 */

"use client";

import type { FractionBarData } from "@/types";

interface FractionBarProps {
  data:      FractionBarData;
  animated?: boolean;
}

const COLOURS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
];

const ROW_H   = 36;
const ROW_GAP = 12;
const LABEL_W = 64;
const BAR_R   = 6;

export function FractionBar({ data, animated = true }: FractionBarProps) {
  const { fractions } = data;

  // Guard: AI may return a visualPlan with missing or empty fractions array.
  if (!fractions || fractions.length === 0) return null;

  const svgH = fractions.length * (ROW_H + ROW_GAP) + ROW_GAP;

  return (
    <svg
      viewBox={`0 0 480 ${svgH}`}
      width="100%"
      style={{ maxWidth: 480 }}
      aria-label="Fraction bar diagram"
      role="img"
    >
      {fractions.map((frac, i) => {
        const { numerator, denominator, label, color } = frac;
        const fill  = color ?? COLOURS[i % COLOURS.length]!;
        const y     = ROW_GAP + i * (ROW_H + ROW_GAP);
        const barX  = LABEL_W;
        const barW  = 480 - LABEL_W - 8;
        const partW = barW / denominator;

        return (
          <g key={i}>
            {/* Fraction label left */}
            <text
              x={LABEL_W - 8}
              y={y + ROW_H / 2 + 5}
              textAnchor="end"
              fontSize={14}
              fontWeight="700"
              fill="#4b5563"
            >
              {label ?? `${numerator}/${denominator}`}
            </text>

            {/* Background track */}
            <rect
              x={barX}
              y={y}
              width={barW}
              height={ROW_H}
              rx={BAR_R}
              fill="#f1f5f9"
            />

            {/* Division lines */}
            {Array.from({ length: denominator - 1 }).map((_, di) => (
              <line
                key={di}
                x1={barX + (di + 1) * partW}
                y1={y}
                x2={barX + (di + 1) * partW}
                y2={y + ROW_H}
                stroke="#e2e8f0"
                strokeWidth={1.5}
              />
            ))}

            {/* Filled parts */}
            <rect
              x={barX}
              y={y}
              width={partW * numerator}
              height={ROW_H}
              rx={BAR_R}
              fill={fill}
              style={
                animated
                  ? { transformOrigin: `${barX}px ${y + ROW_H / 2}px`, animation: "scaleX 0.4s ease-out" }
                  : {}
              }
            />

            {/* Numerator fraction label inside bar */}
            {numerator > 0 && (
              <text
                x={barX + (partW * numerator) / 2}
                y={y + ROW_H / 2 + 5}
                textAnchor="middle"
                fontSize={12}
                fontWeight="700"
                fill="white"
              >
                {numerator}/{denominator}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
