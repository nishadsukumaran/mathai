/**
 * @module components/mathai/quest-card
 *
 * Daily quest card. Shows title, progress bar (currentCount/targetCount),
 * XP reward chip, and a completed state with green check.
 */

import { cn } from "@/lib/utils";
import type { DailyQuest } from "@/types";

interface QuestCardProps {
  quest:      DailyQuest;
  className?: string;
}

export function QuestCard({ quest, className }: QuestCardProps) {
  const {
    title,
    description,
    currentCount,
    targetCount,
    xpReward,
    completedAt,
  } = quest;

  const isComplete  = Boolean(completedAt);
  const progressPct = Math.min((currentCount / targetCount) * 100, 100);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm",
        "border border-slate-100 transition-shadow hover:shadow-md",
        isComplete && "border-emerald-200 bg-emerald-50",
        className
      )}
    >
      {/* Completed overlay badge */}
      {isComplete && (
        <div
          className={cn(
            "absolute right-3 top-3 flex h-7 w-7 items-center justify-center",
            "rounded-full bg-emerald-500 text-white text-sm font-bold"
          )}
          aria-label="Quest completed"
        >
          ✓
        </div>
      )}

      {/* Title */}
      <p
        className={cn(
          "pr-8 text-sm font-semibold text-gray-800 leading-snug",
          isComplete && "text-emerald-800"
        )}
      >
        {title}
      </p>

      {/* Description (shown if there's room) */}
      {description && !isComplete && (
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          {description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mt-3 space-y-1">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={currentCount}
          aria-valuemin={0}
          aria-valuemax={targetCount}
          aria-label={`Quest progress: ${currentCount} of ${targetCount}`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isComplete ? "bg-emerald-500" : "bg-indigo-500"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {currentCount} / {targetCount}
          </span>
          {/* XP chip */}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              isComplete
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {isComplete ? "✓ " : "+"}{xpReward} XP
          </span>
        </div>
      </div>
    </div>
  );
}
