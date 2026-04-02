"use client";

/**
 * @module app/parent/ask/page
 *
 * Ask MathAI for Parents — reuses the existing Ask AI system
 * but with parent-specific suggestions and tone context.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence }                   from "framer-motion";
import { cn }           from "@/lib/utils";
import { clientPost }   from "@/lib/clientApi";
import { MathText }     from "@/components/shared/MathText";
import type { AskMathAIResponse } from "@/types";

const PARENT_SUGGESTIONS = [
  "How do I explain fractions to my child?",
  "Why is my child struggling with division?",
  "What are fun ways to practice multiplication?",
  "How can I help with maths homework without doing it for them?",
  "My child rushes through problems — how can I help?",
  "What does 'mastery' mean in MathAI?",
];

type ConversationItem = {
  id: string; question: string; response: AskMathAIResponse | null;
  error: string | null; loading: boolean;
};

export default function ParentAskPage() {
  const [question, setQuestion]         = useState("");
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(overrideQ?: string) {
    const q = (overrideQ ?? question).trim();
    if (!q) return;

    const id = `${Date.now()}`;
    setConversation((prev) => [...prev, { id, question: q, response: null, error: null, loading: true }]);
    setQuestion("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      // Reuse the existing Ask MathAI endpoint — add parent context
      const data = await clientPost<AskMathAIResponse>(
        "/tutor/ask",
        { question: `[Parent asking] ${q}`, grade: "G4" },
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      setConversation((prev) =>
        prev.map((item) => item.id === id
          ? { ...item, response: data, error: data ? null : "Could not get a response.", loading: false }
          : item
        )
      );
    } catch {
      setConversation((prev) =>
        prev.map((item) => item.id === id
          ? { ...item, error: "Request failed. Please try again.", loading: false }
          : item
        )
      );
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSubmit(); }
  }

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, []);

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow">
            🤖
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg text-gray-900">Ask MathAI — For Parents</h1>
            <p className="text-xs text-gray-400">Get help explaining maths concepts to your child</p>
          </div>
          {conversation.length > 0 && (
            <button onClick={() => setConversation([])}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition px-3 py-1.5 rounded-xl border border-gray-200">
              New chat
            </button>
          )}
        </div>
      </header>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

          {/* Empty state */}
          {conversation.length === 0 && (
            <div className="text-center py-8 space-y-6">
              <p className="text-5xl">👨‍👩‍👧</p>
              <div>
                <h2 className="font-bold text-xl text-gray-900 mb-1">How can I help?</h2>
                <p className="text-gray-500 text-sm">Ask me anything about helping your child with maths.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {PARENT_SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => void handleSubmit(s)}
                    className="bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-600 font-medium text-left hover:border-indigo-300 hover:shadow-sm transition active:scale-[0.98]">
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {conversation.map((item) => (
            <div key={item.id} className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-sm shadow-sm">
                  <p className="text-sm">{item.question.replace("[Parent asking] ", "")}</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="flex-1 max-w-2xl">
                  {item.loading && (
                    <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                      <p className="text-indigo-500 font-medium text-sm">Thinking…</p>
                    </div>
                  )}
                  {!item.loading && item.error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                      <p className="text-red-600 text-sm">{item.error}</p>
                    </div>
                  )}
                  {!item.loading && item.response && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                        <p className="text-gray-800 text-sm leading-relaxed">
                          <MathText text={item.response.explanation} />
                        </p>
                      </div>
                      {item.response.steps && item.response.steps.length > 0 && (
                        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 space-y-2">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Steps</p>
                          {item.response.steps.map((step) => (
                            <div key={step.stepNumber} className="flex gap-2 items-start">
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {step.stepNumber}
                              </span>
                              <p className="text-sm text-gray-700"><MathText text={step.instruction} /></p>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.response.example && (
                        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl px-4 py-3">
                          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Example</p>
                          <p className="text-sm text-amber-800"><MathText text={item.response.example.solution} /></p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 shadow-lg"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <div className="flex gap-3 items-end">
            <textarea ref={inputRef} rows={1} value={question}
              onChange={(e) => { setQuestion(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey} placeholder="Ask about helping your child with maths…"
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm border-2 border-gray-200 focus:border-indigo-400 outline-none transition bg-white max-h-32 overflow-y-auto" />
            <button onClick={() => void handleSubmit()} disabled={!question.trim()}
              className={cn("px-5 py-3 rounded-xl font-semibold text-sm transition shrink-0 active:scale-[0.98]",
                question.trim() ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
              Ask →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
