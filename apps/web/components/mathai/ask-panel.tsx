/**
 * @module components/mathai/ask-panel
 *
 * Slide-up panel that renders the AI response from POST /api/tutor/ask.
 * Consumes AskMathAIResponse (explanation, steps, example, visualPlan,
 * followUp, encouragement) — the real backend shape, not the mock TutorResponse.
 */

"use client";

import { cn }            from "@/lib/utils";
import type { AskMathAIResponse } from "@/types";
import { VisualRenderer } from "./visual";

// ─── Component ────────────────────────────────────────────────────────────────

interface AskPanelProps {
  question:  string;
  response?: AskMathAIResponse | null;
  loading?:  boolean;
  error?:    string | null;
  onClose:   () => void;
  className?: string;
}

export function AskPanel({
  question,
  response,
  loading = false,
  error   = null,
  onClose,
  className,
}: AskPanelProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl",
        "flex flex-col max-h-[88vh]",
        className,
      )}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-gray-200" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-2 pb-3 border-b border-gray-100">
        <div className="text-2xl mt-0.5">🤖</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-0.5">
            Ask MathAI
          </p>
          <p className="text-sm text-gray-700 font-medium leading-snug line-clamp-2">
            {question}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-indigo-500 font-semibold text-sm">
              MathAI is thinking…
            </p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Preparing a personalised explanation just for you!
            </p>
          </div>
        )}

        {/* ── Error state ───────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="text-4xl">😓</div>
            <p className="font-bold text-gray-700">Something went wrong</p>
            <p className="text-sm text-gray-500 text-center max-w-xs">{error}</p>
            <p className="text-xs text-indigo-400">
              Try rephrasing your question and ask again!
            </p>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!loading && !error && !response && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="text-4xl">💭</div>
            <p className="text-sm text-gray-400 text-center">
              No answer yet — try submitting your question.
            </p>
          </div>
        )}

        {/* ── Success: render real AI response ──────────────────────────── */}
        {!loading && !error && response && (
          <>
            {/* Visual diagram (if applicable) */}
            {response.visualPlan && response.visualPlan.diagramType !== "none" && (
              <div className="rounded-2xl overflow-hidden bg-indigo-50 p-3">
                <VisualRenderer plan={response.visualPlan} animated />
              </div>
            )}

            {/* Main explanation */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">
                Explanation
              </p>
              <p className="text-gray-800 text-sm leading-relaxed font-medium">
                {response.explanation}
              </p>
            </div>

            {/* Step-by-step breakdown */}
            {response.steps && response.steps.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Step by Step
                </p>
                <ol className="space-y-3">
                  {response.steps.map((step) => (
                    <li key={step.stepNumber} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                        {step.stepNumber}
                      </span>
                      <div className="pt-0.5">
                        <p className="text-sm text-gray-700 leading-snug">
                          {step.instruction}
                        </p>
                        {step.formula && (
                          <code className="mt-1 block text-xs bg-gray-100 rounded px-2 py-1 font-mono text-indigo-700">
                            {step.formula}
                          </code>
                        )}
                        {step.visualCue && (
                          <p className="mt-1 text-xs text-slate-400 italic">
                            💡 {step.visualCue}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Worked example */}
            {response.example && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                  Worked Example
                </p>
                <p className="text-sm font-semibold text-amber-900">
                  {response.example.problem}
                </p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  {response.example.solution}
                </p>
                <div className="flex items-start gap-2 pt-1">
                  <span className="text-base">🔑</span>
                  <p className="text-xs text-amber-700 font-semibold">
                    {response.example.keyInsight}
                  </p>
                </div>
              </div>
            )}

            {/* Follow-up nudge */}
            {response.followUp && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <span className="text-xl shrink-0">🚀</span>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                    Explore Next
                  </p>
                  <p className="text-sm text-emerald-800">
                    {response.followUp}
                  </p>
                </div>
              </div>
            )}

            {/* Encouragement */}
            {response.encouragement && (
              <p className="text-center text-sm text-indigo-400 font-semibold italic py-2">
                {response.encouragement} ✨
              </p>
            )}
          </>
        )}

      </div>
    </div>
  );
}
