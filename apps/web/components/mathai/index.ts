/**
 * @module components/mathai
 *
 * Barrel export for MathAI domain-specific UI components.
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

// ── Wave 1 additions ─────────────────────────────────────────────────────────
export { AskCard }                                from "./ask-card";
export { AskPanel }                               from "./ask-panel";
export { ProfileModal, MOCK_PROFILE }             from "./profile-modal";
export { PracticeMenuView, MOCK_PRACTICE_MENU }   from "./practice-menu";

// Visual diagram renderers (also available from @/components/mathai/visual)
export {
  NumberLine,
  FractionBar,
  ArrayDiagram,
  BarModel,
  PlaceValueChart,
  VisualRenderer,
}                                                 from "./visual";
