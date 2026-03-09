/**
 * @module hooks/use-practice-session
 *
 * Stateful hook that manages the full practice session lifecycle.
 * This is the most complex hook in the app — it coordinates:
 *   1. Session creation (POST /practice/start)
 *   2. Answer submission (POST /practice/submit)
 *   3. Hint requests    (POST /practice/hint)
 *   4. Explanation requests (POST /practice/explanation)
 *   5. Local screen state machine (idle → active → submitted → tutor → complete)
 *
 * Uses React Query mutations for API calls and useReducer for screen state.
 * Invalidates dashboard/progress/quest caches after session completion.
 *
 * USAGE:
 *   const session = usePracticeSession(studentId);
 *   session.start({ topicId: "g4-fractions-add", mode: "topic_practice", grade: "G4" });
 */

"use client";

import { useReducer, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient }      from "@/lib/api-client";
import { mutationKeys }   from "@/lib/query-keys";
import { invalidateAfterSession } from "@/lib/query-keys";
import { errorMessage }   from "@/lib/utils";
import {
  withMockDelay,
  MOCK_SESSION_START,
  MOCK_SUBMIT_CORRECT,
  MOCK_HINT_2,
  MOCK_EXPLANATION_FULL,
} from "@/lib/mock-data";

import type {
  PracticeSession,
  SubmissionResult,
  TutorResponse,
  PracticeStartRequest,
  SubmitAnswerRequest,
  HintRequest,
  ExplanationRequest,
  PracticeScreenState,
  FeedbackType,
} from "@/types";

const USE_MOCK = process.env["NEXT_PUBLIC_USE_MOCK_DATA"] === "true";

// ─── State machine ─────────────────────────────────────────────────────────────

interface PracticeState {
  screen:        PracticeScreenState;
  session:       PracticeSession | null;
  lastResult:    SubmissionResult | null;
  tutorResponse: TutorResponse | null;
  feedbackType:  FeedbackType;
  error:         string | null;
}

type PracticeAction =
  | { type: "SESSION_STARTED";   session: PracticeSession }
  | { type: "ANSWER_SUBMITTED";  result: SubmissionResult }
  | { type: "TUTOR_RECEIVED";    response: TutorResponse }
  | { type: "SHOW_TUTOR" }
  | { type: "BACK_TO_QUESTION" }
  | { type: "NEXT_QUESTION" }
  | { type: "SESSION_COMPLETE" }
  | { type: "ERROR";             message: string }
  | { type: "RESET" };

function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case "SESSION_STARTED":
      return {
        ...state,
        screen:     "active",
        session:    action.session,
        lastResult: null,
        error:      null,
      };

    case "ANSWER_SUBMITTED": {
      const result = action.result;
      const isComplete = result.nextAction === "session_complete";
      return {
        ...state,
        screen:       isComplete ? "complete" : "submitted",
        lastResult:   result,
        feedbackType: result.isCorrect ? "correct" : "wrong",
        // Advance session counters + swap next question in
        session: state.session && result.nextQuestion
          ? {
              ...state.session,
              currentIndex:    state.session.currentIndex + 1,
              xpEarned:        state.session.xpEarned + result.xpEarned,
              currentQuestion: result.nextQuestion,
            }
          : state.session,
      };
    }

    case "TUTOR_RECEIVED":
      return { ...state, screen: "tutor", tutorResponse: action.response };

    case "SHOW_TUTOR":
      return { ...state, screen: "tutor" };

    case "BACK_TO_QUESTION":
      return { ...state, screen: "active", tutorResponse: null };

    case "NEXT_QUESTION":
      return {
        ...state,
        screen:        "active",
        lastResult:    null,
        tutorResponse: null,
        feedbackType:  null,
      };

    case "SESSION_COMPLETE":
      return { ...state, screen: "complete" };

    case "ERROR":
      return { ...state, error: action.message };

    case "RESET":
      return INITIAL_STATE;

    default:
      return state;
  }
}

