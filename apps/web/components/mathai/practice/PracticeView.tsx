/**
 * @module apps/web/components/mathai/practice/PracticeView
 *
 * Pure view component for the practice session screen.
 * Receives all state + callbacks from PracticeContainer — renders only.
 * No fetching, no state, no side effects.
 */

"use client";

import { useRouter } from "next/navigation";
import type { PracticeQuestionItem, SubmitResultView } from "@/types/contracts";

interface SessionState {
  id:           string;
  questions:    PracticeQuestionItem[];
  currentIndex: number;
  xpEarned:     number;
}

interface Props {
  session:         SessionState | null;
  currentQuestion: PracticeQuestionItem | null;
  answer:          string;
  result:          SubmitResultView | null;
  hint:            string | null;
  loading:         boolean;
  error:           string | null;
  xpAnim:          number | null;
  hintsUsed:       number;
  authStatus:      "loading" | "authenticated" | "unauthenticated";
  onAnswerChange:  (v: string) => void;
  onSubmit:        () => void;
  onNextQuestion:  () => void;
  onGetHint:       () => void;
  onTeachMe:       () => void;
  onRetry:         () => void;
  onRestart:       () => void;
}

export default function PracticeView({
  session,
  currentQuestion,
  answer,
  result,
  hint,
  loading,
  error,
  xpAnim,
  hintsUsed,
  authStatus,
  onAnswerChange,
  onSubmit,
  onNextQuestion,
  onGetHint,
  onTeachMe,
  onRetry,
  onRestart,
}: Props) {
  const router     = useRouter();
  const totalQ     = session?.questions.length ?? 5;
  const currentIdx = session?.currentIndex ?? 0;
  const progress   = totalQ > 0 ? Math.round((currentIdx / totalQ) * 100) : 0;

  // ── Auth loading ────────────────────────────────────────────────────────────

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔑</div>
          <p className="text-indigo-600 font-semibold">Checking your session...</p>
        </div>
      </div>
    );
  }

  // ── Initial load ────────────────────────────────────────────────────────────

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🚀</div>
          <p className="text-indigo-600 font-semibold">Loading your practice session...</p>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-white border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Session complete ────────────────────────────────────────────────────────

  if (session && currentIdx >= totalQ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-indigo-50 p-6">
        <div className="text-center max-w-sm w-full bg-white rounded-3xl shadow-xl p-10">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-8">
            You earned{" "}
            <span className="font-black text-indigo-600">+{session.xpEarned} XP</span>{" "}
            this session. Great work!
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onRestart}
              className="w-full bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition"
            >
              Practice Again 🔁
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-white border-2 border-indigo-200 text-indigo-600 px-8 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition"
            >
              Go to Dashboard 🏠
            </button>
            <button
              onClick={() => router.push("/progress")}
              className="w-full text-gray-400 px-8 py-2 rounded-2xl font-semibold hover:text-gray-600 transition text-sm"
            >
              View My Progress →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active question ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6">

      {/* XP float animation — bottom-center so it doesn't overlap nav on mobile */}
      {xpAnim && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-2xl font-black text-green-500 animate-bounce z-50 pointer-events-none">
          +{xpAnim} XP! ✨
        </div>
      )}

      <div className="w-full max-w-2xl space-y-4">

        {/* Top bar: back button + progress */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-gray-600 font-bold text-sm flex items-center gap-1 shrink-0 transition"
            aria-label="Exit practice"
          >
            ← Exit
          </button>
          <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
            {currentIdx + 1} / {totalQ}
          </span>
          <div className="flex-1 h-3 bg-white rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {session && (
            <span className="text-sm font-bold text-indigo-600 shrink-0">
              +{session.xpEarned} XP
            </span>
          )}
        </div>

        {/* Question card */}
        {currentQuestion && (
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest">
                {session?.id ? `${currentQuestion.difficulty}` : "Practice"}
              </span>
              <span className="ml-auto text-xs text-gray-300">
                {currentQuestion.xpReward} XP
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 leading-relaxed">
              {currentQuestion.prompt}
            </h2>

            {/* Multiple choice — single column on mobile, 2 cols on sm+ */}
            {currentQuestion.type === "multiple_choice" && currentQuestion.options ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { if (!result) onAnswerChange(opt); }}
                    disabled={!!result}
                    className={`py-3 px-4 rounded-2xl border-2 font-semibold text-left transition ${
                      answer === opt
                        ? result
                          ? opt === currentQuestion.correctAnswer
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-red-400 bg-red-50 text-red-600"
                          : "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : result && opt === currentQuestion.correctAnswer
                          ? "border-green-400 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              /* Text input */
              <input
                type="text"
                value={answer}
                onChange={(e) => { if (!result) onAnswerChange(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !result) onSubmit(); }}
                placeholder="Type your answer..."
                disabled={!!result}
                className="w-full border-2 border-indigo-200 rounded-2xl px-4 py-3 text-lg focus:border-indigo-500 outline-none transition mb-4"
              />
            )}

            {/* Hint box — shows AI-generated hint or loading state */}
            {loading && hintsUsed > 0 && !result && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-amber-700 animate-spin shrink-0" />
                <span className="text-amber-700 text-sm font-medium">MathAI is thinking of a hint for you…</span>
              </div>
            )}
            {hint && !loading && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-amber-800 text-sm">
                💡 {hint}
              </div>
            )}

            {/* Result feedback */}
            {result && (
              <div
                className={`rounded-2xl p-4 mb-4 ${
                  result.isCorrect
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p className={`font-bold ${result.isCorrect ? "text-green-700" : "text-red-600"}`}>
                  {result.isCorrect ? "✅ Correct!" : "❌ Not quite."}
                </p>
                <p className="text-sm text-gray-600 mt-1">{result.encouragement}</p>
                {!result.isCorrect && (
                  <>
                    <p className="text-sm text-gray-500 mt-1">
                      Correct answer: <strong>{result.correctAnswer}</strong>
                    </p>
                    {/* Teach Me — deep-links to Ask MathAI with this question pre-loaded */}
                    <button
                      onClick={onTeachMe}
                      className="mt-3 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      <span className="text-base">📖</span>
                      Teach me this properly →
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {!result ? (
                <>
                  <button
                    onClick={onSubmit}
                    disabled={!answer.trim() || loading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition"
                  >
                    {loading && hintsUsed === 0 ? "Checking..." : "Check Answer ✓"}
                  </button>
                  <button
                    onClick={onGetHint}
                    disabled={loading || hintsUsed >= 3}
                    className="px-4 py-3 rounded-2xl border border-amber-300 text-amber-600 font-semibold hover:bg-amber-50 disabled:opacity-40 transition"
                    title="Get an AI-generated hint for this question"
                  >
                    💡 Hint {hintsUsed > 0 ? `(${hintsUsed}/3)` : ""}
                  </button>
                  <button
                    onClick={onTeachMe}
                    disabled={loading}
                    className="px-4 py-3 rounded-2xl border border-indigo-200 text-indigo-500 font-semibold hover:bg-indigo-50 disabled:opacity-40 transition"
                    title="Don't know this topic? Let MathAI explain it fully"
                  >
                    📖 Teach Me
                  </button>
                </>
              ) : (
                <button
                  onClick={onNextQuestion}
                  className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition"
                >
                  {currentIdx + 1 >= totalQ ? "Finish 🎉" : "Next Question →"}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
