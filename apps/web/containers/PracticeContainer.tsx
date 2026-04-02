/**
 * @module apps/web/containers/PracticeContainer
 *
 * Client component. Owns all session state and API calls for the practice screen.
 *
 * Extracted from app/practice/page.tsx which was a 340-line god file.
 *
 * Responsibilities:
 *  - Auth redirect if session is missing
 *  - Session lifecycle: start → submit → hint → next → complete
 *  - All API fetch calls via clientApi helpers
 *  - Render PracticeView with props (no rendering logic here)
 *
 * Does NOT:
 *  - Know how questions look visually
 *  - Handle routing except for auth redirect
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter }                                 from "next/navigation";
import { useSession }                                from "next-auth/react";
import { useQueryClient }                            from "@tanstack/react-query";

import PracticeView from "@/components/mathai/practice/PracticeView";
import { queryKeys }   from "@/lib/query-keys";
import type { PracticeQuestionItem, SubmitResultView } from "@/types/contracts";
import type { VisualPlan, SessionNextStep } from "@mathai/shared-types";

const API_BASE = process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001/api";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/auth/token");
    if (res.ok) {
      const { token } = (await res.json()) as { token: string };
      return {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    }
  } catch {
    // fall through to stub
  }
  return { Authorization: "Bearer dev-stub", "Content-Type": "application/json" };
}

interface SessionState {
  id:           string;
  topicId:      string;
  mode:         string;
  questions:    PracticeQuestionItem[];
  currentIndex: number;
  xpEarned:     number;
}

interface Props {
  topicId: string;
  mode:    string;
}

export default function PracticeContainer({ topicId, mode }: Props) {
  const router               = useRouter();
  const { status }           = useSession();
  const hasAttemptedRef      = useRef(false);
  const queryClient          = useQueryClient();

  const [session,          setSession]          = useState<SessionState | null>(null);
  const [answer,           setAnswer]           = useState("");
  const [result,           setResult]           = useState<SubmitResultView | null>(null);
  const [hint,             setHint]             = useState<string | null>(null);
  const [hintVisualPlan,   setHintVisualPlan]   = useState<VisualPlan | null>(null);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [xpAnim,           setXpAnim]           = useState<number | null>(null);
  const [hintsUsed,        setHintsUsed]        = useState(0);
  // confidenceBefore: student self-rates 1–5 before answering each question.
  // Sent to the API and written to QuestionAttempt for mastery analytics.
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null);

  // Session Adaptation Engine — adaptive coaching state
  const [adaptation, setAdaptation]     = useState<SessionNextStep | null>(null);

  // Retry-before-reveal: track attempt count per question to allow 1 retry before showing answer
  const [attemptCount, setAttemptCount] = useState(0);

  // ── Start session ────────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(`${API_BASE}/practice/start`, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          practiceSetId: `set-${topicId}`,
          topicId,
          mode,
          questionCount: 5,
        }),
      });
      clearTimeout(timeout);
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
      } else {
        setError(json.error?.message ?? "Failed to start session");
      }
    } catch (e) {
      const isTimeout = e instanceof Error && e.name === "AbortError";
      setError(
        isTimeout
          ? "Request timed out — server may be warming up. Please try again."
          : "Could not connect to server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [topicId, mode]);

  // ── Submit answer ─────────────────────────────────────────────────────────────

  const submitAnswer = useCallback(async () => {
    const currentQ = session?.questions[session.currentIndex];
    if (!session || !currentQ || !answer.trim()) return;
    setLoading(true);
    setResult(null);
    setHint(null);
    setHintVisualPlan(null);
    try {
      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`${API_BASE}/practice/submit`, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          sessionId:        session.id,
          questionId:       currentQ.id,
          answer:           answer.trim(),
          timeSpentSeconds: 30,
          hintsUsed,
          // hintMaxLevel = highest tier hint used (1–3). If no hints used, omit.
          ...(hintsUsed > 0 && { hintMaxLevel: Math.min(hintsUsed, 3) }),
          // confidenceBefore: student self-rating 1–5. Omit if not set.
          ...(confidenceBefore !== null && { confidenceBefore }),
        }),
      });
      clearTimeout(timeout);
      const json = await res.json();
      if (json.success) {
        const r = json.data as SubmitResultView;
        const currentAttempt = attemptCount + 1;
        setAttemptCount(currentAttempt);

        // Retry-before-reveal: on first wrong answer, allow retry instead of showing answer
        if (!r.isCorrect && currentAttempt === 1) {
          // Show "try again" state — don't set full result (which reveals answer)
          setResult({ ...r, _retryAvailable: true } as any);
          setAnswer("");
        } else {
          setResult(r);
        }

        if (r.isCorrect) {
          setXpAnim(r.xpEarned);
          setTimeout(() => setXpAnim(null), 2000);
        }
        // When the session finishes, invalidate the practice menu so the next
        // dashboard visit re-generates AI recommendations based on updated progress.
        if (r.sessionComplete) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.practiceMenu });
        }

        // Session Adaptation Engine — read and act on the adaptive recommendation
        const adapt = r.sessionAdaptation ?? null;
        setAdaptation(adapt);

        // Auto-trigger hint/explanation when the engine recommends proactive support
        if (adapt && !r.isCorrect) {
          const autoHelpActions = ["show_hint", "show_step_by_step", "show_visual_explanation"];
          if (autoHelpActions.includes(adapt.action) && session) {
            // Auto-fetch a hint/explanation after a short delay so the student
            // sees the wrong-answer feedback first, then gets help
            const currentQ = session.questions[session.currentIndex];
            if (currentQ) {
              setTimeout(async () => {
                try {
                  const hdr = await getAuthHeaders();
                  const ctrl = new AbortController();
                  const tm = setTimeout(() => ctrl.abort(), 15_000);
                  const hintRes = await fetch(`${API_BASE}/practice/hint`, {
                    method: "POST",
                    headers: hdr,
                    signal: ctrl.signal,
                    body: JSON.stringify({
                      sessionId:      session.id,
                      questionId:     currentQ.id,
                      questionText:   currentQ.prompt,
                      topicId:        session.topicId,
                      hintsUsedSoFar: hintsUsed,
                    }),
                  });
                  clearTimeout(tm);
                  const hintJson = await hintRes.json();
                  if (hintJson.success) {
                    setHint(hintJson.data.content?.text ?? "Let me help you think about this...");
                    setHintVisualPlan(hintJson.data.visualPlan ?? null);
                    setHintsUsed((h) => h + 1);
                  }
                } catch {
                  // Auto-hint failed — student can still manually request one
                }
              }, 800);
            }
          }
        }
      } else {
        // API returned success:false — surface the error so the spinner clears
        setError(json.error?.message ?? "Could not submit your answer. Please try again.");
      }
    } catch (e) {
      const isTimeout = e instanceof Error && e.name === "AbortError";
      setError(
        isTimeout
          ? "Request timed out — please try again."
          : "Network error submitting answer."
      );
    } finally {
      setLoading(false);
    }
  }, [session, answer, hintsUsed, confidenceBefore]);

  // ── Next question ─────────────────────────────────────────────────────────────

  const nextQuestion = useCallback(() => {
    if (!session) return;
    setSession((s) =>
      s ? { ...s, currentIndex: s.currentIndex + 1, xpEarned: s.xpEarned + (result?.xpEarned ?? 0) } : s
    );
    setAnswer("");
    setResult(null);
    setHint(null);
    setHintVisualPlan(null);
    setHintsUsed(0);
    setConfidenceBefore(null);
    setAdaptation(null);
    setAttemptCount(0);
  }, [session, result]);

  // ── Get hint ──────────────────────────────────────────────────────────────────

  const getHint = useCallback(async () => {
    const currentQ = session?.questions[session.currentIndex];
    if (!session || !currentQ) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`${API_BASE}/practice/hint`, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          sessionId:      session.id,
          questionId:     currentQ.id,
          questionText:   currentQ.prompt,
          topicId:        session.topicId,
          hintsUsedSoFar: hintsUsed,
        }),
      });
      clearTimeout(timeout);
      const json = await res.json();
      if (json.success) {
        setHint(json.data.content?.text ?? "Think carefully about what you know!");
        setHintVisualPlan(json.data.visualPlan ?? null);
        setHintsUsed((h) => h + 1);
      }
    } catch {
      setHint("Think carefully about the problem!");
    } finally {
      setLoading(false);
    }
  }, [session, hintsUsed]);

  // ── Teach Me — redirect to Ask MathAI with the current question pre-filled ────

  const teachMe = useCallback(() => {
    const currentQ = session?.questions[session.currentIndex];
    if (!currentQ) {
      router.push("/ask");
      return;
    }
    // Build a natural-language question from the problem text so Ask MathAI
    // can give a full concept explanation, not just a session-specific hint.
    const teachQuestion = `Explain how to solve this and teach me the concept: ${currentQ.prompt}`;
    router.push(`/ask?q=${encodeURIComponent(teachQuestion)}&topic=${encodeURIComponent(topicId)}`);
  }, [session, topicId, router]);

  // ── Auto-start once ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (topicId && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      void startSession();
    }
  }, [topicId, startSession]);

  // ── Auth guard ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/practice?topicId=${topicId}`);
    }
  }, [status, router, topicId]);

  // ── Render via PracticeView ───────────────────────────────────────────────────

  return (
    <PracticeView
      session={session}
      currentQuestion={session?.questions[session.currentIndex] ?? null}
      answer={answer}
      result={result}
      hint={hint}
      hintVisualPlan={hintVisualPlan}
      loading={loading}
      error={error}
      xpAnim={xpAnim}
      hintsUsed={hintsUsed}
      authStatus={status}
      onAnswerChange={setAnswer}
      onSubmit={submitAnswer}
      onNextQuestion={nextQuestion}
      onGetHint={getHint}
      onTeachMe={teachMe}
      onRetry={startSession}
      confidenceBefore={confidenceBefore}
      onConfidenceChange={setConfidenceBefore}
      adaptation={adaptation}
      attemptCount={attemptCount}
      onRestart={() => {
        setSession(null);
        hasAttemptedRef.current = false;
        setConfidenceBefore(null);
        void startSession();
      }}
    />
  );
}
