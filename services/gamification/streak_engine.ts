/**
 * @module services/gamification/streak_engine
 *
 * Tracks and manages daily login streaks for students.
 *
 * STREAK RULES:
 *   - A streak increments when a student logs in on consecutive calendar days
 *   - A streak breaks if more than 1 calendar day is missed (not 24h — midnight-based)
 *   - A streak is maintained (not incremented) if the student logs in twice in one day
 *   - Streak freeze: students can earn a "streak shield" item that protects once
 *
 * STREAK MILESTONES (trigger bonus XP + badge):
 *   3 days   → "On A Roll!" badge
 *   7 days   → "Week Warrior" badge + 10 XP
 *   14 days  → "Two Week Titan" badge + 20 XP
 *   30 days  → "Month Master" badge + 50 XP
 *   100 days → "Legendary Learner" badge + 100 XP
 *
 * DESIGN:
 *   Streak data is a single row per student in the `streaks` table.
 *   The engine reads lastActiveDate and streakDays from that row.
 */

export interface StreakStatus {
  currentStreak: number;
  isStreakAlive: boolean;
  streakBroken: boolean;
  milestoneReached: number | null;  // streak day count if a milestone was just hit
  xpBonus: number;
}

export const STREAK_MILESTONES: Record<number, { badgeId: string; xpBonus: number; label: string }> = {
  3:   { badgeId: "badge-streak-3",   xpBonus: 5,   label: "On A Roll!" },
  7:   { badgeId: "badge-streak-7",   xpBonus: 10,  label: "Week Warrior" },
  14:  { badgeId: "badge-streak-14",  xpBonus: 20,  label: "Two Week Titan" },
  30:  { badgeId: "badge-streak-30",  xpBonus: 50,  label: "Month Master" },
  100: { badgeId: "badge-streak-100", xpBonus: 100, label: "Legendary Learner" },
};

export class StreakEngine {
  /**
   * Processes a student's login event and returns updated streak status.
   * This should be called ONCE per session (idempotent within the same calendar day).
   */
  processLogin(lastActiveDate: Date | null, currentStreak: number): StreakStatus {
    const today = this.toDateOnly(new Date());

    if (!lastActiveDate) {
      // First ever login
      return this.buildStatus(1, false, false);
    }

    const last = this.toDateOnly(lastActiveDate);
    const daysDiff = this.daysBetween(last, today);

    if (daysDiff === 0) {
      // Same day — streak maintained, not incremented
      return this.buildStatus(currentStreak, false, false);
    }

    if (daysDiff === 1) {
      // Consecutive day — streak incremented
      const newStreak = currentStreak + 1;
      return this.buildStatus(newStreak, false, false);
    }

    // Missed at least one day — streak broken
    return this.buildStatus(1, true, false);
  }

  /**
   * Checks if a streak count hits a milestone and returns metadata.
   */
  checkMilestone(streakDays: number): typeof STREAK_MILESTONES[number] | null {
    return STREAK_MILESTONES[streakDays] ?? null;
  }

  /**
   * Applies a streak shield (freeze) to protect a broken streak.
   * Returns the restored streak count if shield is available.
   */
  applyStreakShield(
    currentStreak: number,
    hasShield: boolean
  ): { newStreak: number; shieldConsumed: boolean } {
    if (!hasShield) return { newStreak: currentStreak, shieldConsumed: false };
    // Shield restores last streak instead of resetting to 1
    return { newStreak: currentStreak, shieldConsumed: true };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private buildStatus(
    streak: number,
    broken: boolean,
    shieldUsed: boolean
  ): StreakStatus {
    const milestone = this.checkMilestone(streak);

    return {
      currentStreak: streak,
      isStreakAlive: !broken,
      streakBroken: broken,
      milestoneReached: milestone ? streak : null,
      xpBonus: milestone?.xpBonus ?? 0,
    };
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().split("T")[0] ?? "";
  }

  private daysBetween(dateA: string, dateB: string): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = new Date(dateB).getTime() - new Date(dateA).getTime();
    return Math.round(diff / msPerDay);
  }
}

export const streakEngine = new StreakEngine();
