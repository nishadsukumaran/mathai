/**
 * @module components/mathai/xp-bar
 *
 * XP progress bar component. Two variants:
 *   - default: Full card with level title, XP fraction, animated fill
 *   - compact: Slim inline version for the dashboard top bar
 */

import { cn } from "@/lib/utils";
import type { XPStatus } from "@/types";

interface XPBarProps {
  xp:        XPStatus;
  compact?:  boolean;
  className?: string;
}

export function XPBar({ xp, compact = false, className }: XPBarProps) {
  const {
    level,
    levelTitle,
    xpInLevel,
    xpToNextLevel,
    progressPct,
  } = xp;

  const fillWidth = `${Math.min(progressPct, 100)}%`;

  if (compact) {
    return (
      <div className={cn("flex flex-col gap-1 min-w-[140px]", className)}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-700">
            Lv.{level} · {levelTitle}
          </span>
          <span className="text-xs text-slate-500">
            {xpInLevel}/{xpToNextLevel} XP
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={xpInLevel}
          aria-valuemin={0}
          aria-valuemax={xpToNextLevel}
          aria-label={`XP progress: ${xpInLevel} of ${xpToNextLevel}`}
        >
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-700 ease-out"
            style={{ width: fillWidth }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm border border-slate-100 space-y-3",
        className
      )}
    >
      {/* Level badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              "bg-indigo-600 text-sm font-black text-white"
            )}
          >
            {level}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">
              Level {level}
            </p>
            <p className="text-sm font-semibold text-gray-800">{levelTitle}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-500">
          ⭐ {xp.totalXP} XP
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={xpInLevel}
        aria-valuemin={0}
        aria-valuemax={xpToNextLevel}
        aria-label={`XP to next level: ${xpInLevel} of ${xpToNextLevel}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700 ease-out"
          style={{ width: fillWidth }}
        />
      </div>

      <p className="text-right text-xs text-slate-500">
        {xpInLevel} / {xpToNextLevel} XP to Level {level + 1}
      </p>
    </div>
  );
}
