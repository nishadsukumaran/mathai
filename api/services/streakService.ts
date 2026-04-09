/**
 * @module api/services/streakService
 *
 * Persists daily streak updates by wrapping the StreakEngine.
 *
 * The StreakEngine is a pure function — it takes lastActiveDate and
 * currentStreak and returns the new status. This service adds the DB
 * upsert and XP award logic on top.
 *
 * Call this ONCE per meaningful daily activity (dashboard load, practice
 * session complete). It's idempotent within the same calendar day — calling
 * it multiple times a day won't inflate the streak.
 */

import { prisma } from "../lib/prisma";
import { streakEngine } from "../../services/gamification/streak_engine";

export interface StreakUpdateResult {
  currentStreak:    number;
  longestStreak:    number;
  milestoneReached: number | null;
  xpAwarded:        number;
  streakBroken:     boolean;
}

/**
 * Touches a student's streak — increments if the student logged in on a
 * consecutive day, maintains if same day, resets to 1 if broken.
 *
 * Always updates `lastActiveDate` to today. Awards milestone XP if hit.
 *
 * Fire-and-forget safe: wraps everything in try/catch and returns null on
 * failure so callers never block on streak persistence issues.
 */
export async function touchStreak(userId: string): Promise<StreakUpdateResult | null> {
  try {
    // 1. Fetch or create the streak row
    const existing = await prisma.streak.findUnique({ where: { userId } });

    const currentStreak  = existing?.currentStreak  ?? 0;
    const longestStreak  = existing?.longestStreak  ?? 0;
    const lastActiveDate = existing?.lastActiveDate ?? null;

    // 2. Compute new status via pure engine
    const status = streakEngine.processLogin(lastActiveDate, currentStreak);

    // 3. Same-day call: nothing to persist
    if (
      lastActiveDate &&
      isSameDay(lastActiveDate, new Date()) &&
      !status.milestoneReached
    ) {
      return {
        currentStreak:    status.currentStreak,
        longestStreak,
        milestoneReached: null,
        xpAwarded:        0,
        streakBroken:     false,
      };
    }

    const newLongest = Math.max(longestStreak, status.currentStreak);

    // 4. Upsert the streak row
    await prisma.streak.upsert({
      where:  { userId },
      create: {
        userId,
        currentStreak:  status.currentStreak,
        longestStreak:  newLongest,
        lastActiveDate: new Date(),
      },
      update: {
        currentStreak:  status.currentStreak,
        longestStreak:  newLongest,
        lastActiveDate: new Date(),
      },
    });

    // 5. Also update StudentProfile.streakCount denormalisation (used by
    //    parent dashboard + some legacy reads)
    await prisma.studentProfile.upsert({
      where:  { userId },
      create: { userId, streakCount: status.currentStreak },
      update: { streakCount: status.currentStreak },
    }).catch((err) => console.error("[streakService] profile streakCount update failed:", err));

    // 6. Award milestone XP if hit
    if (status.xpBonus > 0) {
      await prisma.studentProfile.update({
        where: { userId },
        data:  { totalXp: { increment: status.xpBonus } },
      }).catch((err) => console.error("[streakService] milestone XP award failed:", err));
    }

    return {
      currentStreak:    status.currentStreak,
      longestStreak:    newLongest,
      milestoneReached: status.milestoneReached,
      xpAwarded:        status.xpBonus,
      streakBroken:     status.streakBroken,
    };
  } catch (err) {
    console.error("[streakService] touchStreak failed:", err);
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth()    === b.getUTCMonth() &&
    a.getUTCDate()     === b.getUTCDate()
  );
}