const INITIAL_STATE: PracticeState = {
  screen:        "idle",
  session:       null,
  lastResult:    null,
  tutorResponse: null,
  feedbackType:  null,
  error:         null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param studentId — used for cache invalidation after session ends
 */
export function usePracticeSession(studentId: string) {
  const [state, dispatch] = useReducer(practiceReducer, INITIAL_STATE);
  const queryClient = useQueryClient();

  // ── POST /practice/start ──────────────────────────────────────────────────

  const startMutation = useMutation<PracticeSession, Error, PracticeStartRequest>({
    mutationKey: mutationKeys.practice.start,
    mutationFn:  async (req) => {
      if (USE_MOCK) return withMockDelay(MOCK_SESSION_START);
      const res = await apiClient.post<{ data: PracticeSession }>("/practice/start", req);
      return res.data.data;
    },
    onSuccess: (data) => dispatch({ type: "SESSION_STARTED", session: data }),
    onError:   (err)  => dispatch({ type: "ERROR", message: errorMessage(err) }),
  });

  // ── POST /practice/submit ─────────────────────────────────────────────────

  const submitMutation = useMutation<SubmissionResult, Error, SubmitAnswerRequest>({
    mutationKey: mutationKeys.practice.submit,
    mutationFn:  async (req) => {
      if (USE_MOCK) return withMockDelay(MOCK_SUBMIT_CORRECT);
      const res = await apiClient.post<{ data: SubmissionResult }>("/practice/submit", req);
      return res.data.data;
    },
    onSuccess: (data) => {
      dispatch({ type: "ANSWER_SUBMITTED", result: data });
      // If session is done, invalidate all downstream caches
      if (data.nextAction === "session_complete" && studentId) {
        invalidateAfterSession(queryClient, studentId);
      }
    },
    onError: (err) => dispatch({ type: "ERROR", message: errorMessage(err) }),
  });

  // ── POST /practice/hint ───────────────────────────────────────────────────

  const hintMutation = useMutation<TutorResponse, Error, HintRequest>({
    mutationKey: mutationKeys.practice.hint,
    mutationFn:  async (req) => {
      if (USE_MOCK) return withMockDelay(MOCK_HINT_2);
      const res = await apiClient.post<{ data: TutorResponse }>("/practice/hint", req);
      return res.data.data;
    },
    onSuccess: (data) => dispatch({ type: "TUTOR_RECEIVED", response: data }),
    onError:   (err)  => dispatch({ type: "ERROR", message: errorMessage(err) }),
  });

  // ── POST /practice/explanation ────────────────────────────────────────────

  const explanationMutation = useMutation<TutorResponse, Error, ExplanationRequest>({
    mutationKey: mutationKeys.practice.explanation,
    mutationFn:  async (req) => {
      if (USE_MOCK) return withMockDelay(MOCK_EXPLANATION_FULL);
      const res = await apiClient.post<{ data: TutorResponse }>("/practice/explanation", req);
      return res.data.data;
    },
    onSuccess: (data) => dispatch({ type: "TUTOR_RECEIVED", response: data }),
    onError:   (err)  => dispatch({ type: "ERROR", message: errorMessage(err) }),
  });

  // ── Public API ────────────────────────────────────────────────────────────

  const start       = useCallback((req: PracticeStartRequest) => startMutation.mutate(req), [startMutation]);
  const submit      = useCallback((req: SubmitAnswerRequest)  => submitMutation.mutate(req), [submitMutation]);
  const getHint     = useCallback((req: HintRequest)          => hintMutation.mutate(req), [hintMutation]);
  const getExplanation = useCallback((req: ExplanationRequest) => explanationMutation.mutate(req), [explanationMutation]);
  const nextQuestion   = useCallback(() => dispatch({ type: "NEXT_QUESTION" }), []);
  const backToQuestion = useCallback(() => dispatch({ type: "BACK_TO_QUESTION" }), []);
  const reset          = useCallback(() => dispatch({ type: "RESET" }), []);

  const isLoading =
    startMutation.isPending ||
    submitMutation.isPending ||
    hintMutation.isPending ||
    explanationMutation.isPending;

  return {
    // State
    screen:        state.screen,
    session:       state.session,
    lastResult:    state.lastResult,
    tutorResponse: state.tutorResponse,
    feedbackType:  state.feedbackType,
    error:         state.error,
    isLoading,

    // Actions
    start,
    submit,
    getHint,
    getExplanation,
    nextQuestion,
    backToQuestion,
    reset,
  };
}
