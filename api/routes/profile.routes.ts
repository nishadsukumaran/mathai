/**
 * @module api/routes/profile.routes
 *
 *   GET   /api/profile                  → StudentProfileResponse
 *   PATCH /api/profile                  → UpdateProfileRequest → StudentProfileResponse
 *   POST  /api/profile/regenerate-topics → re-runs AI topic assignment for the user
 *   POST  /api/profile/request-topic    → prepends a requested topic to the user's queue
 *
 * Note: generate-initial-topics (signup) has moved to api/routes/internal.routes.ts
 * and is protected by X-Service-Secret header instead of user JWT.
 */

import { Router, Request, Response, NextFunction } from "express";
import { z }                 from "zod";
import { getProfile, updateProfile } from "../services/profileService";
import { generateAndStore }  from "../services/topicAssignmentService";
import { NotFoundError }     from "../middlewares/error.middleware";
import { prisma }            from "../lib/prisma";
import { getTopicsForGrade } from "@/curriculum/topic_tree";
import type { Grade }        from "@mathai/shared-types";
import type { Grade as LocalGrade } from "@/types";

const router = Router();

// ── GET /api/profile ──────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }
    const profile = await getProfile(userId);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// ── PATCH /api/profile ────────────────────────────────────────────────────────

const GRADE_VALUES = ["G1","G2","G3","G4","G5","G6","G7","G8","G9","G10"] as const;

const UpdateProfileSchema = z.object({
  name:                      z.string().min(1).max(80).optional(),
  preferredTheme:            z.string().max(32).optional(),
  grade:                     z.enum(GRADE_VALUES).optional(),
  learningPace:              z.enum(["slow", "standard", "fast"]).optional(),
  preferredExplanationStyle: z.enum(["visual", "step_by_step", "story", "analogy", "direct"]).optional(),
  confidenceLevel:           z.number().int().min(1).max(5).optional(),
});

router.patch("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const updated = await updateProfile(userId, parsed.data);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── POST /api/profile/regenerate-topics ───────────────────────────────────────
// Re-runs AI topic assignment for the authenticated user.
// Useful when a user wants a fresh, personalised topic list.

router.post("/regenerate-topics", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }
    const topicIds = await generateAndStore(userId);
    res.json({ success: true, data: { topicCount: topicIds.length } });
  } catch (err) { next(err); }
});

// ── POST /api/profile/request-topic ──────────────────────────────────────────
// Lets a user request a specific topic by name.
// Searches curriculum across all grades, finds the best text match,
// and prepends it to aiAssignedTopics so it appears first in /practice.

const SEARCHABLE_GRADES: Grade[] = [
  "G1","G2","G3","G4","G5","G6","G7","G8",
] as Grade[];

async function fetchTopicsForSearch(grade: Grade): Promise<{ id: string; name: string }[]> {
  try {
    const rows = await prisma.topic.findMany({
      where:  { gradeBand: grade as never },
      select: { id: true, name: true },
      take:   50,
    });
    if (rows.length > 0) return rows;
  } catch { /* fall through to static data */ }
  return getTopicsForGrade(grade as unknown as LocalGrade)
    .map((t) => ({ id: t.id, name: t.name }));
}

router.post("/request-topic", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const topicName = ((req.body as { topicName?: string })?.topicName ?? "").trim();
    if (!topicName || topicName.length < 2) {
      res.status(400).json({ success: false, error: "topicName must be at least 2 characters" });
      return;
    }

    // Collect topics across all grades (parallel)
    const topicsByGrade = await Promise.all(
      SEARCHABLE_GRADES.map((grade) => fetchTopicsForSearch(grade))
    );
    const allTopics = topicsByGrade.flat();

    // Find best match (exact first, then contains, then reverse contains)
    const query = topicName.toLowerCase();
    const match =
      allTopics.find((t) => t.name.toLowerCase() === query) ??
      allTopics.find((t) => t.name.toLowerCase().includes(query)) ??
      allTopics.find((t) => query.includes(t.name.toLowerCase()));

    if (!match) {
      res.status(404).json({
        success: false,
        error: "No matching topic found. Try a different name or use Ask AI to explore any math question.",
      });
      return;
    }

    // Prepend to aiAssignedTopics (deduplicated, match always goes first)
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    const current: string[] = Array.isArray(
      (profile as Record<string, unknown> | null)?.["aiAssignedTopics"]
    )
      ? ((profile as Record<string, unknown>)["aiAssignedTopics"] as string[])
      : [];

    const updated = [match.id, ...current.filter((id) => id !== match.id)];

    await prisma.studentProfile.update({
      where: { userId },
      data:  { aiAssignedTopics: updated } as Record<string, unknown>,
    });

    res.json({ success: true, data: { topicId: match.id, topicName: match.name } });
  } catch (err) { next(err); }
});

export default router;
