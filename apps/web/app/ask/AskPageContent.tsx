/**
 * @module app/ask/AskPageContent
 *
 * Full-page Ask MathAI experience — full question input + full response view
 * (not a slide-up panel like on dashboard — dedicated screen).
 */

"use client";

import { useState, useRef, useCallback }  from "react";
import { cn }                from "@/lib/utils";
import { clientPost }        from "@/lib/clientApi";
import { useProfile }        from "@/hooks/use-profile";
import { VisualRenderer }    from "@/components/mathai/visual";
import type { AskMathAIResponse } from "@/types";

const SUGGESTIONS = [
  "What are fractions and how do they work?",
  "Explain long division step by step",
  "How do I find the area of a rectangle?",
  "What is the difference between multiplication and division?",
  "How do percentages work?",
  "Explain place value with an example",
];

type ConversationItem = {
  id:       string;
  question: string;
  response: AskMathAIResponse | null;
  error:    string | null;
  loading:  boolean;
};

export default function AskPageContent() {
  const { profile } = useProfile();
  const [question,      setQuestion]      = useState("");
  const [conversation,  setConversation]  = useState<ConversationItem[]>([]);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);

  const grade = profile?.grade ?? "G4";

  async function handleSubmit() {
    const q = question.trim();
    if (!q) return;

    const id = `${Date.now()}`;
    setConversation((prev) => [
      ...prev,
      { id, question: q, response: null, error: null, loading: true },
    ]);
    setQuestion("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 20_000);

    try {
      const data = await clientPost<AskMathAIResponse>(
        "/tutor/ask",
        { question: q, grade },
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      setConversation((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                response: data,
                error:    data ? null : "MathAI couldn't answer right now — please try again.",
                loading:  false,
              }
            : item
        )
      );
    } catch (e) {
      clearTimeout(timeout);
      const isTimeout = e instanceof Error && e.name === "AbortError";
      setConversation((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                error:   isTimeout
                  ? "Request timed out — please try again."
                  : "Connection error. Check your network and try again.",
                loading: false,
              }
            : item
        )
      );
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  /** Grow the textarea to fit its content, up to max-h-32 (8rem). */
  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, []);

  return (
    <div
      className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col"
      style={{ minHeight: "100dvh" }}
    >

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-indigo-100/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow">
            🤖
          </div>
          <div>
            <h1 className="font-black text-xl text-gray-800 leading-tight">Ask MathAI</h1>
            <p className="text-xs text-slate-400">
              Grade {grade.replace("G", "")} · Your personal math tutor
            </p>
          </div>
        </div>
      </header>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

          {/* Empty state / suggestions */}
          {conversation.length === 0 && (
            <div className="text-center py-8 space-y-6">
              <div className="text-6xl">🤖</div>
              <div>
                <h2 className="font-black text-2xl text-gray-800 mb-2">
                  Hi! I&apos;m MathAI
                </h2>
                <p className="text-slate-500 text-sm">
                  Ask me any math question — I&apos;ll explain it clearly, step by step.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuestion(s); inputRef.current?.focus(); }}
                    className="bg-white border border-indigo-100 rounded-2xl p-4 text-sm text-gray-700 font-medium text-left hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation items */}
          {conversation.map((item) => (
            <div key={item.id} className="space-y-4">
              {/* Student question bubble */}
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-3xl rounded-br-lg px-5 py-3 max-w-xs sm:max-w-sm shadow-md">
                  <p className="text-sm font-medium">{item.question}</p>
                </div>
              </div>

              {/* AI response */}
              <div className="flex justify-start">
                <div className="flex-1 max-w-2xl space-y-4">
                  {/* Loading */}
                  {item.loading && (
                    <div className="flex items-center gap-3 bg-white rounded-3xl px-5 py-4 shadow-sm border border-indigo-100">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0" />
                      <p className="text-indigo-500 font-semibold text-sm">Thinking…</p>
                    </div>
                  )}

                  {/* Error */}
                  {!item.loading && item.error && (
                    <div className="bg-red-50 border border-red-200 rounded-3xl px-5 py-4">
                      <p className="text-red-600 text-sm font-semibold">{item.error}</p>
                    </div>
                  )}

                  {/* Response */}
                  {!item.loading && !item.error && item.response && (
                    <ResponseCard response={item.response} />
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* Input bar — sticky above keyboard on mobile via env(safe-area-inset-bottom) */}
      <div
        className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 shadow-lg"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={question}
              onChange={(e) => { setQuestion(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey}
              placeholder="Ask a math question…"
              className={cn(
                "flex-1 resize-none rounded-2xl px-4 py-3 text-sm font-medium",
                "border-2 border-indigo-100 focus:border-indigo-400 outline-none transition",
                "bg-white shadow-sm max-h-32 overflow-y-auto",
              )}
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={!question.trim()}
              className={cn(
                "px-5 py-3 rounded-2xl font-black text-sm transition shrink-0",
                question.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}
            >
              Ask →
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Press Enter to ask · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Response card sub-component ─────────────────────────────────────────────

function ResponseCard({ response }: { response: AskMathAIResponse }) {
  return (
    <div className="space-y-4">
      {/* Visual */}
      {response.visualPlan && response.visualPlan.diagramType !== "none" && (
        <div className="bg-indigo-50 rounded-3xl p-4 border border-indigo-100">
          <VisualRenderer plan={response.visualPlan} animated />
        </div>
      )}

      {/* Explanation */}
      <div className="bg-white rounded-3xl rounded-tl-lg px-5 py-4 shadow-sm border border-indigo-100">
        <p className="text-gray-800 text-sm leading-relaxed">{response.explanation}</p>
      </div>

      {/* Steps */}
      {response.steps && response.steps.length > 0 && (
        <div className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-purple-100 space-y-3">
          <p className="text-xs font-bold text-purple-500 uppercase tracking-widest">Step by Step</p>
          <ol className="space-y-3">
            {response.steps.map((step) => (
              <li key={step.stepNumber} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center">
                  {step.stepNumber}
                </span>
                <div>
                  <p className="text-sm text-gray-700">{step.instruction}</p>
                  {step.formula && (
                    <code className="mt-1 block text-xs bg-gray-100 rounded px-2 py-1 font-mono text-purple-700">
                      {step.formula}
                    </code>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Example */}
      {response.example && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl px-5 py-4 space-y-2">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Worked Example</p>
          <p className="text-sm font-semibold text-amber-900">{response.example.problem}</p>
          <p className="text-sm text-amber-800">{response.example.solution}</p>
          <p className="text-xs text-amber-700 font-semibold">🔑 {response.example.keyInsight}</p>
        </div>
      )}

      {/* Follow-up + encouragement */}
      {response.followUp && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl px-5 py-3">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Explore Next</p>
          <p className="text-sm text-emerald-800">{response.followUp}</p>
        </div>
      )}
      {response.encouragement && (
        <p className="text-center text-xs text-indigo-400 font-semibold italic">
          {response.encouragement} ✨
        </p>
      )}
    </div>
  );
}
