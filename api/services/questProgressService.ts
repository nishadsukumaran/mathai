/**
 * @module api/services/questProgressService
 *
 * Updates StudentQuestProgress.progressValue based on learning events.
 *
 * The quest templates (seeded in questService.ts) define trackingKeys that
 * map to real learner behavior. This service receives events and increments
 * the matching active quests:
 *
 *   Event                    → trackingKey
 *   ─────────────────────────────────────────────────
 *   correct answer           → correct_answers
 *   session completed        → sessions_completed
 *   session minutes          → minutes_practiced
 *   correct streak (≥N)      → correct_streak (sets to max reached)
 *   new topic attempted      → new_topics_attempted
 *   hintless session         → hintless_sessions
 *   daily login              → daily_login
 *   topic mastered           → topics_mastered
 *   any topic practised      → topics_attempted
 *
 * When a quest reaches its targetValue:
 *   - status → "completed"
 *   - completedAt → now
 *   - xpReward is added to StudentProfile.totalXp
 *
 * All operations are fire-and-forget — quest failures never block
 * the user's action (answering, practicing, etc.).
 */

import { prisma } from "../lib/prisma";

/** Tracking keys defined in the seeded quest templates. */
export type TrackingKey =
  | "correct_answers"
  | "minutes_practiced"
  | "sessions_completed"
  | "correct_streak"
  | "new_topics_attempted"
  | "hintless_sessions"
  | "daily_login"
  | "topics_mastered"
  | "topics_attempted";

/**
 * Increment all active quests matching a tracking key by the given amount,
 * and mark them completed + award XP if they reach their targetValue.
 *
 * @param userId      - the student
 * @param trackingKey - which metric advanced
 * @param amount      - how much to add (default 1). For "correct_streak",
 *                      the value is treated as an ABSOLUTE max rather than
 *                      an increment (see maxValue semantics).
 * @param maxValue    - if true, progressValue becomes max(current, amount)
 *                      instead of current + amount. Useful for streak-style
 *                      metrics where only the peak matters.
 */
export async function trackQuestProgress(
  userId: string,
  trackingKey: TrackingKey,
  amount = 1,
  maxValue = false,
): Promise<void> {
  if (amount <= 0) return;

  try {
    const now = new Date();

    // Find active quests for this user whose template matches the tracking key.
    const activeQuests = await prisma.studentQuestProgress.findMany({
      where: {
        userId,
        status:    "active",
        expiresAt: { gt: now },
        quest:     { trackingKey },
      },
      include: { quest: true },
    });

    if (activeQuests.length === 0) return;

    for (const qp of activeQuests) {
      if (!qp.quest) continue;
      const target = qp.quest.targetValue;

      // Compute the new progress value
      const newValue = maxValue
        ? Math.max(qp.progressValue, amount)
        : qp.progressValue + amount;

      const isComplete = newValue >= target;

      // Update the quest progress row
      await prisma.studentQuestProgress.update({
        where: { id: qp.id },
        data: {
          progressValue: Math.min(newValue, target),
          ...(isComplete && qp.status === "active"
            ? { status: "completed", completedAt: now }
            : {}),
        },
      });

      // Award XP if the quest JUST completed (not already completed)
      if (isComplete && qp.status === "active" && qp.quest.xpReward > 0) {
        await prisma.studentProfile.upsert({
          where:  { userId },
          create: { userId, totalXp: qp.quest.xpReward, currentLevel: 1 },
          update: { totalXp: { increment: qp.quest.xpReward } },
        }).catch((err) =>
          console.error("[questProgressService] XP award failed:", err)
        );
      }
    }
  } catch (err) {
    // Fire-and-forget: never block the caller
    console.error("[questProgressService] trackQuestProgress failed:", err);
  }
}

/**
 * Convenience wrapper: track multiple events at once. Each key is processed
 * independently; a failure in one does not stop the others.
 */
export async function trackMultiple(
  userId: string,
  events: Array<{ key: TrackingKey; amount?: number; maxValue?: boolean }>,
): Promise<void> {
  await Promise.allSettled(
    events.map((e) =>
      trackQuestProgress(userId, e.key, e.amount ?? 1, e.maxValue ?? false)
    )
  );
}
