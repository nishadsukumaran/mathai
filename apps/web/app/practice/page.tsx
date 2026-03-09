/**
 * @module apps/web/app/practice/page
 *
 * Interactive practice session — client component wired to Express API.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "next-auth/react";

const API_BASE = process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001/api";
const AUTH_HEADER = { "Authorization": "Bearer dev-stub", "Content-Type": "application/json" };

type Question = {
  id: string;
  prompt: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  xpReward: number;
  difficulty: string;
};

type SessionState = {
  id: string;
  topicId: string;
  mode: string;
  questions: Question[];
  currentIndex: number;
  xpEarned: number;
};

type SubmitResult = {
  isCorrect: boolean;
  correctAnswer: string;
  xpEarned: number;
  encouragement: string;
  sessionComplete?: boolean;
  nextAction: string;
};

function PracticeContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const topicId  = params.get("topicId") ?? "g3-ops-multiplication";
  const mode     = params.get("mode")    ?? "guided";
  const { data: authSession, status } = useSession();

  const [session,    setSession]    = useState<SessionState | null>(null);
  const [answer,     setAnswer]     = useState("");
  const [result,     setResult]     = useState<SubmitResult | null>(null);
  const [hint,       setHint]       = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [xpAnim,     setXpAnim]     = useState<number | null>(null);
  const [hintsUsed,  setHintsUsed]  = useState(0);
  const [started,    setStarted]    = useState(false);

  const currentQ = session
    ? session.questions[session.currentIndex]
    : null;

  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/practice/start`, {
        method: "POST",
        headers: AUTH_HEADER,
        body: JSON.stringify({
          practiceSetId: `set-${topicId}`,
          topicId,
          mode,
          questionCount: 5,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const s = json.data.session;
        setSession({
          id:           s.id,
          topicId:      s.topicId,
          mode:         s.mode,
          questions:    s.questions,
          currentIndex: 0,
          xpEarned:     0,
        });
        setStarted(true);
      } else {
        setError(json.error?.message ?? "Failed to start session");
      }
    } catch (e) {
      setError("Could not connect to the API server. Make sure run-api.bat is running.");
    } finally {
      setLoading(false);
    }
  }, [topicId, mode]);

  const submitAnswer = useCallback(async () => {
    if (!session || !currentQ || !answer.trim()) return;
    setLoading(true);
    setResult(null);
    setHint(null);
    try {
      const res = await fetch(`${API_BASE}/practice/submit`, {
        method: "POST",
        headers: AUTH_HEADER,
        body: JSON.stringify({
          sessionId:        session.id,
          questionId:       currentQ.id,
          answer:           answer.trim(),
          timeSpentSeconds: 30,
          hintsUsed,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const r = json.data;
        setResult(r);
        if (r.isCorrect) {
          setXpAnim(r.xpEarned);
          setTimeout(() => setXpAnim(null), 2000);
        }
      }
    } catch {
      setError("Network error submitting answer.");
    } finally {
      setLoading(false);
    }
  }, [session, currentQ, answer, hintsUsed]);

  const nextQuestion = useCallback(() => {
    if (!session) return;
    const nextIdx = session.currentIndex + 1;
    setSession((s) => s ? { ...s, currentIndex: nextIdx, xpEarned: s.xpEarned + (result?.xpEarned ?? 0) } : s);
    setAnswer("");
    setResult(null);
    setHint(null);
    setHintsUsed(0);
  }, [session, result]);

  const getHint = useCallback(async () => {
    if (!session || !currentQ) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/practice/hint`, {
        method: "POST",
        headers: AUTH_HEADER,
        body: JSON.stringify({
          sessionId:      session.id,
          questionId:     currentQ.id,
          questionText:   currentQ.prompt,
          topicId:        session.topicId,
          grade:          "G4",
          hintsUsedSoFar: hintsUsed,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setHint(json.data.content?.text ?? "Think carefully about what you know!");
        setHintsUsed((h) => h + 1);
      }
    } catch {
      setHint("Think carefully about the problem!");
    } finally {
      setLoading(false);
    }
  }, [session, currentQ, hintsUsed]);

  // Auto-start when topicId is available
  useEffect(() => {
    if (topicId && !started && !loading) {
      void startSession();
    }
  }, [topicId, started, loading, startSession]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/practice?topicId=${topicId}`);
    }
  }, [status, router, topicId]);

  const totalQ = session?.questions.length ?? 5;
  const currentIdx = session?.currentIndex ?? 0;
  const progress = totalQ > 0 ? Math.round((currentIdx / totalQ) * 100) : 0;

  // Show spinner while auth is loading
  if (status === "loading" || (status === "unauthenticated")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔑</div>
          <p className="text-indigo-600 font-semibold">Checking your session...</p>
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button onClick={startSession} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Session complete
  if (session && currentIdx >= totalQ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-indigo-50">
        <div className="text-center max-w-sm bg-white rounded-3xl shadow-xl p-10">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-6">
            You earned <span className="font-black text-indigo-600">+{session.xpEarned} XP</span> this session.
          </p>
          <button
            onClick={() => { setSession(null); setStarted(false); }}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6">

      {/* XP floating animation */}
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
            <span className="text-sm font-bold text-indigo-600">+{session.xpEarned} XP</span>
          )}
        </div>

        {/* Question card */}
        {currentQ && (
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest">
                {mode.toUpperCase()} · {currentQ.difficulty}
              </span>
              <span className="ml-auto text-xs text-gray-300">{currentQ.xpReward} XP</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 leading-relaxed">
              {currentQ.prompt}
            </h2>

            {/* Multiple choice */}
            {currentQ.type === "multiple_choice" && currentQ.options ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { if (!result) setAnswer(opt); }}
                    disabled={!!result}
                    className={`py-3 px-4 rounded-xl border-2 font-semibold text-left transition ${
                      answer === opt
                        ? result
                          ? opt === currentQ.correctAnswer
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-red-400 bg-red-50 text-red-600"
                          : "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : result && opt === currentQ.correctAnswer
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
                onChange={(e) => { if (!result) setAnswer(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !result) void submitAnswer(); }}
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
              <div className={`rounded-xl p-4 mb-4 ${result.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
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
                    onClick={submitAnswer}
                    disabled={!answer.trim() || loading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition"
                  >
                    {loading ? "Checking..." : "Check Answer ✓"}
                  </button>
                  <button
                    onClick={getHint}
                    disabled={loading || hintsUsed >= 3}
                    className="px-4 py-3 rounded-xl border border-amber-300 text-amber-600 font-semibold hover:bg-amber-50 disabled:opacity-40 transition"
                  >
                    💡 Hint {hintsUsed > 0 ? `(${hintsUsed}/3)` : ""}
                  </button>
                </>
              ) : (
                <button
                  onClick={nextQuestion}
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

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-indigo-500 text-xl">Loading...</div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
