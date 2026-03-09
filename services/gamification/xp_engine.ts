/**
 * @module services/gamification/xp_engine
 *
 * Manages all XP (experience points) logic for the MathAI gamification system.
 *
 * XP RULES:
 *   Correct answer (first attempt)   → +10 XP
 *   Retry success (2nd+ attempt)     → +6 XP
 *   Daily login                      → +5 XP
 *   Lesson completion                → +15 XP
 *   Challenge completion             → +20 XP
 *   Streak milestone (7, 14, 30d)    → +10 XP
 *   Badge earned                     → variable (defined on badge)
 *   Quest completed                  → variable (defined on quest)
 *
 * LEVELS:
 *   Each level requires progressively more XP.
 *   Level formula: XP required = 100 * (level ^ 1.5)
 *   Level 1: 0 XP | Level 2: 283 XP | Level 5: 1118 XP | Level 10: 3162 XP
 *
 * DESIGN:
 *   - XP is additive and never decreases
 *   - All XP events are logged to the xp_events table for analytics
 *   - Level-up is detected automatically when XP crosses a threshold
 *   - XP does NOT reset between grades — it's a lifetime progression metric
 */

import { XPEvent, XPReason, LevelThreshold } from "@/types";

// ─── Level Definitions ─────────────────────────────────────────────────────────

export const LEVELS: LevelThreshold[] = [
  { level: 1, label: "Math Seedling",    minXP: 0,     maxXP: 99 },
  { level: 2, label: "Number Explorer",  minXP: 100,   maxXP: 282 },
  { level: 3, label: "Problem Solver",   minXP: 283,   maxXP: 559 },
  { level: 4, label: "Equation Hunter",  minXP: 560,   maxXP: 999 },
  { level: 5, label: "Fraction Fighter", minXP: 1000,  maxXP: 1527 },
  { level: 6, label: "Math Navigator",   minXP: 1528,  maxXP: 2154 },
  { level: 7, label: "Logic Master",     minXP: 2155,  maxXP: 2899 },
  { level: 8, label: "Number Ninja",     minXP: 2900,  maxXP: 3779 },
  { level: 9, label: "Math Wizard",      minXP: 3780,  maxXP: 4802 },
  { level: 10, label: "Math Champion",   minXP: 4803,  maxXP: Infinity },
];

// ─── XP Amounts ───────────────────────────────────────────────────────────────

export const XP_TABLE: Record<XPReason, number> = {
  [XPReason.CorrectAnswer]:       10,
  [XPReason.RetrySuccess]:         6,
  [XPReason.DailyLogin]:           5,
  [XPReason.LessonComplete]:      15,
  [XPReason.ChallengeComplete]:   20,
  [XPReason.StreakBonus]:         10,
  [XPReason.BadgeEarned]:          0,  // set per badge
  [XPReason.QuestComplete]:        0,  // set per quest
};

// ─── Engine ────────────────────────────────────────────────────────────────────

export class XPEngine {
  /**
   * Calculates XP to award for a given reason.
   * Override with bonusMultiplier for double-XP events.
   */
  calculateXP(reason: XPReason, override?: number, bonusMultiplier: number = 1): number {
    const base = override ?? XP_TABLE[reason] ?? 0;
    return Math.floor(base * bonusMultiplier);
  }

  /**
   * Builds an XP event record ready for DB persistence and analytics.
   */
  buildEvent(
    studentId: string,
    reason: XPReason,
    amount: number,
    metadata?: Record<string, unknown>
  ): XPEvent {
    return {
      studentId,
      amount,
      reason,
      metadata,
      timestamp: new Date(),
    };
  }

  /**
   * Returns the level for a given total XP amount.
   */
  getLevelForXP(totalXP: number): LevelThreshold {
    const level = [...LEVELS].reverse().find((l) => totalXP >= l.minXP);
    return level ?? LEVELS[0]!;
  }

  /**
   * Returns XP progress within the current level (0–1 fraction).
   */
  getLevelProgress(totalXP: number): number {
    const level = this.getLevelForXP(totalXP);
    if (level.maxXP === Infinity) return 1;

    const progressInLevel = totalXP - level.minXP;
    const levelRange = level.maxXP - level.minXP;
    return Math.min(progressInLevel / levelRange, 1);
  }

  /**
   * Detects if adding XP causes a level-up.
   * Returns the new level if levelled up, otherwise null.
   */
  detectLevelUp(
    currentXP: number,
    xpToAdd: number
  ): LevelThreshold | null {
    const before = this.getLevelForXP(currentXP);
    const after = this.getLevelForXP(currentXP + xpToAdd);

    if (after.level > before.level) return after;
    return null;
  }

  /**
   * XP needed to reach the next level from current total.
   */
  xpToNextLevel(totalXP: number): number {
    const current = this.getLevelForXP(totalXP);
    if (current.maxXP === Infinity) return 0;
    return current.maxXP + 1 - totalXP;
  }
}

export const xpEngine = new XPEngine();
