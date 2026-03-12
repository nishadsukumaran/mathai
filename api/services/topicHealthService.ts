/**
 * @module api/services/topicHealthService
 *
 * Background job that runs every INTERVAL_MS and finds StudentProfiles whose
 * aiAssignedTopics array is still empty (i.e. topic generation failed or was
 * skipped, e.g. due to a Render cold-start timeout at signup time).
 *
 * For each affected student it calls generateAndStore(), which will:
 *  1. Try an AI-ordered assignment for their grade.
 *  2. Fall back to the static curriculum order if the AI call fails.
 *  3. Persist the result to StudentProfile.aiAssignedTopics.
 *
 * This means any student stuck on the "topics being prepared…" screen will
 * have their topics auto-populated within one polling cycle (~5 minutes) even
 * if the original signup-time generation silently failed.
 *
 * Usage — start once on server boot (see api/server.ts):
 *   import { startTopicHealthJob } from "./services/topicHealthService";
 *   startTopicHealthJob();
 */

import { prisma }            from "../lib/prisma";
import { generateAndStore }  from "./topicAssignmentService";

const INTERVAL_MS   = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE    = 20;             // process at most N students per tick to avoid thundering herd
const LOG_PREFIX    = "[topicHealth]";

let   _running      = false;

/**
 * Single tick: find students with empty topics and kick off generation for each.
 * Errors on individual students are caught and logged — one failure won't abort the batch.
 */
async function tick(): Promise<void> {
  let profiles: { userId: string }[] = [];

  try {
    // Find profiles where aiAssignedTopics is the default empty JSON array.
    // We cast to `any` because Prisma's generated types don't expose JSON filter helpers
    // for our version — the runtime query still works correctly.
    profiles = await (prisma as any).studentProfile.findMany({
      where: {
        aiAssignedTopics: { equals: [] },
      },
      select: { userId: true },
      take: BATCH_SIZE,
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} DB query failed:`, err);
    return;
  }

  if (profiles.length === 0) return;

  console.log(`${LOG_PREFIX} Found ${profiles.length} student(s) with empty topic lists — generating…`);

  // Process sequentially within the batch to be gentle on the AI rate-limit.
  for (const { userId } of profiles) {
    try {
      const topics = await generateAndStore(userId);
      if (topics.length > 0) {
        console.log(`${LOG_PREFIX} ✓ userId=${userId} — ${topics.length} topics assigned`);
      } else {
        // generateAndStore returned [] — AI + static fallback both failed for this user.
        // Will retry on the next tick.
        console.warn(`${LOG_PREFIX} ✗ userId=${userId} — generateAndStore returned empty, will retry`);
      }
    } catch (err) {
      // Should not happen (generateAndStore has its own outer try/catch) but guard anyway.
      console.error(`${LOG_PREFIX} Unexpected error for userId=${userId}:`, err);
    }
  }
}

/**
 * Start the recurring background job.
 * Safe to call multiple times — only one interval is ever active.
 */
export function startTopicHealthJob(): void {
  if (_running) {
    console.warn(`${LOG_PREFIX} Already running — ignoring duplicate startTopicHealthJob() call`);
    return;
  }

  _running = true;
  console.log(`${LOG_PREFIX} Started — polling every ${INTERVAL_MS / 1000}s for students with empty topic lists`);

  // Run once immediately on startup, then on the regular interval.
  void tick();
  setInterval(() => void tick(), INTERVAL_MS);
}
