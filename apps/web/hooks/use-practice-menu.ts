/**
 * @module apps/web/hooks/use-practice-menu
 *
 * Client-side hook for fetching the personalised, AI-generated practice menu.
 * Wraps GET /api/practice/menu via React Query.
 *
 * Caching strategy:
 *   - staleTime: 30s — short window so that if the first fetch returns an empty
 *     menu (e.g. topics not yet generated on a cold Render start), the next
 *     mount/focus will immediately re-fetch rather than serving stale empty data.
 *     Once topics exist the response is stable and a 30s window is fine.
 *   - gcTime: 24 hours — keeps the cached result in memory across page transitions.
 *   - refetchOnMount: "always" — always check for fresh data on mount so users
 *     returning to /practice after topics finish generating see them immediately.
 *   - Invalidated explicitly when a practice session completes via
 *     invalidateAfterSession() in query-keys.ts, which triggers a fresh
 *     AI-generated menu based on the newly updated topic progress.
 *
 * USAGE:
 *   const { menu, loading, refetch } = usePracticeMenu();
 */

"use client";

import { useQuery }         from "@tanstack/react-query";
import { clientGet }        from "@/lib/clientApi";
import { queryKeys }        from "@/lib/query-keys";
import type { PracticeMenu } from "@mathai/shared-types";

export function usePracticeMenu() {
  const { data, isLoading, isError, refetch } = useQuery<PracticeMenu | null>({
    queryKey: queryKeys.practiceMenu,
    queryFn:  () => clientGet<PracticeMenu>("/practice/menu"),
    // Short stale window: if the menu came back empty (topics not yet generated),
    // the next mount will re-fetch straight away instead of serving cached empty data.
    staleTime:       30 * 1000,
    gcTime:          24 * 60 * 60 * 1000,
    retry:           2,
    // Always check on mount so users returning to /practice after sign-up get
    // their topics as soon as the background job finishes generating them.
    refetchOnMount:  "always",
  });

  return {
    menu:    data ?? null,
    loading: isLoading,
    error:   isError ? "Could not load practice menu" : null,
    refetch,
  };
}
