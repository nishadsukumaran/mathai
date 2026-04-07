"use client";

/**
 * @module apps/web/components/mathai/practice/PracticeView
 *
 * Practice session screen with celebration animations and retry-before-reveal.
 */

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { PracticeQuestionItem, SubmitResultView } from "@/types/contracts";
import type { VisualPlan, SessionNextStep } from "@mathai/shared-types";
import type { ScenePlan }    from "@/lib/scene-engine/types";
import type { Intervention } from "@/lib/scene-engine/struggleEvaluator";
import { VisualRenderer } from "@/components/mathai/visual/VisualRenderer";
import { ScenePlayer }   from "@/components/scene-engine";
import { MathText }       from "@/components/shared/MathText";
import { XPFloat, SessionCompleteEntrance, CorrectBurst } from "@/components/shared/Celebrations";

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
  attemptCount: number;
  // Visual recovery
  intervention: Intervention | null;
  recoveryMode: "none" | "watching" | "practicing";
  recoveryPlan: ScenePlan | null;
  recoveryProblem: { problem: string; answer: string } | null;
  onStartVisualRecovery: () => void;
  onRecoveryAnimationDone: () => void;
  onRecoveryAnswer: (answer: string) => Promise<boolean>;
  onEndRecovery: () => void;
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
    onGetHint, onTeachMe, onRetry, onRestart, adaptation, attemptCount,
    intervention, recoveryMode, recoveryPlan, recoveryProblem,
    onStartVisualRecovery, onRecoveryAnimationDone, onRecoveryAnswer, onEndRecovery,
  } = props;
  const router   = useRouter();
  const totalQ   = session?.questions.length ?? 5;
  const idx      = session?.currentIndex ?? 0;
  const progress = totalQ > 0 ? Math.round((idx / totalQ) * 100) : 0;

  // Retry-before-reveal: check if this is a "try again" state
  const isRetryState = result && !result.isCorrect && (result as any)._retryAvailable === true;
  // Full reveal: result is set AND it's not a retry state
  const isRevealed = result && !isRetryState;

  // ── Loading / Auth / Error states ──────────────────────────────────────

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
          <button onClick={onRetry} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition active:scale-[0.98] mb-2">Try Again</button>
          <button onClick={() => router.push("/dashboard")} className="w-full text-gray-400 py-2 text-sm font-medium hover:text-gray-600 transition">Dashboard</button>
        </div>
      </CenterScreen>
    );
  }

  // ── Session complete ──────────────────────────────────────────────

  if (session && idx >= totalQ) {
    return (
      <CenterScreen>
        <SessionCompleteEntrance>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center max-w-sm w-full">
            <p className="text-5xl mb-3">🎉</p>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Session Complete!</h2>
            <p className="text-gray-500 text-sm mb-6">
              You earned <span className="font-bold text-indigo-600">+{session.xpEarned} XP</span>
            </p>
            <div className="space-y-2">
              <button onClick={onRestart} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition active:scale-[0.98]">Practice Again</button>
              <button onClick={() => router.push("/dashboard")} className="w-full bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition active:scale-[0.98]">Dashboard</button>
              <button onClick={() => router.push("/progress")} className="w-full text-gray-400 py-2 text-xs hover:text-gray-600 transition">View Progress →</button>
            </div>
          </div>
        </SessionCompleteEntrance>
      </CenterScreen>
    );
  }

  // ── Active question ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">

      {/* XP float animation */}
      <XPFloat amount={xpAnim ?? 0} show={!!xpAnim} />

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-600 text-sm font-medium transition active:scale-[0.97]" aria-label="Exit">
            ← Exit
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium shrink-0">{idx + 1}/{totalQ}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          {session && <span className="text-xs font-semibold text-indigo-600 shrink-0">+{session.xpEarned} XP</span>}
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-xl space-y-4"
            >
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

                {/* Confidence (pre-answer only, hide during retry) */}
                {!result && !isRetryState && (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">How confident?</p>
                    <div className="flex gap-1.5">
                      {CONFIDENCE.map((c, i) => {
                        const level = i + 1;
                        const sel = confidenceBefore === level;
                        return (
                          <button key={level} onClick={() => onConfidenceChange(level)} title={c.label}
                            className={`flex-1 flex flex-col items-center py-1.5 rounded-lg border text-base transition active:scale-[0.95] ${
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
                      const isCorrectOpt = opt === currentQuestion.correctAnswer;
                      let style = "border-gray-200 hover:border-indigo-300 text-gray-700";

                      if (isRevealed) {
                        if (isCorrectOpt) style = "border-emerald-400 bg-emerald-50 text-emerald-700";
                        else if (selected) style = "border-red-300 bg-red-50 text-red-600";
                        else               style = "border-gray-100 text-gray-400";
                      } else if (isRetryState) {
                        // During retry: clear selection, show neutral
                        style = "border-gray-200 hover:border-indigo-300 text-gray-700";
                      } else if (selected) {
                        style = "border-indigo-400 bg-indigo-50 text-indigo-700";
                      }

                      return (
                        <button key={opt}
                          onClick={() => { if (!isRevealed) onAnswerChange(opt); }}
                          disabled={!!isRevealed}
                          className={`py-3 px-4 rounded-xl border-2 font-medium text-sm text-left transition active:scale-[0.98] ${style}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input type="text" value={answer}
                    onChange={(e) => { if (!isRevealed) onAnswerChange(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !isRevealed) onSubmit(); }}
                    placeholder={isRetryState ? "Try again..." : "Type your answer..."}
                    disabled={!!isRevealed}
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

                {/* Retry-before-reveal: "Try again" message */}
                {isRetryState && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-3 mb-3 bg-amber-50 border border-amber-200"
                  >
                    <p className="font-semibold text-sm text-amber-700">Not quite — give it another try!</p>
                    <p className="text-xs text-amber-600 mt-0.5">You have one more attempt before the answer is shown.</p>
                  </motion.div>
                )}

                {/* Full result feedback (after reveal) */}
                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-xl p-4 mb-3 ${result!.isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {result!.isCorrect && <CorrectBurst show />}
                      <p className={`font-semibold text-sm ${result!.isCorrect ? "text-emerald-700" : "text-red-600"}`}>
                        {result!.isCorrect ? "Correct!" : "Not quite"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{result!.encouragement}</p>
                    {!result!.isCorrect && (
                      <p className="text-xs text-gray-500 mt-1">Answer: <strong>{result!.correctAnswer}</strong></p>
                    )}
                    <button onClick={onTeachMe} className="mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition">
                      📖 {result!.isCorrect ? "Understand why →" : "Teach me this →"}
                    </button>
                  </motion.div>
                )}

                {/* Adaptation coaching */}
                {isRevealed && adaptation && adaptation.action !== "next_question" && (
                  <div className={`rounded-xl p-3 mb-3 border text-xs ${
                    adaptation.sourceSignals.consecutiveCorrect || adaptation.sourceSignals.sessionRecovery
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : adaptation.sourceSignals.fatigueRisk
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-indigo-50 border-indigo-200 text-indigo-700"
                  }`}>
                    <p className="font-medium">{adaptation.reason}</p>
                  </div>
                )}

                {/* Visual recovery intervention */}
                {isRevealed && intervention?.type === "watch_visual" && recoveryMode === "none" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 mb-3 bg-violet-50 border border-violet-200 text-center space-y-2"
                  >
                    <p className="text-sm text-violet-700 font-medium">{intervention.reason}</p>
                    <button
                      onClick={onStartVisualRecovery}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition active:scale-[0.97]"
                    >
                      ▶ Watch It
                    </button>
                  </motion.div>
                )}

                {/* Scene player (watching) */}
                {recoveryMode === "watching" && recoveryPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3"
                  >
                    <ScenePlayer plan={recoveryPlan} />
                    <div className="mt-3 text-center">
                      <button
                        onClick={onRecoveryAnimationDone}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition active:scale-[0.97]"
                      >
                        Got it — let me try
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Recovery problem (practicing after visual) */}
                {recoveryMode === "practicing" && (
                  <RecoveryProblemCard
                    problem={recoveryProblem}
                    onAnswer={onRecoveryAnswer}
                    onDone={onEndRecovery}
                  />
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {!isRevealed ? (
                    <>
                      <button onClick={onSubmit} disabled={!answer.trim() || loading}
                        className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition active:scale-[0.98]">
                        {loading && hintsUsed === 0 ? "Checking…" : isRetryState ? "Try Again" : "Check Answer"}
                      </button>
                      {!isRetryState && (
                        <button onClick={onGetHint} disabled={loading || hintsUsed >= 3}
                          className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-600 font-medium text-sm hover:bg-amber-50 disabled:opacity-40 transition active:scale-[0.98]">
                          💡 {hintsUsed > 0 ? `${hintsUsed}/3` : "Hint"}
                        </button>
                      )}
                    </>
                  ) : (
                    <button onClick={onNextQuestion}
                      className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition active:scale-[0.98]">
                      {idx + 1 >= totalQ ? "Finish 🎉" : "Next →"}
                    </button>
                  )}
                </div>

                {/* Teach me (pre-answer) */}
                {!result && !isRetryState && (
                  <p className="mt-3 text-center">
                    <button onClick={onTeachMe} disabled={loading}
                      className="text-xs text-gray-400 hover:text-indigo-500 transition">
                      Don&apos;t understand? Teach me →
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CenterScreen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6">{children}</div>;
}

// ─── Recovery problem card (post-visual similar problem) ─────────────────────

function RecoveryProblemCard({
  problem,
  onAnswer,
  onDone,
}: {
  problem: { problem: string; answer: string } | null;
  onAnswer: (answer: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const [input, setInput]       = useState("");
  const [checked, setChecked]   = useState(false);
  const [correct, setCorrect]   = useState(false);

  if (!problem) {
    return (
      <div className="rounded-xl p-4 mb-3 bg-gray-50 border border-gray-200 text-center">
        <p className="text-sm text-gray-500">Loading problem...</p>
      </div>
    );
  }

  const handleCheck = async () => {
    const result = await onAnswer(input);
    setCorrect(result);
    setChecked(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 mb-3 bg-indigo-50 border border-indigo-200 space-y-3"
    >
      <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">Try this one</p>
      <p className="text-sm font-semibold text-gray-800"><MathText text={problem.problem} /></p>

      {!checked ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your answer..."
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-center focus:border-indigo-400 outline-none transition"
            onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) void handleCheck(); }}
            autoFocus
          />
          <button
            onClick={() => void handleCheck()}
            disabled={!input.trim()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition active:scale-[0.97] shrink-0"
          >
            Check
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className={`rounded-xl px-4 py-3 text-center ${correct ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
            {correct ? (
              <p className="text-sm font-bold text-emerald-700">Correct! You got it after watching.</p>
            ) : (
              <p className="text-sm font-bold text-amber-700">The answer is <span className="text-indigo-600">{problem.answer}</span></p>
            )}
          </div>
          <button
            onClick={onDone}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition active:scale-[0.97]"
          >
            Continue →
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
