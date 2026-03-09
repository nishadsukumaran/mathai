/**
 * @module hooks/use-dashboard
 *
 * Data hook for the /dashboard screen.
 * Fetches DashboardData (student, XP, streak, quests, badges, recommended lesson).
 *
 * Returns the full React Query result — callers get data, isLoading, isError,
 * error, refetch, and all other RQ fields out of the box.
 *
 * MOCK MODE: set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local
 */

"use client";

import { useQuery }       from "@tanstack/react-query";
import { apiClient }      from "@/lib/api-client";
import { queryKeys }      from "@/lib/query-keys";
import { withMockDelay, MOCK_DASHBOARD } from "@/lib/mock-data";

import type { DashboardData } from "@/types";

const USE_MOCK = process.env["NEXT_PUBLIC_USE_MOCK_DATA"] === "true";

/**
 * Fetches all dashboard data for a student in a single request.
 *
 * @param studentId — the authenticated student's ID (from session)
 *
 * @example
 * const { data, isLoading, error } = useDashboard(session.user.id);
 */
export function useDashboard(studentId: string) {
  return useQuery<DashboardData, Error>({
    queryKey: queryKeys.dashboard(studentId),
    queryFn:  async () => {
      if (USE_MOCK) return withMockDelay(MOCK_DASHBOARD);
      const res = await apiClient.get<{ data: DashboardData }>(
        `/dashboard/${studentId}`
      );
      return res.data.data;
    },
    enabled:   Boolean(studentId),
    staleTime: 30_000,    // treat fresh for 30s (data changes slowly)
    gcTime:    5 * 60_000, // keep in cache for 5 min after unmount
    retry:     2,
  });
}
