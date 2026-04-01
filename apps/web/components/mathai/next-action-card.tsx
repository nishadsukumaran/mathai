"use client";

/**
 * @module apps/web/components/mathai/next-action-card
 *
 * Dashboard card showing the Learning Brain's "next best action" recommendation.
 * Fetches from GET /api/learning/next via useLearningNext() hook.
 *
 * Displays: action type badge, topic name, reason, encouragement, and a CTA
 * that links to /practice with the recommended topic and mode.
 */

import Link from "next/link";
import { useLearningNext } from "@/hooks/use-learning-next";
import type { LearningActionType, SessionMode } from "@mathai/shared-types";

// ─── Visual config per action type ───────────────────────────────────────────

const ACTION_CONFIG: Record<LearningActionType, {
  emoji:    string;
  label:    string;
  gradient: string;
  badge:    string;
}> = {
  practice:       { emoji: "📝", label: "Practice",       gradient: "from-indigo-500 to-indigo-600",  badge: "bg-indigo-100 text-indigo-700" },
  revise:         { emoji: "🔄", label: "Revise",         gradient: "from-amber-500 to-orange-500",   badge: "bg-amber-100 text-amber-700" },
  challenge:      { emoji: "🔥", label: "Challenge",      gradient: "from-rose-500 to-pink-600",      badge: "bg-rose-100 text-rose-700" },
  review_mistake: { emoji: "🎯", label: "Focus Practice", gradient: "from-purple-500 to-purple-600",  badge: "bg-purple-100 text-purple-700" },
  continue_path:  { emoji: "🚀", label: "Keep Going",     gradient: "from-emerald-500 to-teal-600",   badge: "bg-emerald-100 text-emerald-700" },
};

function modeToParam(mode: SessionMode): string {
  switch (mode) {
    case "guided":    return "guided";
    case "revision":  return "review";
    case "challenge": return "daily_challenge";
    case "focus":     return "topic_practice";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NextActionCard() {
  const { action, loading, error } = useLearningNext();

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-100 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-200 rounded-full w-48" />
            <div className="h-4 bg-slate-100 rounded-full w-64" />
          </div>
          <div className="h-10 w-24 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error or no recommendation — hide silently (dashboard still functional)
  if (error || !action) return null;

  const config = ACTION_CONFIG[action.type];
  const practiceUrl = `/practice?topicId=${action.topicId}&mode=${modeToParam(action.sessionMode)}`;

  return (
    <div className="bg-white rounded-3xl shadow-md border border-indigo-100/60 overflow-hidden">
      {/* Gradient accent bar */}
      <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shrink-0 shadow-lg`}>
            {config.emoji}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${config.badge}`}>
                {config.label}
              </span>
              {action.sourceSignals.masteryReady && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Almost mastered!
                </span>
              )}
            </div>

            <h3 className="font-black text-gray-800 text-lg leading-snug truncate">
              {action.topicName}
            </h3>

            <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">
              {action.reason}
            </p>

            {/* Encouragement */}
            <p className="text-xs text-indigo-500 font-semibold mt-2">
              {action.encouragement}
            </p>

            {/* Session details strip */}
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              <span>{action.recommendedQuestionCount} questions</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="capitalize">{action.difficulty} difficulty</span>
              {action.confidenceTarget && (
                <>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Target: {action.confidenceTarget}% confidence</span>
                </>
              )}
            </div>
          </div>

          {/* CTA */}
          <Link
            href={practiceUrl}
            className={`shrink-0 bg-gradient-to-r ${config.gradient} text-white px-5 py-2.5 rounded-2xl font-bold hover:opacity-90 transition text-sm shadow-md self-center`}
          >
            Start →
          </Link>
        </div>
      </div>
    </div>
  );
}
