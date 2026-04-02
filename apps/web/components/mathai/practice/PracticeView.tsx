"use client";

/**
 * @module apps/web/components/mathai/practice/PracticeView
 *
 * Pure view component for the practice session screen.
 * Clean, centered layout with clear visual hierarchy per state.
 */

import { useRouter } from "next/navigation";
import type { PracticeQuestionItem, SubmitResultView } from "@/types/contracts";
import type { VisualPlan, SessionNextStep } from "@mathai/shared-types";
import { VisualRenderer } from "@/components/mathai/visual/VisualRenderer";
import { MathText }       from "@/components/shared/MathText";

interface SessionState {
  id: string; questions: PracticeQuestionItem[]; currentIndex: number; xpEarned: number;
}

interface Props {
  session: SessionState | null; currentQuestion: PracticeQuestionItem | null;
  answer: string; result: SubmitResultView | null; hint: string | null;
  hintVisualPlan: VisualPlan | null; loading: boolean; error: string | null;
  xpAnim: number | null; hintsUsed: number;
  authStatus: "loading" | "authenticated" | "unauthenticated";
  confidenceBefore: number | null; onConfidenceChange: (v: number) => void;
  onAnswerChange: (v: string) => void; onSubmit: () => void;
  onNextQuestion: () => void; onGetHint: () => void; onTeachMe: () => void;
  onRetry: () => void; onRestart: () => void;
  adaptation: SessionNextStep | null;
}

const CONFIDENCE = [
  { emoji: "😕", label: "Not sure" }, { emoji: "😐", label: "Bit unsure" },
  { emoji: "🙂", label: "Think so" }, { emoji: "😊", label: "Pretty sure" },
  { emoji: "😎", label: "Confident!" },
];

