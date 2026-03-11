/**
 * @module hooks
 *
 * Barrel export for all MathAI data hooks.
 *
 * HOOK SUMMARY:
 *
 * ┌─────────────────────────┬──────────────────────────────────┬──────────────┐
 * │ Hook                    │ Endpoint                         │ Screen       │
 * ├─────────────────────────┼──────────────────────────────────┼──────────────┤
 * │ useDashboard(id)        │ GET /dashboard/:id               │ /dashboard   │
 * │ useCurriculum(grade)    │ GET /curriculum?grade=G4         │ /curriculum  │
 * │ useTopicDetail(topicId) │ GET /curriculum/topic/:id        │ /topic/:id   │
 * │ useWeakAreas(id)        │ GET /curriculum/weak-areas/:id   │ /progress    │
 * │ useProgress(id)         │ GET /progress/:id                │ /progress    │
 * │ useDailyQuests(id)      │ GET /daily-quests/:id            │ /dashboard   │
 * │ useProfile()            │ GET/PATCH /profile               │ everywhere   │
 * │ usePracticeMenu()       │ GET /practice/menu               │ /dashboard   │
 * └─────────────────────────┴──────────────────────────────────┴──────────────┘
 *
 * All hooks are React Query powered (v5).
 * Set NEXT_PUBLIC_USE_MOCK_DATA=true to use mock data without a running backend.
 *
 * LEGACY: lib/api-hooks.ts contains useState+useEffect versions kept for reference.
 *
 * UI HOOKS (from shadcn):
 *   useToast     — toast notification state
 *   useIsMobile  — responsive breakpoint detection
 */

export { useDashboard }                           from "./use-dashboard";
export { useCurriculum, useTopicDetail, useWeakAreas } from "./use-curriculum";
export { useProgress, useDailyQuests }            from "./use-progress";
export { useProfile }                             from "./use-profile";
export { usePracticeMenu }                        from "./use-practice-menu";
export { useToast, toast }                        from "./use-toast";
export { useIsMobile }                            from "./use-mobile";
