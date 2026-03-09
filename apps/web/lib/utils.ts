/**
 * @module apps/web/lib/utils
 *
 * Shared utility functions used across all components.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MasteryLevel, LessonState, BadgeCategory } from "@/types";

// ─── className merge (shadcn/ui pattern) ──────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Mastery level → Tailwind colour tokens ───────────────────────────────────

export const MASTERY_RING_COLOR: Record<MasteryLevel, string> = {
  not_started: "border-slate-300",
  emerging:    "border-amber-400",
  developing:  "border-indigo-400",
  mastered:    "border-emerald-500",
  extended:    "border-purple-500",
};

export const MASTERY_TEXT_COLOR: Record<MasteryLevel, string> = {
  not_started: "text-slate-500",
  emerging:    "text-amber-600",
  developing:  "text-indigo-600",
  mastered:    "text-emerald-600",
  extended:    "text-purple-600",
};

export const MASTERY_BG_COLOR: Record<MasteryLevel, string> = {
  not_started: "bg-slate-100",
  emerging:    "bg-amber-100",
  developing:  "bg-indigo-100",
  mastered:    "bg-emerald-100",
  extended:    "bg-purple-100",
};

export const MASTERY_LABEL: Record<MasteryLevel, string> = {
  not_started: "Not Started",
  emerging:    "Emerging",
  developing:  "Developing",
  mastered:    "Mastered!",
  extended:    "Extended",
};

// ─── Lesson state → UI tokens ─────────────────────────────────────────────────

export const LESSON_STATE_LABEL: Record<LessonState, string> = {
  locked:      "Locked",
  unlocked:    "Start",
  in_progress: "Continue",
  completed:   "Redo",
  mastered:    "Redo",
};

export const LESSON_STATE_BUTTON_CLASS: Record<LessonState, string> = {
  locked:      "hidden",
  unlocked:    "bg-emerald-500 hover:bg-emerald-600 text-white",
  in_progress: "bg-indigo-600 hover:bg-indigo-700 text-white",
  completed:   "border border-gray-300 text-gray-600 hover:bg-gray-50",
  mastered:    "border border-gray-300 text-gray-600 hover:bg-gray-50",
};

// ─── Badge category → colour ──────────────────────────────────────────────────

export const BADGE_CATEGORY_BG: Record<BadgeCategory, string> = {
  mastery:     "bg-gradient-to-br from-emerald-400 to-emerald-600",
  streak:      "bg-gradient-to-br from-amber-400 to-orange-500",
  session:     "bg-gradient-to-br from-indigo-400 to-indigo-600",
  exploration: "bg-gradient-to-br from-teal-400 to-teal-600",
  challenge:   "bg-gradient-to-br from-rose-400 to-rose-600",
  persistence: "bg-gradient-to-br from-purple-400 to-purple-600",
};

// ─── Formatting helpers ────────────────────────────────────────────────────────

/** Format ISO date string to a short human label: "Mar 8" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
}

/** Format seconds as "1m 30s" or "2m" */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Convert 0-100 accuracy to a Tailwind text-color class */
export function accuracyColor(pct: number): string {
  if (pct >= 70) return "text-emerald-600";
  if (pct >= 55) return "text-amber-600";
  return "text-rose-500";
}

/** Safe error message extractor for catch blocks */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
