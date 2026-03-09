/**
 * @module components/mathai
 *
 * Barrel export for MathAI domain-specific UI components.
 *
 * COMPONENT OVERVIEW:
 *
 * ┌──────────────────┬─────────────────────────────────────────────────────────┐
 * │ Component        │ Description                                             │
 * ├──────────────────┼─────────────────────────────────────────────────────────┤
 * │ XPBar            │ XP progress bar. compact prop for top bar inline use.   │
 * │ StreakCounter    │ Flame icon + streak count. compact prop for top bar.    │
 * │ QuestCard        │ Daily quest card with progress bar and XP chip.         │
 * │ BadgeChip        │ Compact circular badge for shelf / reward displays.     │
 * │ BadgeCard        │ Full badge card with description (progress page).       │
 * │ LockedBadge      │ Greyed placeholder for unearned badges.                 │
 * │ MasteryRing      │ SVG circular ring colour-coded by mastery level.        │
 * │ TopicCard        │ Curriculum grid card with mastery ring + lock overlay.  │
 * │ LessonRow        │ Lesson list row with state icon, XP chip, CTA button.  │
 * └──────────────────┴─────────────────────────────────────────────────────────┘
 *
 * All components:
 *   - Accept a className prop for layout overrides
 *   - Are typed against @mathai/shared-types via @/types
 *   - Use the cn() utility from @/lib/utils for class merging
 *   - Are purely presentational — no data fetching
 */

export { XPBar }                                  from "./xp-bar";
export { StreakCounter }                           from "./streak-counter";
export { QuestCard }                              from "./quest-card";
export { BadgeChip, BadgeCard, LockedBadge }      from "./badge";
export { MasteryRing }                            from "./mastery-ring";
export { TopicCard }                              from "./topic-card";
export { LessonRow }                              from "./lesson-row";
