/**
 * @module components/shared
 * Barrel export for reusable cross-screen shared components.
 */

export {
  Skeleton,
  SkeletonText,
  SkeletonHeading,
  SkeletonLabel,
  SkeletonQuestCard,
  SkeletonTopicCard,
  SkeletonLessonRow,
  SkeletonLevelCard,
  SkeletonStatCard,
  SkeletonDashboard,
} from "./skeleton";

export { ErrorState, InlineError }                          from "./error-state";
export {
  EmptyState,
  EmptyBadges,
  EmptyQuests,
  EmptyWeakAreas,
  EmptyProgress,
  EmptyCurriculum,
} from "./empty-state";

export { ThemeProvider }                           from "./theme-provider";
