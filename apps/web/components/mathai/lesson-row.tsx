/**
 * @module components/mathai/lesson-row
 *
 * Lesson row for the /topic/:topicId lesson list.
 * Shows the lesson number, title, estimated time, XP reward, state chip,
 * and a context-appropriate CTA button.
 *
 * A vertical connector line between rows is rendered by the parent
 * (see topic detail page layout).
 */

import { cn, LESSON_STATE_LABEL, LESSON_STATE_BUTTON_CLASS } from "@/lib/utils";
import type { LessonSummary, LessonState } from "@/types";

interface LessonRowProps {
  lesson:    LessonSummary;
  index:     number;           // 1-based display number
  onStart?:  (lessonId: string) => void;
  className?: string;
}

const STATE_BG: Record<LessonState, string> = {
  locked:      "bg-white opacity-60",
  unlocked:    "bg-white",
  in_progress: "bg-indigo-50 border-indigo-200",
  completed:   "bg-emerald-50 border-emerald-100",
  mastered:    "bg-emerald-50 border-emerald-100",
};

const STATE_NUMBER_BG: Record<LessonState, string> = {
  locked:      "bg-slate-200 text-slate-400",
  unlocked:    "bg-slate-100 text-slate-600",
  in_progress: "bg-indigo-600 text-white",
  completed:   "bg-emerald-500 text-white",
  mastered:    "bg-emerald-500 text-white",
};

const STATE_ICON: Record<LessonState, string | null> = {
  locked:      "🔒",
  unlocked:    null,
  in_progress: null,
  completed:   "✓",
  mastered:    "⭐",
};

const STATE_CHIP_CLASS: Record<LessonState, string> = {
  locked:      "bg-slate-100 text-slate-400",
  unlocked:    "hidden",
  in_progress: "bg-amber-100 text-amber-700",
  completed:   "bg-emerald-100 text-emerald-700",
  mastered:    "bg-purple-100 text-purple-700",
};

const STATE_CHIP_LABEL: Record<LessonState, string> = {
  locked:      "Locked",
  unlocked:    "",
  in_progress: "In Progress",
  completed:   "Completed",
  mastered:    "Mastered",
};

export function LessonRow({ lesson, index, onStart, className }: LessonRowProps) {
  const { id, title, state, estimatedMin, xpReward } = lesson;

  const buttonLabel  = LESSON_STATE_LABEL[state];
  const buttonClass  = LESSON_STATE_BUTTON_CLASS[state];
  const isActionable = state !== "locked";
  const icon         = STATE_ICON[state];

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 shadow-sm",
        "transition-shadow duration-200 hover:shadow-md",
        STATE_BG[state],
        className
      )}
    >
      {/* Lesson number / state icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          "text-sm font-black select-none",
          STATE_NUMBER_BG[state]
        )}
        aria-hidden="true"
      >
        {icon ?? index}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-semibold leading-snug truncate",
            state === "locked" ? "text-slate-400" : "text-gray-800"
          )}
        >
          {title}
        </p>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">~{estimatedMin} min</span>
          {/* State chip */}
          {state !== "unlocked" && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                STATE_CHIP_CLASS[state]
              )}
            >
              {STATE_CHIP_LABEL[state]}
            </span>
          )}
        </div>
      </div>

      {/* Right: XP chip + CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
          +{xpReward} XP
        </span>

        {isActionable && onStart && (
          <button
            onClick={() => onStart(id)}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-bold",
              "transition-all duration-150 active:scale-95",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              buttonClass
            )}
            aria-label={`${buttonLabel} ${title}`}
          >
            {buttonLabel} →
          </button>
        )}
      </div>
    </div>
  );
}
