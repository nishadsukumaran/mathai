/**
 * @module components/mathai/mastery-ring
 *
 * Circular mastery ring shown around topic icons.
 * Uses SVG strokeDasharray to render a partial/full circle
 * that fills based on mastery level.
 *
 * Mastery → fill percentage:
 *   not_started → 0%
 *   emerging    → 25%
 *   developing  → 55%
 *   mastered    → 85%
 *   extended    → 100%
 */

import { cn, MASTERY_TEXT_COLOR, MASTERY_LABEL } from "@/lib/utils";
import type { MasteryLevel } from "@/types";

interface MasteryRingProps {
  level:       MasteryLevel;
  /** Diameter in px — ring scales proportionally */
  size?:       number;
  /** Content rendered at the centre of the ring (icon, emoji, etc.) */
  children?:   React.ReactNode;
  showLabel?:  boolean;
  className?:  string;
}

const STROKE_COLORS: Record<MasteryLevel, string> = {
  not_started: "#CBD5E1", // slate-300
  emerging:    "#FB923C", // orange-400
  developing:  "#818CF8", // indigo-400
  mastered:    "#10B981", // emerald-500
  extended:    "#A855F7", // purple-500
};

const FILL_PCT: Record<MasteryLevel, number> = {
  not_started: 0,
  emerging:    25,
  developing:  55,
  mastered:    85,
  extended:    100,
};

export function MasteryRing({
  level,
  size = 64,
  children,
  showLabel = false,
  className,
}: MasteryRingProps) {
  const strokeWidth   = Math.max(3, size * 0.08);
  const radius        = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillPct       = FILL_PCT[level];
  const dashOffset    = circumference - (fillPct / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* SVG ring */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label={`Mastery: ${MASTERY_LABEL[level]}`}
          role="img"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          {fillPct > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={STROKE_COLORS[level]}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              // Start at 12 o'clock
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Centre content */}
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}

        {/* Mastered / Extended star badge */}
        {(level === "mastered" || level === "extended") && (
          <div
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center",
              "rounded-full text-xs shadow",
              level === "mastered" ? "bg-emerald-500" : "bg-purple-500"
            )}
            aria-hidden="true"
          >
            {level === "mastered" ? "⭐" : "👑"}
          </div>
        )}
      </div>

      {showLabel && (
        <span
          className={cn(
            "text-xs font-bold",
            MASTERY_TEXT_COLOR[level]
          )}
        >
          {MASTERY_LABEL[level]}
        </span>
      )}
    </div>
  );
}
