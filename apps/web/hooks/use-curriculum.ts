/**
 * @module hooks/use-curriculum
 *
 * Data hooks for the curriculum screens:
 *   - useCurriculum  → /curriculum page (topic grid)
 *   - useTopicDetail → /topic/:topicId page (lesson list)
 *   - useWeakAreas   → /progress weak-area panel
 */

"use client";

import { useQuery }  from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  withMockDelay,
  MOCK_CURRICULUM,
  MOCK_TOPIC_DETAIL,
  MOCK_WEAK_AREAS,
} from "@/lib/mock-data";

import type { CurriculumData, TopicDetail, WeakArea } from "@/types";

const USE_MOCK = process.env["NEXT_PUBLIC_USE_MOCK_DATA"] === "true";

// ─── useCurriculum ────────────────────────────────────────────────────────────

/**
 * Fetches all topics available for a grade, with mastery + lock state.
 * Powers the /curriculum topic grid.
 *
 * @param grade  — e.g. "G4"
 * @param strand — optional topic strand filter (e.g. "Number & Operations")
 *
 * @example
 * const { data } = useCurriculum("G4");
 * data?.topics.map(t => <TopicCard key={t.id} topic={t} />)
 */
export function useCurriculum(grade: string, strand?: string) {
  return useQuery<CurriculumData, Error>({
    queryKey: queryKeys.curriculum.byGrade(grade, strand),
    queryFn:  async () => {
      if (USE_MOCK) return withMockDelay(MOCK_CURRICULUM);
      const params = new URLSearchParams({ grade });
      if (strand) params.set("strand", strand);
      const res = await apiClient.get<{ data: CurriculumData }>(
        `/curriculum?${params.toString()}`
      );
      return res.data.data;
    },
    enabled:   Boolean(grade),
    staleTime: 60_000,     // curriculum changes rarely — cache aggressively
    gcTime:    10 * 60_000,
    retry:     2,
  });
}

// ─── useTopicDetail ───────────────────────────────────────────────────────────

/**
 * Fetches full topic detail: description, mastery, and ordered lesson list.
 * Powers the /topic/:topicId page.
 *
 * @param topicId — e.g. "g4-fractions-add"
 *
 * @example
 * const { data, isLoading } = useTopicDetail(params.topicId);
 */
export function useTopicDetail(topicId: string) {
  return useQuery<TopicDetail, Error>({
    queryKey: queryKeys.curriculum.topic(topicId),
    queryFn:  async () => {
      if (USE_MOCK) return withMockDelay(MOCK_TOPIC_DETAIL);
      const res = await apiClient.get<{ data: TopicDetail }>(
        `/curriculum/topic/${topicId}`
      );
      return res.data.data;
    },
    enabled:   Boolean(topicId),
    staleTime: 60_000,
    gcTime:    10 * 60_000,
    retry:     1,   // if topic 404s, don't retry aggressively
  });
}

// ─── useWeakAreas ─────────────────────────────────────────────────────────────

/**
 * Fetches weak areas for a student — topics where accuracy is low.
 * Used on the /progress screen's "Focus Here" panel.
 *
 * @param studentId — authenticated student ID
 *
 * @example
 * const { data: weakAreas } = useWeakAreas(session.user.id);
 */
export function useWeakAreas(studentId: string) {
  return useQuery<WeakArea[], Error>({
    queryKey: queryKeys.curriculum.weakAreas(studentId),
    queryFn:  async () => {
      if (USE_MOCK) return withMockDelay(MOCK_WEAK_AREAS);
      const res = await apiClient.get<{ data: WeakArea[] }>(
        `/curriculum/weak-areas/${studentId}`
      );
      return res.data.data;
    },
    enabled:   Boolean(studentId),
    staleTime: 60_000,
    gcTime:    5 * 60_000,
    retry:     2,
  });
}
