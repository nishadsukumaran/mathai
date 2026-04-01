/**
 * @module apps/web/hooks/use-learning-next
 *
 * Client-side hook for fetching the Learning Brain's next best action.
 * Wraps GET /api/learning/next via React Query.
 *
 * Caching: 60s stale time — the recommendation changes after sessions
 * complete, which triggers explicit invalidation via invalidateAfterSession().
 * Between sessions the recommendation is stable.
 *
 * USAGE:
 *   const { action, loading, error } = useLearningNext();
 */

"use client";

import { useQuery }            from "@tanstack/react-query";
import { clientGet }           from "@/lib/clientApi";
import { queryKeys }           from "@/lib/query-keys";
import type { LearningNextAction } from "@mathai/shared-types";

export function useLearningNext() {
  const { data, isLoading, isError, refetch } = useQuery<LearningNextAction | null>({
    queryKey: queryKeys.learningNext,
    queryFn:  () => clientGet<LearningNextAction>("/learning/next"),
    staleTime:      60 * 1000,          // Fresh for 60s
    gcTime:         24 * 60 * 60 * 1000, // Keep in cache 24h
    retry:          1,
    refetchOnMount: "always",
  });

  return {
    action:  data ?? null,
    loading: isLoading,
    error:   isError ? "Could not load recommendation" : null,
    refetch,
  };
}
