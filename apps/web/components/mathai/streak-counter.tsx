/**
 * @module components/mathai/streak-counter
 *
 * Displays the student's daily streak count.
 * Two variants: compact (for top bar) and full (for stats row).
 */

import { cn } from "@/lib/utils";
import type { StreakStatus } from "@/types";

interface StreakCounterProps {
  streak:    StreakStatus;
  compact?:  boolean;
  className?: string;
}

export function StreakCounter({ streak, compact = false, className }: StreakCounterProps) {
  const { currentStreak, longestStreak, shieldActive } = streak;

  // Pulse animation only kicks in when streak ≥ 3
  const shouldPulse = currentStreak >= 3;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1",
          className
        )}
        title={`Longest streak: ${longestStreak} days`}
      >
        <span
          className={cn(
            "text-base leading-none",
            shouldPulse && "animate-[pulse_2s_ease-in-out_infinite]"
          )}
          aria-hidden="true"
        >
          🔥
        </span>
        <span className="text-sm font-black text-amber-700">
          {currentStreak}
        </span>
        <span className="text-xs font-medium text-amber-600">
          {currentStreak === 1 ? "day" : "days"}
        </span>
        {shieldActive && (
          <span
            className="ml-0.5 text-xs text-blue-500"
            title="Streak shield active — one missed day won't break your streak!"
          >
            🛡️
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm border border-slate-100",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-3xl",
            shouldPulse && "animate-[pulse_2s_ease-in-out_infinite]"
          )}
          aria-hidden="true"
        >
          🔥
        </span>
        <div>
          <p className="text-3xl font-black text-amber-600 leading-none">
            {currentStreak}
            <span className="ml-1 text-sm font-semibold text-amber-500">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Current streak</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>Best: {longestStreak} days</span>
        {shieldActive && (
          <span className="flex items-center gap-1 text-blue-500 font-medium">
            🛡️ Shield active
          </span>
        )}
      </div>
    </div>
  );
}
