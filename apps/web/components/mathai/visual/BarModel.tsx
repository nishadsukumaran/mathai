/**
 * @module components/mathai/visual/BarModel
 *
 * Singapore-style bar model for part-whole and comparison problems.
 * Renders labelled horizontal bars scaled proportionally to their values.
 * An optional "total" bar appears above all parts.
 *
 * E.g. "Ahmed has 12 stickers, Bea has 8 — how many altogether?" →
 *   [Ahmed  12 ] [Bea  8 ] + optional total bar of 20.
 */

"use client";

import type { BarModelData } from "@/types";

interface BarModelProps {
  data:      BarModelData;
  animated?: boolean;
}

const BAR_H    = 36;
const BAR_GAP  = 10;
const LABEL_W  = 80;
const PAD      = 16;
const MAX_BAR  = 360; // px for the widest bar

const BAR_COLOURS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
];

export function BarModel({ data, animated = true }: BarModelProps) {
  const { bars, total } = data;

  const maxVal = Math.max(...bars.map((b) => b.value), 1);

  // If a total bar is requested, append it at top (index -1 logically)
  const allBars = total
    ? [{ label: total.label, value: maxVal, color: "#94a3b8", isTotal: true }, ...bars.map((b) => ({ ...b, isTotal: false }))]
    : bars.map((b) => ({ ...b, isTotal: false }));

  const svgH = allBars.length * (BAR_H + BAR_GAP) + PAD * 2;
  const svgW = LABEL_W + MAX_BAR + PAD * 2;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxWidth: Math.min(svgW, 520) }}
      aria-label="bar model diagram"
      role="img"
    >
      {allBars.map((bar, i) => {
        const y      = PAD + i * (BAR_H + BAR_GAP);
        const barW   = Math.max(4, (bar.value / maxVal) * MAX_BAR);
        const fill   = bar.isTotal
          ? "#94a3b8"
          : (bar.color ?? BAR_COLOURS[i % BAR_COLOURS.length]!);
        const delay  = animated ? i * 0.08 : 0;

        return (
          <g key={i}>
            {/* Label */}
            <text
              x={LABEL_W - 8}
              y={y + BAR_H / 2 + 5}
              textAnchor="end"
              fontSize={12}
              fontWeight={bar.isTotal ? 700 : 500}
              fill="#475569"
              fontFamily="inherit"
            >
              {bar.label}
            </text>

            {/* Bar track (background) */}
            <rect
              x={LABEL_W}
              y={y}
              width={MAX_BAR}
              height={BAR_H}
              rx={6}
              fill="#f1f5f9"
              stroke="#e2e8f0"
              strokeWidth={1}
            />

            {/* Bar fill */}
            <rect
              x={LABEL_W}
              y={y}
              width={barW}
              height={BAR_H}
              rx={6}
              fill={fill}
              opacity={bar.isTotal ? 0.45 : 0.85}
              style={
                animated
                  ? {
                      animation: `barGrow 0.4s ${delay.toFixed(2)}s ease-out both`,
                      transformOrigin: `${LABEL_W}px ${y}px`,
                    }
                  : {}
              }
            />

            {/* Value label inside bar */}
            <text
              x={LABEL_W + barW - 8}
              y={y + BAR_H / 2 + 5}
              textAnchor="end"
              fontSize={13}
              fontWeight={700}
              fill="white"
              fontFamily="inherit"
            >
              {bar.value}
            </text>

            {/* Dashed bracket over total bar */}
            {bar.isTotal && (
              <rect
                x={LABEL_W}
                y={y}
                width={MAX_BAR}
                height={BAR_H}
                rx={6}
                fill="none"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
            )}
          </g>
        );
      })}

      <style>{`
        @keyframes barGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </svg>
  );
}
