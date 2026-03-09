/**
 * @module apps/web/lib/query-keys
 *
 * Centralised React Query key factories for all MathAI data endpoints.
 *
 * WHY THIS FILE EXISTS:
 * - Ensures query keys are consistent between fetches and cache invalidations
 * - Makes it easy to invalidate related queries after mutations
 *   e.g. after a practice session ends, invalidate both progress and dashboard
 * - Single source of truth — change a key shape here and everything updates
 *
 * USAGE:
 *   import { queryKeys } from "@/lib/query-keys";
 *
 *   // In a query hook:
 *   useQuery({ queryKey: queryKeys.dashboard(studentId), ... })
 *
 *   // After a mutation to invalidate related data:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(studentId) });
 *   queryClient.invalidateQueries({ queryKey: queryKeys.progress.all(studentId) });
 */

// ─── Root namespace keeps all MathAI keys isolated from other apps ─────────────
const ROOT = "mathai" as const;

export const queryKeys = {
  // ── Dashboard ────────────────────────────────────────────────────────────────
  // GET /api/dashboard/:studentId
  dashboard: (studentId: string) =>
    [ROOT, "dashboard", studentId] as const,

  // ── Curriculum ───────────────────────────────────────────────────────────────
  curriculum: {
    // GET /api/curriculum?grade=G4
    byGrade: (grade: string, strand?: string) =>
      [ROOT, "curriculum", grade, strand ?? "all"] as const,

    // GET /api/curriculum/topic/:topicId
    topic: (topicId: string) =>
      [ROOT, "curriculum", "topic", topicId] as const,

    // GET /api/curriculum/weak-areas/:studentId
    weakAreas: (studentId: string) =>
      [ROOT, "curriculum", "weak-areas", studentId] as const,
  },

  // ── Progress ─────────────────────────────────────────────────────────────────
  progress: {
    // GET /api/progress/:studentId
    summary: (studentId: string) =>
      [ROOT, "progress", studentId] as const,

    // Prefix to invalidate all progress-related queries for a student
    all: (studentId: string) =>
      [ROOT, "progress", studentId] as const,
  },

  // ── Quests ───────────────────────────────────────────────────────────────────
  // GET /api/daily-quests/:studentId
  dailyQuests: (studentId: string) =>
    [ROOT, "daily-quests", studentId] as const,

  // ── Practice (mutations, not queries — but useful for cache keys) ─────────────
  practice: {
    // Key used when checking session state in cache
    session: (sessionId: string) =>
      [ROOT, "practice", "session", sessionId] as const,
  },
} as const;

// ─── Mutation keys (for useMutation's mutationKey, e.g. for DevTools) ─────────

export const mutationKeys = {
  practice: {
    start:       [ROOT, "practice", "start"]       as const,
    submit:      [ROOT, "practice", "submit"]      as const,
    hint:        [ROOT, "practice", "hint"]        as const,
    explanation: [ROOT, "practice", "explanation"] as const,
  },
} as const;

// ─── Invalidation helpers ─────────────────────────────────────────────────────
//
// Call these from onSuccess callbacks after mutations that affect multiple
// data domains. Pass `queryClient` from `useQueryClient()`.

/** Invalidate all student-level data after a practice session completes */
export function invalidateAfterSession(
  queryClient: { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => void },
  studentId: string
): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(studentId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.progress.all(studentId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.dailyQuests(studentId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.weakAreas(studentId) });
}
