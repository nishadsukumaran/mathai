/**
 * @module apps/web/components/mathai/practice/PracticeView
 *
 * Pure view component for the practice session screen.
 * Receives all state + callbacks from PracticeContainer — renders only.
 * No fetching, no state, no side effects.
 */

"use client";

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
  onRetry,
  onRestart,
}: Props) {
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
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Session complete ────────────────────────────────────────────────────────

  if (session && currentIdx >= totalQ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-indigo-50">
        <div className="text-center max-w-sm bg-white rounded-3xl shadow-xl p-10">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-6">
            You earned{" "}
            <span className="font-black text-indigo-600">+{session.xpEarned} XP</span>{" "}
            this session.
          </p>
          <button
            onClick={onRestart}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  // ── Active question ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6">

      {/* XP float animation */}
      {xpAnim && (
        <div className="fixed top-20 right-8 text-2xl font-black text-green-500 animate-bounce">
          +{xpAnim} XP! ✨
        </div>
      )}

      <div className="w-full max-w-2xl space-y-4">

        {/* Progress bar */}
        <div className="flex items-center gap-3">
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
            <span className="text-sm font-bold text-indigo-600">
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

            {/* Multiple choice */}
            {currentQuestion.type === "multiple_choice" && currentQuestion.options ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { if (!result) onAnswerChange(opt); }}
                    disabled={!!result}
                    className={`py-3 px-4 rounded-xl border-2 font-semibold text-left transition ${
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
                className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-lg focus:border-indigo-500 outline-none transition mb-4"
              />
            )}

            {/* Hint box */}
            {hint && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-amber-800 text-sm">
                💡 {hint}
              </div>
            )}

            {/* Result feedback */}
            {result && (
              <div
                className={`rounded-xl p-4 mb-4 ${
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
                  <p className="text-sm text-gray-500 mt-1">
                    Correct answer: <strong>{result.correctAnswer}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              {!result ? (
                <>
                  <button
                    onClick={onSubmit}
                    disabled={!answer.trim() || loading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition"
                  >
                    {loading ? "Checking..." : "Check Answer ✓"}
                  </button>
                  <button
                    onClick={onGetHint}
                    disabled={loading || hintsUsed >= 3}
                    className="px-4 py-3 rounded-xl border border-amber-300 text-amber-600 font-semibold hover:bg-amber-50 disabled:opacity-40 transition"
                  >
                    💡 Hint {hintsUsed > 0 ? `(${hintsUsed}/3)` : ""}
                  </button>
                </>
              ) : (
                <button
                  onClick={onNextQuestion}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
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
