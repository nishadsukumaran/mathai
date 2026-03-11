/**
 * @module apps/web/hooks/use-practice-menu
 *
 * Client-side hook for fetching the personalised, AI-generated practice menu.
 * Wraps GET /api/practice/menu via React Query.
 *
 * Caching strategy:
 *   - staleTime: 4 hours — the menu is freshly generated on login and cached
 *     for the session so it doesn't re-call the AI on every navigation.
 *   - gcTime: 24 hours — keeps the cached result in memory across page transitions.
 *   - Invalidated automatically when a practice session completes via
 *     invalidateAfterSession() in query-keys.ts, which triggers a fresh
 *     AI-generated menu based on the newly updated topic progress.
 *
 * USAGE:
 *   const { menu, loading } = usePracticeMenu();
 *   const topThree = menu?.sections.flatMap(s => s.items).slice(0, 3) ?? [];
 */

"use client";

import { useQuery }         from "@tanstack/react-query";
import { clientGet }        from "@/lib/clientApi";
import { queryKeys }        from "@/lib/query-keys";
import type { PracticeMenu } from "@mathai/shared-types";

export function usePracticeMenu() {
  const { data, isLoading, isError } = useQuery<PracticeMenu | null>({
    queryKey: queryKeys.practiceMenu,
    queryFn:  () => clientGet<PracticeMenu>("/practice/menu"),
    // Treat as fresh for 4 hours — avoids redundant AI calls on page navigation.
    // Menu is force-regenerated after topic completion via cache invalidation.
    staleTime: 4 * 60 * 60 * 1000,
    gcTime:    24 * 60 * 60 * 1000,
    retry:     1,
  });

  return {
    menu:    data ?? null,
    loading: isLoading,
    error:   isError ? "Could not load practice menu" : null,
  };
}
