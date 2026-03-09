/**
 * @module components/shared/skeleton
 *
 * Skeleton loading components that match the layout of real content.
 * Rule: Always use shape-matched skeletons, never a lone spinner.
 * Minimum 300ms display to avoid layout flicker on fast connections.
 */

import { Skeleton as UISkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

// ─── Primitive pulse block ────────────────────────────────────────────────────
// Wraps the shadcn ui/skeleton with MathAI brand colours (bg-slate-200, rounded-lg).
// All composed skeletons below build on this one primitive.

export function Skeleton({ className }: SkeletonProps) {
  return (
    <UISkeleton
      className={cn("bg-slate-200 rounded-lg", className)}
      aria-hidden="true"
    />
  );
}

// ─── Text line variants ────────────────────────────────────────────────────────

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonHeading({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-7 w-3/4", className)} />;
}

export function SkeletonLabel({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-3 w-1/3", className)} />;
}

// ─── Card skeletons ────────────────────────────────────────────────────────────

/** Matches a dashboard quest card */
export function SkeletonQuestCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm border border-slate-100 space-y-3",
        className
      )}
    >
      <SkeletonText className="w-3/4" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex items-center justify-between">
        <SkeletonLabel />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

/** Matches a topic card in the curriculum grid */
export function SkeletonTopicCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-6 shadow-md space-y-4",
        className
      )}
    >
      <div className="flex justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      <SkeletonHeading className="mx-auto w-1/2" />
      <SkeletonText className="w-5/6 mx-auto" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

/** Matches a lesson row in the topic detail page */
export function SkeletonLessonRow({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-center gap-4",
        className
      )}
    >
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-1/2" />
        <SkeletonLabel className="w-1/4" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

/** Matches the XP level card on the progress screen */
export function SkeletonLevelCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-3xl bg-slate-200 p-6 animate-pulse", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-12 w-16 rounded-lg bg-slate-300" />
          <Skeleton className="h-5 w-36 rounded-lg bg-slate-300" />
        </div>
        <div className="flex-1 ml-8 space-y-2">
          <Skeleton className="h-3 w-full rounded-full bg-slate-300" />
          <Skeleton className="h-3 w-1/2 rounded-lg bg-slate-300" />
        </div>
      </div>
    </div>
  );
}

/** Matches a stat card in the progress stats row */
export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-4 shadow-sm text-center space-y-2",
        className
      )}
    >
      <Skeleton className="h-8 w-16 mx-auto rounded-lg" />
      <SkeletonLabel className="mx-auto w-1/2" />
    </div>
  );
}

/** Matches a full dashboard page layout */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        <SkeletonHeading className="w-48" />
        <Skeleton className="h-8 w-32 rounded-xl" />
      </div>
      {/* Quest strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <SkeletonQuestCard key={i} />)}
      </div>
      {/* Hero */}
      <Skeleton className="h-28 w-full rounded-3xl" />
      {/* Topic grid */}
      <SkeletonHeading className="w-40" />
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => <SkeletonTopicCard key={i} />)}
      </div>
    </div>
  );
}
