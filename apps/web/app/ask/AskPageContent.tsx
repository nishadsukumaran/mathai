/**
 * @module app/ask/AskPageContent
 *
 * Full-page Ask MathAI experience — full question input + full response view
 * (not a slide-up panel like on dashboard — dedicated screen).
 */

"use client";

import { useState, useRef, useCallback, useEffect }  from "react";
import { cn }                from "@/lib/utils";
import { clientPost }        from "@/lib/clientApi";
import { useProfile }        from "@/hooks/use-profile";
import { VisualRenderer }    from "@/components/mathai/visual";
import { MathText }          from "@/components/shared/MathText";
import type { AskMathAIResponse } from "@/types";

// ─── Grade-based suggestions aligned to Cambridge Primary/Lower Secondary ────
// Each grade maps to Cambridge stage topics so students see relevant questions.

const SUGGESTIONS_BY_GRADE: Record<string, string[]> = {
  G1: [
    "How do I count to 100?",
    "What are tens and ones?",
    "How do I add numbers to 20?",
    "What are number bonds to 10?",
    "How do I take away numbers?",
    "What are 2D shapes like circles and squares?",
    "How do I compare which number is bigger?",
    "How do I use a number line?",
  ],
  G2: [
    "How do I add two-digit numbers?",
    "What is subtraction with regrouping?",
    "How do I count in 2s, 5s, and 10s?",
    "What are halves and quarters?",
    "How do I tell the time on a clock?",
    "What are 3D shapes?",
    "How do I measure length in centimetres?",
    "How do I solve simple word problems?",
  ],
  G3: [
    "How do I multiply numbers?",
    "What are multiplication tables?",
    "How does division work?",
    "What are fractions like 1/2, 1/3, and 1/4?",
    "How do I measure in metres and kilometres?",
    "What are right angles?",
    "How do I read a bar chart?",
    "How do I round numbers to the nearest 10?",
  ],
  G4: [
    "How do I do long multiplication?",
    "What are equivalent fractions?",
    "How do I add and subtract fractions?",
    "What are decimal numbers?",
    "How do I find the perimeter of a shape?",
    "What are lines of symmetry?",
    "How do I read and plot coordinates?",
    "What are factors and multiples?",
  ],
  G5: [
    "How do I multiply and divide decimals?",
    "What are improper fractions and mixed numbers?",
    "How do I calculate the area of a rectangle?",
    "What are percentages and how do they work?",
    "How do I convert between fractions, decimals, and percentages?",
    "What are angles in a triangle?",
    "How do I calculate the mean of a set of numbers?",
    "What are prime numbers and composite numbers?",
  ],
  G6: [
    "How do I divide fractions?",
    "What is ratio and proportion?",
    "How do I calculate the area of a triangle?",
    "What is the order of operations (BODMAS)?",
    "How do I work with negative numbers?",
    "What are algebraic expressions?",
    "How do I calculate the volume of a cuboid?",
    "How does probability work with dice and coins?",
  ],
  G7: [
    "How do I solve linear equations?",
    "What are integers and how do I add/subtract them?",
    "How do I calculate with percentages (increase/decrease)?",
    "What are the properties of parallel and perpendicular lines?",
    "How do I plot and interpret line graphs?",
    "What is the circumference of a circle?",
    "How do I simplify algebraic expressions?",
    "What is the difference between theoretical and experimental probability?",
  ],
  G8: [
    "How do I solve simultaneous equations?",
    "What are indices and powers?",
    "How do I factorise algebraic expressions?",
    "What is Pythagoras' theorem?",
    "How do I calculate the area of a circle?",
    "What are inequalities and how do I solve them?",
    "How do I construct and interpret pie charts?",
    "What are standard form and scientific notation?",
  ],
};

// Fallback for grades not in the map
const FALLBACK_SUGGESTIONS: string[] = SUGGESTIONS_BY_GRADE["G4"] ?? [];

