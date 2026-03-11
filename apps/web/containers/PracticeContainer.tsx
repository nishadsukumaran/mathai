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

  const [session,   setSession]   = useState<SessionState | null>(null);
  const [answer,    setAnswer]    = useState("");
  const [result,    setResult]    = useState<SubmitResultView | null>(null);
  const [hint,      setHint]      = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [xpAnim,    setXpAnim]    = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);

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
        }),
      });
      clearTimeout(timeout);
      const json = await res.json();
      if (json.success) {
        const r = json.data as SubmitResultView;
        setResult(r);
        if (r.isCorrect) {
          setXpAnim(r.xpEarned);
          setTimeout(() => setXpAnim(null), 2000);
        }
        // When the session finishes, invalidate the practice menu so the next
        // dashboard visit re-generates AI recommendations based on updated progress.
        if (r.sessionComplete) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.practiceMenu });
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
  }, [session, answer, hintsUsed]);

  // ── Next question ─────────────────────────────────────────────────────────────

  const nextQuestion = useCallback(() => {
    if (!session) return;
    setSession((s) =>
      s ? { ...s, currentIndex: s.currentIndex + 1, xpEarned: s.xpEarned + (result?.xpEarned ?? 0) } : s
    );
    setAnswer("");
    setResult(null);
    setHint(null);
    setHintsUsed(0);
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
        setHintsUsed((h) => h + 1);
      }
    } catch {
      setHint("Think carefully about the problem!");
    } finally {
      setLoading(false);
    }
  }, [session, hintsUsed]);

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
      loading={loading}
      error={error}
      xpAnim={xpAnim}
      hintsUsed={hintsUsed}
      authStatus={status}
      onAnswerChange={setAnswer}
      onSubmit={submitAnswer}
      onNextQuestion={nextQuestion}
      onGetHint={getHint}
      onRetry={startSession}
      onRestart={() => {
        setSession(null);
        hasAttemptedRef.current = false;
        void startSession();
      }}
    />
  );
}
