/**
 * @module components/mathai/visual/NumberLine
 *
 * SVG number line diagram. Shows a horizontal axis with tick marks,
 * optional shaded range highlight, a marked point, and an arrow annotation.
 */

"use client";

import type { NumberLineData } from "@/types";

interface NumberLineProps {
  data:      NumberLineData;
  width?:    number;
  height?:   number;
  animated?: boolean;
}

const TRACK_Y     = 52;
const TICK_H_MAIN = 12;
const TICK_H_SUB  = 6;
const PAD_X       = 32;

export function NumberLine({
  data,
  width   = 480,
  height  = 100,
  animated = true,
}: NumberLineProps) {
  const { min, max, step, highlight, point, arrow } = data;

  const range     = max - min;
  const trackW    = width - PAD_X * 2;
  const toX       = (v: number) => PAD_X + ((v - min) / range) * trackW;

  const ticks: number[] = [];
  for (let v = min; v <= max; v += step) ticks.push(v);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width }}
      aria-label={`Number line from ${min} to ${max}`}
      role="img"
    >
      {/* Highlight range */}
      {highlight && (
        <rect
          x={toX(highlight[0])}
          y={TRACK_Y - 18}
          width={toX(highlight[1]) - toX(highlight[0])}
          height={36}
          rx={6}
          fill="#6366f1"
          fillOpacity={0.15}
          className={animated ? "animate-[fadeIn_0.4s_ease-out]" : ""}
        />
      )}

      {/* Arrow annotation */}
      {arrow && (
        <>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
            </marker>
          </defs>
          <line
            x1={toX(arrow.from)}
            y1={TRACK_Y - 28}
            x2={toX(arrow.to)}
            y2={TRACK_Y - 28}
            stroke="#f59e0b"
            strokeWidth={2.5}
            markerEnd="url(#arrowhead)"
          />
          {arrow.label && (
            <text
              x={(toX(arrow.from) + toX(arrow.to)) / 2}
              y={TRACK_Y - 34}
              textAnchor="middle"
              fontSize={11}
              fill="#d97706"
              fontWeight="700"
            >
              {arrow.label}
            </text>
          )}
        </>
      )}

      {/* Main axis line */}
      <line
        x1={PAD_X - 8}
        y1={TRACK_Y}
        x2={width - PAD_X + 8}
        y2={TRACK_Y}
        stroke="#cbd5e1"
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* Left arrow cap */}
      <polygon
        points={`${PAD_X - 14},${TRACK_Y} ${PAD_X - 6},${TRACK_Y - 4} ${PAD_X - 6},${TRACK_Y + 4}`}
        fill="#cbd5e1"
      />
      {/* Right arrow cap */}
      <polygon
        points={`${width - PAD_X + 14},${TRACK_Y} ${width - PAD_X + 6},${TRACK_Y - 4} ${width - PAD_X + 6},${TRACK_Y + 4}`}
        fill="#cbd5e1"
      />

      {/* Ticks + labels */}
      {ticks.map((v) => {
        const x    = toX(v);
        const isHL = highlight && v >= highlight[0] && v <= highlight[1];
        return (
          <g key={v}>
            <line
              x1={x}
              y1={TRACK_Y - TICK_H_MAIN}
              x2={x}
              y2={TRACK_Y + TICK_H_SUB}
              stroke={isHL ? "#6366f1" : "#94a3b8"}
              strokeWidth={isHL ? 2 : 1.5}
              strokeLinecap="round"
            />
            <text
              x={x}
              y={TRACK_Y + TICK_H_SUB + 14}
              textAnchor="middle"
              fontSize={12}
              fill={isHL ? "#4f46e5" : "#64748b"}
              fontWeight={isHL ? "700" : "500"}
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Marked point */}
      {point !== undefined && (
        <g>
          <circle
            cx={toX(point)}
            cy={TRACK_Y}
            r={8}
            fill="#6366f1"
            className={animated ? "animate-[popIn_0.3s_ease-out]" : ""}
          />
          <text
            x={toX(point)}
            y={TRACK_Y - 14}
            textAnchor="middle"
            fontSize={12}
            fill="#4f46e5"
            fontWeight="700"
          >
            {point}
          </text>
        </g>
      )}
    </svg>
  );
}
