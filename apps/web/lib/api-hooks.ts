/**
 * @module apps/web/lib/api-hooks
 * @deprecated Use hooks/ directory instead (React Query v5 powered).
 *   - hooks/use-dashboard.ts
 *   - hooks/use-curriculum.ts
 *   - hooks/use-progress.ts
 *   - hooks/use-practice-session.ts
 * Kept for reference only. Do not import in new code.
 *
 * Typed React hooks for every MathAI screen.
 *
 * MOCK MODE:
 *   Set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local.
 *   All hooks return mock data without hitting the backend.
 *   A simulated 600ms delay surfaces loading states during UI development.
 *
 * LIVE MODE (default in production):
 *   Hooks call the real API via apiClient (axios, auth headers included).
 *
 * PATTERN:
 *   const { data, loading, error, refetch } = useDashboard(studentId);
 *
 * IMPORTANT — Server Components:
 *   These are client-side hooks (useState + useEffect).
 *   For Next.js Server Components, call the API directly using fetch()
 *   with the server-side session token instead.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "./api-client";

import type {
  DashboardData,
  CurriculumData,
  TopicDetail,
  ProgressData,
  WeakArea,
  DailyQuest,
  PracticeSession,
  SubmissionResult,
  TutorResponse,
  PracticeStartRequest,
  SubmitAnswerRequest,
  HintRequest,
  ExplanationRequest,
} from "@mathai/shared-types";

import {
  MOCK_DASHBOARD,
  MOCK_CURRICULUM,
  MOCK_TOPIC_DETAIL,
  MOCK_PROGRESS,
  MOCK_WEAK_AREAS,
  MOCK_DAILY_QUESTS,
  MOCK_SESSION_START,
  MOCK_SUBMIT_CORRECT,
  MOCK_HINT_2,
  MOCK_EXPLANATION_FULL,
  withMockDelay,
} from "./mock-data";

// ─── Shared hook state shape ──────────────────────────────────────────────────

interface HookState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
}

function initialState<T>(): HookState<T> {
  return { data: null, loading: true, error: null };
}

const USE_MOCK = process.env["NEXT_PUBLIC_USE_MOCK_DATA"] === "true";

// ─── useDashboard ─────────────────────────────────────────────────────────────
// Screen: /dashboard
// Endpoint: GET /api/dashboard/:studentId

export function useDashboard(studentId: string) {
  const [state, setState] = useState<HookState<DashboardData>>(initialState);

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_DASHBOARD)
        : (await apiClient.get<{ data: DashboardData }>(`/dashboard/${studentId}`)).data.data;
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      setState({ data: null, loading: false, error: errorMessage(err) });
    }
  }, [studentId]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { ...state, refetch: fetch };
}

// ─── useCurriculum ────────────────────────────────────────────────────────────
// Screen: /curriculum (topic grid)
// Endpoint: GET /api/curriculum?grade=G4&strand=...

export function useCurriculum(grade: string, strand?: string) {
  const [state, setState] = useState<HookState<CurriculumData>>(initialState);

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ grade });
      if (strand) params.set("strand", strand);

      const data = USE_MOCK
        ? await withMockDelay(MOCK_CURRICULUM)
        : (await apiClient.get<{ data: CurriculumData }>(`/curriculum?${params}`)).data.data;
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      setState({ data: null, loading: false, error: errorMessage(err) });
    }
  }, [grade, strand]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { ...state, refetch: fetch };
}

// ─── useTopicDetail ───────────────────────────────────────────────────────────
// Screen: /topic/:topicId
// Endpoint: GET /api/curriculum/topic/:topicId

export function useTopicDetail(topicId: string) {
  const [state, setState] = useState<HookState<TopicDetail>>(initialState);

  const fetch = useCallback(async () => {
    if (!topicId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_TOPIC_DETAIL)
        : (await apiClient.get<{ data: TopicDetail }>(`/curriculum/topic/${topicId}`)).data.data;
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      setState({ data: null, loading: false, error: errorMessage(err) });
    }
  }, [topicId]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { ...state, refetch: fetch };
}

// ─── useProgress ──────────────────────────────────────────────────────────────
// Screen: /progress
// Endpoint: GET /api/progress/:studentId

export function useProgress(studentId: string) {
  const [state, setState] = useState<HookState<ProgressData>>(initialState);

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_PROGRESS)
        : (await apiClient.get<{ data: ProgressData }>(`/progress/${studentId}`)).data.data;
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      setState({ data: null, loading: false, error: errorMessage(err) });
    }
  }, [studentId]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { ...state, refetch: fetch };
}

// ─── useWeakAreas ─────────────────────────────────────────────────────────────
// Screen: /progress (weak areas panel)
// Endpoint: GET /api/curriculum/weak-areas/:studentId

export function useWeakAreas(studentId: string) {
  const [state, setState] = useState<HookState<WeakArea[]>>(initialState);

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_WEAK_AREAS)
        : (await apiClient.get<{ data: WeakArea[] }>(`/curriculum/weak-areas/${studentId}`)).data.data;
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      setState({ data: null, loading: false, error: errorMessage(err) });
    }
  }, [studentId]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { ...state, refetch: fetch };
}

// ─── useDailyQuests ───────────────────────────────────────────────────────────
// Screen: /dashboard (quests panel) + standalone /quests
// Endpoint: GET /api/daily-quests/:studentId

export function useDailyQuests(studentId: string) {
  const [state, setState] = useState<HookState<DailyQuest[]>>(initialState);

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_DAILY_QUESTS)
        : (await apiClient.get<{ data: DailyQuest[] }>(`/daily-quests/${studentId}`)).data.data;
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      setState({ data: null, loading: false, error: errorMessage(err) });
    }
  }, [studentId]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { ...state, refetch: fetch };
}

// ─── usePracticeSession ───────────────────────────────────────────────────────
// Screen: /practice
// Manages the full session lifecycle:
//   startSession → submitAnswer → getHint → getExplanation

export function usePracticeSession() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);
  const [tutorResponse, setTutorResponse] = useState<TutorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** POST /api/practice/start — creates a session and returns first question */
  const startSession = useCallback(async (request: PracticeStartRequest) => {
    setLoading(true);
    setError(null);
    setLastResult(null);
    setTutorResponse(null);
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_SESSION_START)
        : (await apiClient.post<{ data: PracticeSession }>("/practice/start", request)).data.data;
      setSession(data);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /** POST /api/practice/submit — submits an answer, returns result + next question */
  const submitAnswer = useCallback(async (request: SubmitAnswerRequest) => {
    setLoading(true);
    setError(null);
    setTutorResponse(null);
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_SUBMIT_CORRECT)
        : (await apiClient.post<{ data: SubmissionResult }>("/practice/submit", request)).data.data;

      setLastResult(data);

      // Advance session state if there's a next question
      if (data.nextQuestion && session) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                currentIndex:    prev.currentIndex + 1,
                xpEarned:        prev.xpEarned + data.xpEarned,
                currentQuestion: data.nextQuestion!,
              }
            : prev
        );
      }
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [session]);

  /** POST /api/practice/hint — gets a hint for the current question */
  const getHint = useCallback(async (request: HintRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_HINT_2)
        : (await apiClient.post<{ data: TutorResponse }>("/practice/hint", request)).data.data;
      setTutorResponse(data);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /** POST /api/practice/explanation — gets a full explanation */
  const getExplanation = useCallback(async (request: ExplanationRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = USE_MOCK
        ? await withMockDelay(MOCK_EXPLANATION_FULL)
        : (await apiClient.post<{ data: TutorResponse }>("/practice/explanation", request)).data.data;
      setTutorResponse(data);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTutor = useCallback(() => setTutorResponse(null), []);

  return {
    session,
    lastResult,
    tutorResponse,
    loading,
    error,
    startSession,
    submitAnswer,
    getHint,
    getExplanation,
    clearTutor,
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
