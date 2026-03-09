/**
 * @module hooks/use-progress
 *
 * Data hooks for the /progress screen.
 * Loads progress summary and daily quests in parallel — call both hooks
 * at the top of the Progress page component.
 *
 * PARALLEL LOADING PATTERN:
 *   const progress = useProgress(studentId);
 *   const quests   = useDailyQuests(studentId);
 *   const isLoading = progress.isLoading || quests.isLoading;
 */

"use client";

import { useQuery }  from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { withMockDelay, MOCK_PROGRESS, MOCK_DAILY_QUESTS } from "@/lib/mock-data";

import type { ProgressData, DailyQuest } from "@/types";

const USE_MOCK = process.env["NEXT_PUBLIC_USE_MOCK_DATA"] === "true";

// ─── useProgress ──────────────────────────────────────────────────────────────

/**
 * Fetches the student's aggregate progress stats:
 * XP, streaks, total sessions, topic-by-topic accuracy, and mastery levels.
 * Powers the /progress screen's stats row, level card, and topic list.
 *
 * @param studentId — authenticated student ID
 */
export function useProgress(studentId: string) {
  return useQuery<ProgressData, Error>({
    queryKey: queryKeys.progress.summary(studentId),
    queryFn:  async () => {
      if (USE_MOCK) return withMockDelay(MOCK_PROGRESS);
      const res = await apiClient.get<{ data: ProgressData }>(
        `/progress/${studentId}`
      );
      return res.data.data;
    },
    enabled:   Boolean(studentId),
    staleTime: 30_000,
    gcTime:    5 * 60_000,
    retry:     2,
  });
}

// ─── useDailyQuests ───────────────────────────────────────────────────────────

/**
 * Fetches the student's 3 daily quests.
 * Quests expire at midnight — staleTime is set accordingly.
 * Used on both /dashboard and /progress.
 *
 * @param studentId — authenticated student ID
 */
export function useDailyQuests(studentId: string) {
  return useQuery<DailyQuest[], Error>({
    queryKey: queryKeys.dailyQuests(studentId),
    queryFn:  async () => {
      if (USE_MOCK) return withMockDelay(MOCK_DAILY_QUESTS);
      const res = await apiClient.get<{ data: DailyQuest[] }>(
        `/daily-quests/${studentId}`
      );
      return res.data.data;
    },
    enabled:   Boolean(studentId),
    staleTime: 60_000,    // quests update when completed — refetch after mutations
    gcTime:    5 * 60_000,
    retry:     2,
  });
}
