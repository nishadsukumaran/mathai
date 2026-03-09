/**
 * @module components/mathai/topic-card
 *
 * Topic card for the /curriculum grid.
 * Shows the mastery ring, topic name, description, lesson count, and
 * a lock overlay for topics the student hasn't unlocked yet.
 *
 * Clicking navigates to /topic/:id (handled by the parent via onClick prop).
 */

import { cn, MASTERY_LABEL, MASTERY_TEXT_COLOR, MASTERY_BG_COLOR } from "@/lib/utils";
import { MasteryRing } from "./mastery-ring";
import type { TopicSummary } from "@/types";

interface TopicCardProps {
  topic:      TopicSummary;
  onClick?:   () => void;
  className?: string;
}

/** Map iconSlug → emoji (replace with SVG components when available) */
const ICON_MAP: Record<string, string> = {
  fractions:      "½",
  multiplication: "×",
  division:       "÷",
  addition:       "+",
  subtraction:    "−",
  geometry:       "📐",
  decimals:       ".",
  "word-problems": "💬",
  measurement:    "📏",
  default:        "🔢",
};

export function TopicCard({ topic, onClick, className }: TopicCardProps) {
  const {
    name,
    description,
    iconSlug,
    masteryLevel,
    isUnlocked,
    lessonCount,
  } = topic;

  const icon = ICON_MAP[iconSlug] ?? ICON_MAP["default"];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-white p-6 shadow-md",
        "border border-slate-100 flex flex-col gap-4",
        "transition-all duration-200",
        isUnlocked
          ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]"
          : "cursor-not-allowed opacity-75",
        className
      )}
      onClick={isUnlocked ? onClick : undefined}
      role={isUnlocked ? "button" : undefined}
      tabIndex={isUnlocked ? 0 : undefined}
      onKeyDown={
        isUnlocked && onClick
          ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); }
          : undefined
      }
      aria-label={
        isUnlocked
          ? `${name} — ${MASTERY_LABEL[masteryLevel]}`
          : `${name} — Locked`
      }
    >
      {/* Mastery ring + icon */}
      <div className="flex justify-center">
        <MasteryRing level={masteryLevel} size={72} showLabel={false}>
          <span
            className="text-2xl font-bold select-none"
            aria-hidden="true"
          >
            {icon}
          </span>
        </MasteryRing>
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <h3 className="text-base font-bold text-gray-800 leading-snug">
          {name}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Footer row: lesson count + mastery chip */}
      <div className="flex items-center justify-between pt-1">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold",
            MASTERY_BG_COLOR[masteryLevel],
            MASTERY_TEXT_COLOR[masteryLevel]
          )}
        >
          {MASTERY_LABEL[masteryLevel]}
        </span>
      </div>

      {/* Lock overlay */}
      {!isUnlocked && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-2",
            "rounded-3xl bg-white/75 backdrop-blur-[1px]"
          )}
          aria-hidden="true"
        >
          <span className="text-3xl">🔒</span>
          <p className="text-xs font-semibold text-slate-500 text-center px-4">
            Complete earlier topics to unlock
          </p>
        </div>
      )}
    </div>
  );
}
