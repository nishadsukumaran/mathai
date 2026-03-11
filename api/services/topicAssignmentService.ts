/**
 * @module api/services/topicAssignmentService
 *
 * AI-driven topic assignment for each student.
 *
 * Generates a personalised, ordered list of topicIds from the curriculum tree
 * for the student's grade band (+ adjacent grades for challenge/review).
 * The list is stored in StudentProfile.aiAssignedTopics and treated as the
 * authoritative topic queue for the Practice hub.
 *
 * Trigger points:
 *   1. Profile setup / grade change  → generateAndStore(userId)
 *   2. Session completion            → appendAfterCompletion(userId, completedTopicId)
 *   3. First GET /practice/menu with empty queue → generateAndStore(userId)
 *
 * AI model: anthropic/claude-haiku-4.5 via Vercel AI Gateway (fast, cheap).
 * Fallback: if AI fails, static curriculum order is used.
 */

import { prisma }           from "../lib/prisma";
import { callAIModelJSON }  from "../../ai/ai_client";
import { getTopicsForGrade } from "@/curriculum/topic_tree";
import type { Grade }       from "@mathai/shared-types";
import type { Grade as LocalGrade } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADE_ORDER: Grade[] = [
  "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10",
] as Grade[];

function prevGrade(g: Grade): Grade | null {
  const i = GRADE_ORDER.indexOf(g);
  return i > 0 ? GRADE_ORDER[i - 1]! : null;
}
function nextGrade(g: Grade): Grade | null {
  const i = GRADE_ORDER.indexOf(g);
  return i >= 0 && i < GRADE_ORDER.length - 1 ? GRADE_ORDER[i + 1]! : null;
}

/** Fetch topics from DB first; fall back to static curriculum tree. */
async function fetchTopicsForGrade(grade: Grade): Promise<{ id: string; name: string }[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topicModel = (prisma as any).topic;
    if (topicModel) {
      const rows = await topicModel.findMany({
        where:  { gradeBand: grade },
        select: { id: true, name: true },
        take:   30,
      }) as { id: string; name: string }[];
      if (rows.length > 0) return rows;
    }
  } catch { /* fall through */ }
  // Static fallback
  return getTopicsForGrade(grade as unknown as LocalGrade)
    .map((t) => ({ id: t.id, name: t.name }));
}

/** Load existing topic progress for context. */
async function loadProgress(userId: string) {
  return prisma.topicProgress.findMany({
    where:  { userId },
    select: { topicId: true, masteryScore: true, accuracyRate: true, lastPracticedAt: true },
  });
}

// ─── AI prompt ────────────────────────────────────────────────────────────────

interface AssignmentContext {
  grade:           Grade;
  learningPace:    string;
  confidenceLevel: number;
  progress:        { topicId: string; masteryScore: number; accuracyRate: number }[];
  gradeTopics:     { id: string; name: string }[];
  prevTopics:      { id: string; name: string }[];
  nextTopics:      { id: string; name: string }[];
}

async function askAIForTopicOrder(ctx: AssignmentContext): Promise<string[]> {
  const gradeNum = ctx.grade.replace("G", "");
  const progressMap = new Map(ctx.progress.map((p) => [p.topicId, p]));

  const fmt = (topics: { id: string; name: string }[], label: string) =>
    topics.length === 0 ? "" :
    `\n${label}:\n${topics.map((t) => {
      const p = progressMap.get(t.id);
      const status = !p
        ? "not started"
        : p.masteryScore >= 0.8
          ? `mastered (${Math.round(p.accuracyRate * 100)}%)`
          : `${Math.round(p.masteryScore * 100)}% mastery, ${Math.round(p.accuracyRate * 100)}% accuracy`;
      return `  - ${t.name} [id: ${t.id}] — ${status}`;
    }).join("\n")}`;

  const prompt = `You are MathAI's curriculum advisor assigning practice topics for a student.

Student profile:
- Grade: ${gradeNum}
- Learning pace: ${ctx.learningPace}
- Confidence: ${ctx.confidenceLevel}/100
${fmt(ctx.gradeTopics, `Grade ${gradeNum} topics (primary)`)}${fmt(ctx.prevTopics, `Grade ${parseInt(gradeNum) - 1} topics (review/boost)`)}${fmt(ctx.nextTopics, `Grade ${parseInt(gradeNum) + 1} topics (challenge)`)}

Rules:
1. Return ALL topic IDs listed above — do not drop any.
2. Order them by what the student should practice FIRST:
   - Unmastered grade-level topics the student has started → highest priority
   - Not-yet-started grade-level topics → next
   - Mastered grade-level topics (for revision) → after
   - Previous-grade topics where mastery is low → interleave for review
   - Next-grade topics → at the end as challenge topics
3. For a low-confidence student (< 40), favour familiar/mastered topics first to rebuild confidence.
4. For a fast-paced student, front-load harder and newer topics.

Return ONLY a valid JSON array of topicId strings in recommended practice order:
["topicId1", "topicId2", ...]`;

  const result = await callAIModelJSON<string[]>(prompt, {
    system:      "You are a helpful math curriculum advisor. Return only valid JSON arrays.",
    maxTokens:   800,
    temperature: 0.3,
    callSite:    "topicAssignment.generate",
  });

  if (!Array.isArray(result) || result.length === 0) return [];

  // Validate: only return IDs that actually exist in our topic lists
  const validIds = new Set([
    ...ctx.gradeTopics.map((t) => t.id),
    ...ctx.prevTopics.map((t) => t.id),
    ...ctx.nextTopics.map((t) => t.id),
  ]);
  return result.filter((id): id is string => typeof id === "string" && validIds.has(id));
}

