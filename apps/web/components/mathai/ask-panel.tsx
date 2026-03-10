/**
 * @module components/mathai/ask-panel
 *
 * Slide-up panel rendered when a student asks a math question.
 * Shows mode selector tabs, the AI response text, and optional VisualRenderer.
 *
 * Wave 1: mock response fixture.
 * Wave 2: parent calls POST /api/tutor/ask and passes TutorResponse here.
 */

"use client";

import { useState } from "react";
import { cn }       from "@/lib/utils";
import type { HelpMode, TutorResponse, TutorStep } from "@/types";
import { VisualRenderer } from "./visual";

// ─── Help mode config ────────────────────────────────────────────────────────

interface HelpModeOption {
  mode:  HelpMode;
  label: string;
  icon:  string;
}

const HELP_MODES: HelpModeOption[] = [
  { mode: "teach_concept",   label: "Explain",    icon: "🎨" },
  { mode: "next_step",       label: "Step by Step", icon: "🪜" },
  { mode: "similar_example", label: "Example",    icon: "💡" },
  { mode: "explain_fully",   label: "Simplify",   icon: "✨" },
];

// ─── Mock response factory ────────────────────────────────────────────────────

function mockResponse(question: string, mode: HelpMode): TutorResponse {
  const base: TutorResponse = {
    helpMode:     mode,
    encouragement: "Great question! You're thinking like a mathematician.",
    content: {
      text: mode === "next_step"
        ? "Let me break this down step by step for you!"
        : mode === "teach_concept"
        ? "Here's a visual to help you see this clearly."
        : mode === "similar_example"
        ? "Try this: if you have 2 groups of 3 apples, how many apples are there in total?"
        : "Let's make this simpler: just think about groups of equal size.",
      steps: mode === "next_step"
        ? ([
            { stepNumber: 1, instruction: "Read the problem carefully and identify what you're asked to find." },
            { stepNumber: 2, instruction: "Look for the numbers and the operation needed." },
            { stepNumber: 3, instruction: "Calculate and double-check your answer." },
          ] as TutorStep[])
        : undefined,
    },
    visualPlan: mode === "teach_concept"
      ? {
          diagramType: "array",
          data: { rows: 3, cols: 4, highlightGroups: [
            { start: 0,  size: 4, color: "#6366f1" },
            { start: 4,  size: 4, color: "#10b981" },
            { start: 8,  size: 4, color: "#f59e0b" },
          ] },
        }
      : undefined,
  };
  void question; // used in Wave 2
  return base;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AskPanelProps {
  question:  string;
  grade:     string;
  response?: TutorResponse | null;
  loading?:  boolean;
  onClose:   () => void;
  className?: string;
}

export function AskPanel({
  question,
  grade,
  response,
  loading = false,
  onClose,
  className,
}: AskPanelProps) {
  const [mode, setMode] = useState<HelpMode>("teach_concept");
  void grade; // used in Wave 2

  const data = response ?? (loading ? null : mockResponse(question, mode));

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl",
        "flex flex-col max-h-[85vh]",
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

      {/* Mode tabs */}
      <div className="flex gap-2 px-5 pt-3 pb-2 overflow-x-auto scrollbar-none">
        {HELP_MODES.map((hm) => (
          <button
            key={hm.mode}
            onClick={() => setMode(hm.mode)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
              "whitespace-nowrap border transition",
              mode === hm.mode
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300",
            )}
          >
            <span>{hm.icon}</span>
            <span>{hm.label}</span>
          </button>
        ))}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
        {loading || !data ? (
          <div className="flex items-center gap-3 py-8">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-indigo-500 font-semibold">Thinking…</p>
          </div>
        ) : (
          <>
            {/* Visual diagram */}
            {data.visualPlan && data.visualPlan.diagramType !== "none" && (
              <VisualRenderer plan={data.visualPlan} animated />
            )}

            {/* Text explanation */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {data.content.text}
            </p>

            {/* Numbered steps */}
            {data.content.steps && data.content.steps.length > 0 && (
              <ol className="space-y-2">
                {data.content.steps.map((step) => (
                  <li key={step.stepNumber} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <p className="text-sm text-gray-700 pt-0.5 leading-snug">
                      {step.instruction}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {/* Similar example */}
            {data.similarExample && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
                  Try This
                </p>
                <p className="text-sm text-amber-900">{data.similarExample.questionText}</p>
                <p className="text-xs text-amber-700 mt-2 font-semibold">
                  Key insight: {data.similarExample.keyInsight}
                </p>
              </div>
            )}

            {/* Encouragement */}
            <p className="text-xs text-indigo-400 font-medium italic text-center">
              {data.encouragement}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
