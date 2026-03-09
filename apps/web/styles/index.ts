/**
 * @module styles
 *
 * Style constants and Tailwind class helpers for MathAI.
 *
 * STRUCTURE:
 *   globals.css   is in app/ and imported by app/layout.tsx (Next.js convention).
 *
 * ADD HERE:
 *   - Tailwind animation class constants
 *   - CSS module exports for complex component animations
 *   - Design token references that need to be JS-accessible
 *
 * EXAMPLE:
 *   export const ANIMATION = {
 *     xpFloat:  "animate-xp-float",
 *     badgeReveal: "animate-badge-reveal",
 *   } as const;
 */

export const ANIMATION = {
  xpFloat:      "animate-xp-float",
  badgeReveal:  "animate-badge-reveal",
  shimmer:      "animate-shimmer",
  streakPulse:  "animate-streak-pulse",
  shake:        "animate-shake",
  correctFlash: "animate-correct-flash",
  levelUp:      "animate-level-up",
  progressFill: "animate-progress-fill",
  bounceIn:     "animate-bounce-in",
  xpPop:        "animate-xp-pop",
} as const;

export type AnimationKey = keyof typeof ANIMATION;
