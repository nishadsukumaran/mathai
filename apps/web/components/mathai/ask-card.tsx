/**
 * @module components/mathai/ask-card
 *
 * Dashboard "Ask MathAI" card — a prominent text-input entrypoint
 * that opens AskPanel when the student types a question and presses Go.
 *
 * Designed to sit near the top of the dashboard above the practice sections.
 */

"use client";

import { useState, useRef } from "react";
import { cn }               from "@/lib/utils";
import { AskPanel }         from "./ask-panel";
import type { Grade }       from "@/types";

interface AskCardProps {
  grade:     Grade;
  className?: string;
}

const PLACEHOLDER_HINTS = [
  "Why do we carry the 1?",
  "What are fractions?",
  "How do I divide big numbers?",
  "What is 3 × 7?",
  "Explain place value to me",
];

export function AskCard({ grade, className }: AskCardProps) {
  const [question,   setQuestion]   = useState("");
  const [submitted,  setSubmitted]  = useState("");
  const [panelOpen,  setPanelOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholder text to show students what they can ask
  const [placeholderIdx] = useState(
    () => Math.floor(Math.random() * PLACEHOLDER_HINTS.length)
  );

  function handleSubmit() {
    const q = question.trim();
    if (!q) return;
    setSubmitted(q);
    setPanelOpen(true);
    setQuestion("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <>
      <div
        className={cn(
          "bg-gradient-to-r from-indigo-500 to-purple-600",
          "rounded-3xl shadow-lg p-5 text-white",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-black text-base leading-tight">Ask MathAI</p>
            <p className="text-indigo-200 text-xs leading-tight">
              Got a maths question? Just ask!
            </p>
          </div>
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_HINTS[placeholderIdx]}
            className={cn(
              "flex-1 bg-white/20 placeholder-indigo-200 text-white",
              "rounded-2xl px-4 py-2.5 text-sm font-medium outline-none",
              "border border-white/30 focus:border-white/70 transition",
            )}
          />
          <button
            onClick={handleSubmit}
            disabled={!question.trim()}
            className={cn(
              "px-4 py-2.5 rounded-2xl font-black text-sm transition",
              question.trim()
                ? "bg-white text-indigo-600 hover:bg-indigo-50"
                : "bg-white/20 text-white/40 cursor-not-allowed",
            )}
          >
            Go →
          </button>
        </div>

        {/* Quick-ask chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none">
          {["What is…?", "How do I…?", "Why does…?"].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setQuestion(chip.replace("?", " "));
                inputRef.current?.focus();
              }}
              className="flex-shrink-0 bg-white/15 hover:bg-white/25 transition text-xs font-semibold px-3 py-1 rounded-full border border-white/20"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Slide-up panel */}
      {panelOpen && submitted && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />
          <AskPanel
            question={submitted}
            grade={grade}
            onClose={() => setPanelOpen(false)}
          />
        </>
      )}
    </>
  );
}