export default function PracticeView(props: Props) {
  const {
    session, currentQuestion, answer, result, hint, hintVisualPlan,
    loading, error, xpAnim, hintsUsed, authStatus, confidenceBefore,
    onConfidenceChange, onAnswerChange, onSubmit, onNextQuestion,
    onGetHint, onTeachMe, onRetry, onRestart, adaptation,
  } = props;
  const router   = useRouter();
  const totalQ   = session?.questions.length ?? 5;
  const idx      = session?.currentIndex ?? 0;
  const progress = totalQ > 0 ? Math.round((idx / totalQ) * 100) : 0;

  // ── Loading / Auth states ──────────────────────────────────────────────

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return <CenterScreen><p className="text-indigo-600 font-semibold text-sm animate-pulse">Checking session...</p></CenterScreen>;
  }
  if (loading && !session) {
    return <CenterScreen><p className="text-indigo-600 font-semibold text-sm animate-pulse">Loading practice...</p></CenterScreen>;
  }
  if (error) {
    return (
      <CenterScreen>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 text-center max-w-sm w-full">
          <p className="text-red-600 font-semibold text-sm mb-4">{error}</p>
          <button onClick={onRetry} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition mb-2">Try Again</button>
          <button onClick={() => router.push("/dashboard")} className="w-full text-gray-400 py-2 text-sm font-medium hover:text-gray-600 transition">Dashboard</button>
        </div>
      </CenterScreen>
    );
  }

  // ── Session complete ──────────────────────────────────────────────

  if (session && idx >= totalQ) {
    return (
      <CenterScreen>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center max-w-sm w-full">
          <p className="text-5xl mb-3">🎉</p>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Session Complete!</h2>
          <p className="text-gray-500 text-sm mb-6">
            You earned <span className="font-bold text-indigo-600">+{session.xpEarned} XP</span>
          </p>
          <div className="space-y-2">
            <button onClick={onRestart} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">Practice Again</button>
            <button onClick={() => router.push("/dashboard")} className="w-full bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">Dashboard</button>
            <button onClick={() => router.push("/progress")} className="w-full text-gray-400 py-2 text-xs hover:text-gray-600 transition">View Progress →</button>
          </div>
        </div>
      </CenterScreen>
    );
  }

  // ── Active question ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">

      {/* XP animation */}
      {xpAnim && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-xl font-bold text-emerald-500 animate-bounce z-50 pointer-events-none">
          +{xpAnim} XP ✨
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-600 text-sm font-medium transition" aria-label="Exit">
            ← Exit
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium shrink-0">{idx + 1}/{totalQ}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {session && <span className="text-xs font-semibold text-indigo-600 shrink-0">+{session.xpEarned} XP</span>}
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        {currentQuestion && (
          <div className="w-full max-w-xl space-y-4">

            {/* Question card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                  {currentQuestion.difficulty}
                </span>
                <span className="text-[10px] text-gray-300 font-medium">{currentQuestion.xpReward} XP</span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 leading-relaxed mb-5">
                <MathText text={currentQuestion.prompt} />
              </h2>

              {/* Confidence check-in (pre-answer) */}
              {!result && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">How confident?</p>
                  <div className="flex gap-1.5">
                    {CONFIDENCE.map((c, i) => {
                      const level = i + 1;
                      const sel = confidenceBefore === level;
                      return (
                        <button key={level} onClick={() => onConfidenceChange(level)} title={c.label}
                          className={`flex-1 flex flex-col items-center py-1.5 rounded-lg border text-base transition ${
                            sel ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-indigo-200"
                          }`}>
                          {c.emoji}
                          <span className="text-[8px] text-gray-400 mt-0.5">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Answer input */}
              {currentQuestion.type === "multiple_choice" && currentQuestion.options ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {currentQuestion.options.map((opt) => {
                    const selected = answer === opt;
                    const isCorrect = opt === currentQuestion.correctAnswer;
                    let style = "border-gray-200 hover:border-indigo-300 text-gray-700";
                    if (result) {
                      if (isCorrect)            style = "border-emerald-400 bg-emerald-50 text-emerald-700";
                      else if (selected)        style = "border-red-300 bg-red-50 text-red-600";
                      else                      style = "border-gray-100 text-gray-400";
                    } else if (selected) {
                      style = "border-indigo-400 bg-indigo-50 text-indigo-700";
                    }
                    return (
                      <button key={opt} onClick={() => { if (!result) onAnswerChange(opt); }} disabled={!!result}
                        className={`py-3 px-4 rounded-xl border-2 font-medium text-sm text-left transition ${style}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input type="text" value={answer}
                  onChange={(e) => { if (!result) onAnswerChange(e.target.value); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !result) onSubmit(); }}
                  placeholder="Type your answer..." disabled={!!result}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition mb-4" />
              )}

              {/* Hint */}
              {loading && hintsUsed > 0 && !result && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-amber-600 animate-spin shrink-0" />
                  <span className="text-amber-700 text-xs font-medium">Generating hint…</span>
                </div>
              )}
              {hint && !loading && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-amber-800 text-xs">
                  💡 <MathText text={hint} />
                </div>
              )}
              {hintVisualPlan && !loading && <div className="mb-3"><VisualRenderer plan={hintVisualPlan} animated /></div>}

              {/* Result feedback */}
              {result && (
                <div className={`rounded-xl p-4 mb-3 ${result.isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                  <p className={`font-semibold text-sm ${result.isCorrect ? "text-emerald-700" : "text-red-600"}`}>
                    {result.isCorrect ? "✓ Correct!" : "✗ Not quite"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{result.encouragement}</p>
                  {!result.isCorrect && (
                    <p className="text-xs text-gray-500 mt-1">Answer: <strong>{result.correctAnswer}</strong></p>
                  )}
                  <button onClick={onTeachMe} className="mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition">
                    📖 {result.isCorrect ? "Understand why →" : "Teach me this →"}
                  </button>
                </div>
              )}

              {/* Adaptation coaching */}
              {result && adaptation && adaptation.action !== "next_question" && (
                <div className={`rounded-xl p-3 mb-3 border text-xs ${
                  adaptation.sourceSignals.consecutiveCorrect || adaptation.sourceSignals.sessionRecovery
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : adaptation.sourceSignals.fatigueRisk
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}>
                  <p className="font-medium">{adaptation.reason}</p>
                  {adaptation.difficulty && adaptation.difficulty !== "adaptive" && (
                    <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/50">
                      Next: {adaptation.difficulty}
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {!result ? (
                  <>
                    <button onClick={onSubmit} disabled={!answer.trim() || loading}
                      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition">
                      {loading && hintsUsed === 0 ? "Checking…" : "Check Answer"}
                    </button>
                    <button onClick={onGetHint} disabled={loading || hintsUsed >= 3}
                      className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-600 font-medium text-sm hover:bg-amber-50 disabled:opacity-40 transition">
                      💡 {hintsUsed > 0 ? `${hintsUsed}/3` : "Hint"}
                    </button>
                  </>
                ) : (
                  <button onClick={onNextQuestion}
                    className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
                    {idx + 1 >= totalQ ? "Finish 🎉" : "Next →"}
                  </button>
                )}
              </div>

              {/* Teach me link (pre-answer) */}
              {!result && (
                <p className="mt-3 text-center">
                  <button onClick={onTeachMe} disabled={loading}
                    className="text-xs text-gray-400 hover:text-indigo-500 transition">
                    Don&apos;t understand? Teach me →
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Centered full-screen wrapper for loading/error/complete states */
function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6">
      {children}
    </div>
  );
}
