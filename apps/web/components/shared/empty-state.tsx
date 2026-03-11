/**
 * @module components/shared/empty-state
 *
 * Encouraging empty states for screens with no data yet.
 * Rule: Never show a completely blank screen.
 * Always include a friendly message and a clear CTA.
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Large emoji or illustration shown at the top */
  icon?: string;
  /** Short, upbeat headline */
  title: string;
  /** Supporting copy (optional) */
  description?: string;
  /** CTA button — pass a pre-built <button> or <Link> element */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = "✨",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl",
        "bg-white border border-slate-100 shadow-sm p-10 text-center",
        className
      )}
    >
      <div className="text-5xl" aria-hidden="true">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Pre-built empty states for common screens ────────────────────────────────

interface EmptyActionProps {
  onAction?: () => void;
  label?: string;
}

function EmptyCTA({ onAction, label }: EmptyActionProps) {
  if (!onAction) return null;
  return (
    <button
      onClick={onAction}
      className={cn(
        "rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white",
        "hover:bg-indigo-700 active:scale-95 transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
      )}
    >
      {label ?? "Get Started"}
    </button>
  );
}

export function EmptyBadges({ onAction }: EmptyActionProps) {
  return (
    <EmptyState
      icon="🏅"
      title="No badges yet!"
      description="Finish a practice session to earn your first badge. You've got this!"
      action={<EmptyCTA onAction={onAction} label="Start Practising" />}
    />
  );
}

export function EmptyQuests({ onAction }: EmptyActionProps) {
  return (
    <EmptyState
      icon="🗓️"
      title="No quests today"
      description="Come back tomorrow for a fresh set of daily quests!"
      action={<EmptyCTA onAction={onAction} label="Browse Topics" />}
    />
  );
}

export function EmptyWeakAreas() {
  return (
    <EmptyState
      icon="🎉"
      title="No weak areas!"
      description="You're doing great everywhere. Keep it up to stay on top!"
    />
  );
}

export function EmptyProgress({ onAction }: EmptyActionProps) {
  return (
    <EmptyState
      icon="🚀"
      title="Your journey starts here"
      description="Complete your first practice session and your progress will show up here."
      action={<EmptyCTA onAction={onAction} label="Start First Session" />}
    />
  );
}

export function EmptyCurriculum() {
  return (
    <EmptyState
      icon="📚"
      title="Topics loading soon"
      description="Curriculum is being set up for your grade. Check back in a moment!"
    />
  );
}