/** Fallback ordering: struggling first, then unstarted, then mastered */
function staticFallbackOrder(
  topics: { id: string; name: string }[],
  progress: { topicId: string; masteryScore: number }[],
): string[] {
  const pm = new Map(progress.map((p) => [p.topicId, p.masteryScore]));
  return [...topics].sort((a, b) => {
    const sa = pm.get(a.id) ?? -1;  // -1 = not started, sort first-ish
    const sb = pm.get(b.id) ?? -1;
    // not started (null) before low mastery before mastered
    if (sa === -1 && sb !== -1) return -1;
    if (sb === -1 && sa !== -1) return 1;
    return sa - sb;  // lower mastery first
  }).map((t) => t.id);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates and persists an AI-ordered topic list for the student.
 * Called on: first profile setup, grade change, or empty topic queue.
 *
 * Fire-and-forget safe — callers can void this.
 */
export async function generateAndStore(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const grade = (((user as Record<string, unknown>)["gradeLevel"] as Grade) ?? "G4") as Grade;
    const profile = await prisma.studentProfile.upsert({
      where:  { userId },
      create: { userId },
      update: {},
    });

    const prevG = prevGrade(grade);
    const nextG = nextGrade(grade);

    const [gradeTopics, prevTopics, nextTopics, progress] = await Promise.all([
      fetchTopicsForGrade(grade),
      prevG ? fetchTopicsForGrade(prevG) : Promise.resolve([]),
      nextG ? fetchTopicsForGrade(nextG) : Promise.resolve([]),
      loadProgress(userId),
    ]);

    const allTopics = [...gradeTopics, ...prevTopics, ...nextTopics];
    if (allTopics.length === 0) return [];

    // Try AI ordering; fall back to static sort on failure
    let orderedIds: string[];
    try {
      orderedIds = await askAIForTopicOrder({
        grade,
        learningPace:    (profile.learningPace as string) ?? "standard",
        confidenceLevel: profile.confidenceLevel ?? 50,
        progress,
        gradeTopics,
        prevTopics,
        nextTopics,
      });

      // Ensure all topics are covered even if AI returned a partial list
      const returned = new Set(orderedIds);
      const missing  = allTopics.map((t) => t.id).filter((id) => !returned.has(id));
      orderedIds = [...orderedIds, ...missing];

    } catch (aiErr) {
      console.warn("[topicAssignmentService] AI failed, using static order:", (aiErr as Error).message);
      orderedIds = staticFallbackOrder(allTopics, progress);
    }

    // Persist to StudentProfile
    await prisma.studentProfile.update({
      where: { userId },
      data:  {
        aiAssignedTopics:   orderedIds,
        aiAssignedTopicsAt: new Date(),
      } as Record<string, unknown>,
    });

    console.log(`[topicAssignmentService] Assigned ${orderedIds.length} topics for user ${userId} (grade ${grade})`);
    return orderedIds;

  } catch (err) {
    console.error("[topicAssignmentService] generateAndStore failed:", (err as Error).message);
    return [];
  }
}

/**
 * After a session completes, appends AI-selected "what's next" topics to the queue.
 * Topics already in the queue are deduplicated.
 * Marks the completed topic as done by moving it to the end.
 *
 * Fire-and-forget safe — callers can void this.
 */
export async function appendAfterCompletion(
  userId: string,
  completedTopicId: string,
): Promise<void> {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) return;

    const current: string[] = Array.isArray((profile as Record<string, unknown>)["aiAssignedTopics"])
      ? (profile as Record<string, unknown>)["aiAssignedTopics"] as string[]
      : [];

    if (current.length === 0) {
      // Queue was empty — do a full regeneration instead
      void generateAndStore(userId);
      return;
    }

    // Move the completed topic to the end (de-prioritise it)
    const remaining = current.filter((id) => id !== completedTopicId);
    const updated   = [...remaining, completedTopicId];

    await prisma.studentProfile.update({
      where: { userId },
      data:  {
        aiAssignedTopics:   updated,
        aiAssignedTopicsAt: new Date(),
      } as Record<string, unknown>,
    });

    // In the background, check if we should inject new topics from the next grade
    // (e.g. if all grade-level topics are now mastered).
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const grade  = (((user as Record<string, unknown>)["gradeLevel"] as Grade) ?? "G4") as Grade;
    const nextG  = nextGrade(grade);
    if (!nextG) return;

    const progress = await loadProgress(userId);
    const gradeTopics = await fetchTopicsForGrade(grade);
    const allMastered = gradeTopics.every((t) => {
      const p = progress.find((pr) => pr.topicId === t.id);
      return p && p.masteryScore >= 0.8;
    });

    if (allMastered && gradeTopics.length > 0) {
      // Student has mastered all current grade topics — inject next grade topics
      console.log(`[topicAssignmentService] All Grade ${grade} topics mastered — regenerating with Grade ${nextG}`);
      void generateAndStore(userId);
    }

  } catch (err) {
    console.error("[topicAssignmentService] appendAfterCompletion failed:", (err as Error).message);
  }
}