/** Pick N random suggestions based on student's grade, fresh each mount */
function pickSuggestions(grade: string, count: number): string[] {
  const pool: string[] = SUGGESTIONS_BY_GRADE[grade] ?? FALLBACK_SUGGESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type ConversationItem = {
  id:       string;
  question: string;
  response: AskMathAIResponse | null;
  error:    string | null;
  loading:  boolean;
};

interface AskPageContentProps {
  /** If set (from ?q= URL param), auto-submit this question on mount */
  initialQuestion?: string;
}

export default function AskPageContent({ initialQuestion = "" }: AskPageContentProps) {
  const { profile } = useProfile();
  const [question,      setQuestion]      = useState("");
  const [conversation,  setConversation]  = useState<ConversationItem[]>([]);
  const inputRef         = useRef<HTMLTextAreaElement>(null);
  const bottomRef        = useRef<HTMLDivElement>(null);
  const autoSubmittedRef = useRef(false);

  const grade = profile?.grade ?? "G4";

  // Pick 6 random suggestions based on grade — refreshes when grade changes
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    setSuggestions(pickSuggestions(grade, 6));
  }, [grade]);

  async function handleSubmit(overrideQ?: string) {
    const q = (overrideQ !== undefined ? overrideQ : question).trim();
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

  // ── Auto-submit when coming from practice "Teach Me" button ─────────────────
  // Runs once on mount; profile grade must be loaded first for a good response.
  useEffect(() => {
    if (!initialQuestion || autoSubmittedRef.current) return;
    // Wait until profile has resolved so the grade is correct in the AI prompt
    if (!profile) return;
    autoSubmittedRef.current = true;
    void handleSubmit(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, profile]);

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
          <div className="flex-1">
            <h1 className="font-black text-xl text-gray-800 leading-tight">Ask MathAI</h1>
            <p className="text-xs text-slate-400">
              Grade {grade.replace("G", "")} · Your personal math tutor
            </p>
          </div>
          {conversation.length > 0 && (
            <button
              onClick={() => setConversation([])}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 shrink-0"
              title="Start a new conversation"
            >
              New chat ↺
            </button>
          )}
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
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => void handleSubmit(s)}
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

// ─── Inline markdown renderer ─────────────────────────────────────────────────
// Handles **bold** and *italic* from AI responses without pulling in a full parser.

function renderMd(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// ─── Response card sub-component ─────────────────────────────────────────────

function ResponseCard({ response }: { response: AskMathAIResponse }) {
  const [visualPlan, setVisualPlan] = useState(response.visualPlan ?? null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);

  // Show existing static diagrams (number_line, fraction_bar, etc.) automatically
  const hasStaticDiagram = visualPlan &&
    visualPlan.diagramType !== "none" &&
    visualPlan.diagramType !== "concept_image" &&
    visualPlan.diagramType !== "animated_walkthrough";

  // Show concept_image or animated_walkthrough only after generation
  const hasGeneratedVisual = visualPlan &&
    (visualPlan.diagramType === "concept_image" || visualPlan.diagramType === "animated_walkthrough");

  // Can generate a visual on demand if AI suggested concept_image
  const canGenerateVisual = (response as any).visualStrategy === "concept_image" &&
    (response as any).imagePrompt &&
    (response as any).conceptKey &&
    !hasGeneratedVisual;

  const handleGenerateVisual = useCallback(async () => {
    const r = response as any;
    if (!r.imagePrompt || !r.conceptKey) return;

    setVisualLoading(true);
    setVisualError(null);
    try {
      const result = await clientPost<{ diagramType: string; data: any }>("/tutor/generate-visual", {
        imagePrompt: r.imagePrompt,
        conceptKey: r.conceptKey,
        altText: r.imagePrompt,
        caption: r.imagePrompt,
      });
      if (result) {
        setVisualPlan(result as any);
      } else {
        setVisualError("Failed to generate visual. Please try again.");
      }
    } catch {
      setVisualError("Failed to generate visual. Please try again.");
    } finally {
      setVisualLoading(false);
    }
  }, [response]);

  return (
    <div className="space-y-4">
      {/* Static diagrams render automatically */}
      {hasStaticDiagram && (
        <VisualRenderer plan={visualPlan!} animated />
      )}

      {/* Generated visuals (concept_image, animated_walkthrough) render after button click */}
      {hasGeneratedVisual && (
        <VisualRenderer plan={visualPlan!} animated />
      )}

      {/* "Show Visual" button — appears when AI suggests a concept image */}
      {canGenerateVisual && !visualLoading && (
        <button
          onClick={handleGenerateVisual}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-indigo-300 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 hover:border-indigo-400 transition flex items-center justify-center gap-2"
        >
          <span>Show Visual Explanation</span>
        </button>
      )}

      {/* Loading state */}
      {visualLoading && (
        <div className="w-full py-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-indigo-700 animate-spin" />
          <span className="text-indigo-600 text-sm font-medium">Generating visual...</span>
        </div>
      )}

      {/* Error state */}
      {visualError && (
        <div className="w-full py-3 rounded-2xl bg-red-50 border border-red-200 text-center">
          <p className="text-red-600 text-sm">{visualError}</p>
          <button onClick={handleGenerateVisual} className="text-red-500 text-xs underline mt-1">Try again</button>
        </div>
      )}

      {/* Explanation */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
        <p className="text-gray-800 text-sm leading-relaxed">
          <MathText text={response.explanation} />
        </p>
      </div>

      {/* Steps */}
      {response.steps && response.steps.length > 0 && (
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Step by Step</p>
          <ol className="space-y-3">
            {response.steps.map((step) => (
              <li key={step.stepNumber} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {step.stepNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700"><MathText text={step.instruction} /></p>
                  {step.formula && (
                    <div className="mt-1 text-sm bg-gray-50 rounded-lg px-3 py-1.5 text-indigo-700 overflow-x-auto">
                      <MathText text={`\\(${step.formula}\\)`} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Example */}
      {response.example && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl px-5 py-4 space-y-2">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Worked Example</p>
          <p className="text-sm font-semibold text-amber-900"><MathText text={response.example.problem} /></p>
          <p className="text-sm text-amber-800"><MathText text={response.example.solution} /></p>
          <p className="text-xs text-amber-700 font-semibold">🔑 <MathText text={response.example.keyInsight} /></p>
        </div>
      )}

      {/* Follow-up */}
      {response.followUp && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl px-5 py-3">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Explore Next</p>
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
