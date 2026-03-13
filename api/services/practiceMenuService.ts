/**
 * @module api/services/practiceMenuService
 *
 * Generates a grade-aware, personalised practice menu from:
 *   - TopicProgress rows (mastery, accuracy, lastPracticedAt)
 *   - StudentProfile (learningPace, confidenceLevel)
 *   - Curriculum topics available for the student's grade
 *
 * Pure algorithmic — no AI call. Fast enough to be synchronous.
 *
 * Sections produced (in order):
 *   1. best_for_you      — low mastery, non-zero attempt → developing topics
 *   2. revise_this       — not practised in 3+ days
 *   3. grade_level       — all grade topics sorted by mastery asc
 *   4. challenge         — grade+1 topics not yet started
 *   5. confidence_booster — mastered topics in previous grade
 */

import { prisma }             from "../lib/prisma";
import { NotFoundError }      from "../middlewares/error.middleware";
import type {
  PracticeMenu,
  PracticeMenuSection,
  PracticeMenuItem,
  MasteryLevel,
  Grade,
  PracticeMode,
} from "@mathai/shared-types";
import { recommendationService } from "../../ai/services/recommendationService";
import { studentMemoryService }  from "../../ai/services/studentMemoryService";
import { getTopicsForGrade }     from "@/curriculum/topic_tree";
import { generateAndStore }      from "./topicAssignmentService";

// ─── Grade progression map ────────────────────────────────────────────────────

const GRADE_ORDER: Grade[] = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"] as Grade[];

function nextGrade(grade: Grade): Grade | null {
  const idx = GRADE_ORDER.indexOf(grade);
  return idx >= 0 && idx < GRADE_ORDER.length - 1 ? GRADE_ORDER[idx + 1]! : null;
}

function prevGrade(grade: Grade): Grade | null {
  const idx = GRADE_ORDER.indexOf(grade);
  return idx > 0 ? GRADE_ORDER[idx - 1]! : null;
}

// ─── Mastery helpers ──────────────────────────────────────────────────────────

function masteryFromScore(score: number): MasteryLevel {
  if (score === 0)  return "not_started";
  if (score < 40)   return "emerging";
  if (score < 70)   return "developing";
  if (score < 90)   return "mastered";
  return "extended";
}

function daysSince(date: Date | null): number {
  if (!date) return 9999;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

// ─── Build PracticeMenuItem from a DB row ─────────────────────────────────────

function toMenuItem(
  row: {
    topicId:          string;
    masteryScore:     number;
    accuracyRate:     number;
    lastPracticedAt:  Date | null;
  },
  topicName: string,
  iconSlug:  string,
  reason:    string,
  mode:      PracticeMode,
  isNew?:    boolean,
): PracticeMenuItem {
  return {
    topicId:       row.topicId,
    topicName,
    iconSlug,
    masteryLevel:  masteryFromScore(row.masteryScore),
    accuracyPct:   Math.round(row.accuracyRate),
    suggestedMode: mode,
    reason,
    isNew:         isNew ?? false,
  };
}

// ─── Topic metadata lookup (fallback to topicId if no curriculum row) ─────────

async function getTopicMeta(topicId: string): Promise<{ name: string; iconSlug: string }> {
  try {
    const row = await prisma.topic.findUnique({
      where:  { id: topicId },
      select: { name: true },
    });
    if (row) return { name: row.name, iconSlug: (row as Record<string, unknown>)["iconSlug"] as string ?? "📚" };
  } catch { /* topic table may not exist in all envs */ }
  // Fallback: humanise topicId
  const name = topicId.replace(/^g\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { name, iconSlug: "📚" };
}

// ─── Main service function ────────────────────────────────────────────────────

export async function getPracticeMenu(userId: string): Promise<PracticeMenu> {
  // 1. Fetch user + profile
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User", userId);

  const profile = await prisma.studentProfile.upsert({
    where:  { userId },
    create: { userId },
    update: {},
  });

  const grade = ((user as Record<string, unknown>)["gradeLevel"] as Grade) ?? ("G4" as Grade);
  const prevG = prevGrade(grade);
  const nextG = nextGrade(grade);

  // 2. Fetch all progress rows for this user
  const allProgress = await prisma.topicProgress.findMany({ where: { userId } });

  // Map topicId → progress row for fast lookup
  const progressMap = new Map(allProgress.map((p) => [p.topicId, p]));

  // Helper to get progress for a topic
  const getProgress = (topicId: string) => progressMap.get(topicId) ?? null;

  // 3. Resolve curriculum topics — priority order:
  //    a) AI-assigned topic queue stored in StudentProfile (personalised, AI-ordered)
  //    b) DB Topic table filtered by gradeBand (if seeded)
  //    c) Static curriculum tree (always available fallback)

  let gradeTopics:    Array<{ id: string; name: string }> = [];
  let prevGradeTopics: Array<{ id: string; name: string }> = [];
  let nextGradeTopics: Array<{ id: string; name: string }> = [];

  // ── 3a. AI-assigned queue ─────────────────────────────────────────────────
  const storedAssigned = Array.isArray((profile as Record<string, unknown>)["aiAssignedTopics"])
    ? (profile as Record<string, unknown>)["aiAssignedTopics"] as string[]
    : [];

  if (storedAssigned.length > 0) {
    // The stored list is already AI-ordered across all three grade bands.
    // We need topic names to display — build a name lookup from DB + static tree.
    const allCurrTopics: Array<{ id: string; name: string }> = [];
    try {
      const dbTopics = await prisma.topic.findMany({
        where:  { id: { in: storedAssigned } },
        select: { id: true, name: true },
      });
      allCurrTopics.push(...dbTopics);
    } catch { /* DB not seeded */ }

    // Fill gaps from static curriculum tree for any IDs not found in DB
    const foundIds = new Set(allCurrTopics.map((t) => t.id));
    if (foundIds.size < storedAssigned.length) {
      const staticAll = [
        ...getTopicsForGrade(grade as unknown as import("@/types").Grade),
        ...(prevG ? getTopicsForGrade(prevG as unknown as import("@/types").Grade) : []),
        ...(nextG ? getTopicsForGrade(nextG as unknown as import("@/types").Grade) : []),
      ];
      for (const t of staticAll) {
        if (storedAssigned.includes(t.id) && !foundIds.has(t.id)) {
          allCurrTopics.push({ id: t.id, name: t.name });
          foundIds.add(t.id);
        }
      }
    }

    // Build name map and split by grade band for section builders below
    const nameMap = new Map(allCurrTopics.map((t) => [t.id, t.name]));
    const gradePrefix = grade.toLowerCase();        // e.g. "g5"
    const prevPrefix  = prevG ? prevG.toLowerCase() : "";
    const nextPrefix  = nextG ? nextG.toLowerCase() : "";

    // Preserve AI-assigned order within each section
    for (const id of storedAssigned) {
      const name = nameMap.get(id) ??
        id.replace(/^g\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (id.startsWith(gradePrefix + "-")) {
        gradeTopics.push({ id, name });
      } else if (prevPrefix && id.startsWith(prevPrefix + "-")) {
        prevGradeTopics.push({ id, name });
      } else if (nextPrefix && id.startsWith(nextPrefix + "-")) {
        nextGradeTopics.push({ id, name });
      } else {
        // Unknown grade prefix — add to grade topics as catch-all
        gradeTopics.push({ id, name });
      }
    }
  }

  // ── 3b/c. Fallback: DB or static tree (runs if AI queue is empty) ─────────
  if (gradeTopics.length === 0) {
    // No AI assignment yet — generate synchronously so this request returns
    // real topics rather than an empty state. Subsequent requests will hit
    // the cached aiAssignedTopics in StudentProfile.
    try { await generateAndStore(userId); } catch { /* will use static fallback below */ }
    // Re-read profile to pick up the freshly generated topics
    const refreshed = await prisma.studentProfile.findUnique({ where: { userId } });
    const refreshedTopics = Array.isArray((refreshed as Record<string, unknown> | null)?.["aiAssignedTopics"])
      ? (refreshed as Record<string, unknown>)["aiAssignedTopics"] as string[]
      : [];
    if (refreshedTopics.length > 0) {
      const gradePrefix = grade.toLowerCase();
      const prevPrefix  = prevG ? prevG.toLowerCase() : "";
      const nextPrefix  = nextG ? nextG.toLowerCase() : "";
      for (const id of refreshedTopics) {
        const name = id.replace(/^g\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        if (prevPrefix && id.startsWith(prevPrefix + "-")) {
          prevGradeTopics.push({ id, name });
        } else if (nextPrefix && id.startsWith(nextPrefix + "-")) {
          nextGradeTopics.push({ id, name });
        } else if (id.startsWith(gradePrefix + "-") || !prevPrefix) {
          gradeTopics.push({ id, name });
        } else {
          gradeTopics.push({ id, name });
        }
      }
    }

    // DB + static fallbacks only needed if AI generation above didn't produce topics
    if (gradeTopics.length === 0) {
      try {
        gradeTopics     = await prisma.topic.findMany({ where: { gradeBand: grade as never },     select: { id: true, name: true }, take: 20 });
        if (prevG) prevGradeTopics = await prisma.topic.findMany({ where: { gradeBand: prevG as never }, select: { id: true, name: true }, take: 10 });
        if (nextG) nextGradeTopics = await prisma.topic.findMany({ where: { gradeBand: nextG as never }, select: { id: true, name: true }, take: 10 });
      } catch { /* curriculum not seeded */ }
    }

    // Static curriculum tree as final fallback
    if (gradeTopics.length === 0) {
      gradeTopics = getTopicsForGrade(grade as unknown as import("@/types").Grade)
        .map((t) => ({ id: t.id, name: t.name }))
        .slice(0, 20);
    }
    if (prevG && prevGradeTopics.length === 0) {
      prevGradeTopics = getTopicsForGrade(prevG as unknown as import("@/types").Grade)
        .map((t) => ({ id: t.id, name: t.name }))
        .slice(0, 10);
    }
    if (nextG && nextGradeTopics.length === 0) {
      nextGradeTopics = getTopicsForGrade(nextG as unknown as import("@/types").Grade)
        .map((t) => ({ id: t.id, name: t.name }))
        .slice(0, 10);
    }
  }

  // ── Section builders ──────────────────────────────────────────────────────

  const sections: PracticeMenuSection[] = [];

  // ── 1. Best for You ───────────────────────────────────────────────────────
  const bestItems: PracticeMenuItem[] = allProgress
    .filter((p) => p.masteryScore > 0 && p.masteryScore < 70)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map((p) => ({
      topicId:       p.topicId,
      topicName:     p.topicId.replace(/^g\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      iconSlug:      "🎯",
      masteryLevel:  masteryFromScore(p.masteryScore),
      accuracyPct:   Math.round(p.accuracyRate),
      suggestedMode: "guided" as PracticeMode,
      reason:        p.masteryScore < 40 ? "Needs attention" : "Keep building!",
      isNew:         false,
    }));

  if (bestItems.length > 0) {
    sections.push({
      type:     "best_for_you",
      title:    "Best for You",
      subtitle: "Personalised picks based on your progress",
      items:    bestItems,
    });
  }

  // ── 2. Revise This ────────────────────────────────────────────────────────
  const reviseItems: PracticeMenuItem[] = allProgress
    .filter((p) => p.masteryScore > 0 && daysSince(p.lastPracticedAt) >= 3)
    .sort((a, b) => daysSince(b.lastPracticedAt) - daysSince(a.lastPracticedAt))
    .slice(0, 5)
    .map((p) => ({
      topicId:       p.topicId,
      topicName:     p.topicId.replace(/^g\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      iconSlug:      "🔁",
      masteryLevel:  masteryFromScore(p.masteryScore),
      accuracyPct:   Math.round(p.accuracyRate),
      suggestedMode: "topic_practice" as PracticeMode,
      reason:        `${daysSince(p.lastPracticedAt)} days since last practice`,
      isNew:         false,
    }));

  if (reviseItems.length > 0) {
    sections.push({
      type:     "revise_this",
      title:    "Revise This",
      subtitle: "Topics you haven't practised recently",
      items:    reviseItems,
    });
  }

  // ── 3. Grade Level ────────────────────────────────────────────────────────
  if (gradeTopics.length > 0) {
    const gradeItems: PracticeMenuItem[] = gradeTopics.slice(0, 8).map((t) => {
      const p = getProgress(t.id);
      return {
        topicId:       t.id,
        topicName:     t.name,
        iconSlug:      "📚",
        masteryLevel:  masteryFromScore(p?.masteryScore ?? 0),
        accuracyPct:   Math.round(p?.accuracyRate ?? 0),
        suggestedMode: (p?.masteryScore ?? 0) > 70 ? "topic_practice" as PracticeMode : "guided" as PracticeMode,
        reason:        !p || p.masteryScore === 0 ? "Brand new!" : "",
        isNew:         !p || p.masteryScore === 0,
      };
    });
    sections.push({
      type:     "grade_level",
      title:    `Grade ${grade.replace("G", "")} Topics`,
      subtitle: "All topics at your grade level",
      items:    gradeItems,
    });
  }

  // ── 4. Challenge ──────────────────────────────────────────────────────────
  if (nextGradeTopics.length > 0) {
    const challengeItems: PracticeMenuItem[] = nextGradeTopics
      .filter((t) => !getProgress(t.id) || (getProgress(t.id)?.masteryScore ?? 0) < 30)
      .slice(0, 4)
      .map((t) => ({
        topicId:       t.id,
        topicName:     t.name,
        iconSlug:      "🔥",
        masteryLevel:  "not_started" as MasteryLevel,
        accuracyPct:   0,
        suggestedMode: "daily_challenge" as PracticeMode,
        reason:        `Grade ${nextG?.replace("G", "")} challenge`,
        isNew:         true,
      }));

    if (challengeItems.length > 0) {
      sections.push({
        type:     "challenge",
        title:    "Challenge Zone 🔥",
        subtitle: "Ready for something tougher?",
        items:    challengeItems,
      });
    }
  }

  // ── 5. Confidence Booster ─────────────────────────────────────────────────
  if (prevGradeTopics.length > 0) {
    const boosterItems: PracticeMenuItem[] = prevGradeTopics
      .filter((t) => (getProgress(t.id)?.masteryScore ?? 0) >= 70)
      .slice(0, 4)
      .map((t) => {
        const p = getProgress(t.id)!;
        return {
          topicId:       t.id,
          topicName:     t.name,
          iconSlug:      "💪",
          masteryLevel:  masteryFromScore(p.masteryScore),
          accuracyPct:   Math.round(p.accuracyRate),
          suggestedMode: "topic_practice" as PracticeMode,
          reason:        "You've mastered this!",
          isNew:         false,
        };
      });

    if (boosterItems.length > 0) {
      sections.push({
        type:     "confidence_booster",
        title:    "Confidence Boost 💪",
        subtitle: "Topics you're great at — stay sharp",
        items:    boosterItems,
      });
    }
  }

  // ── Load student memory snapshot (non-blocking) ───────────────────────────
  const memorySnapshot = await studentMemoryService.getSnapshot(userId).catch(() => undefined);

  // ── AI enrichment: personalise reasons via Vercel AI Gateway ─────────────────
  // Build candidates from the top items across sections for AI to rank
  const candidates = sections
    .flatMap((s) => s.items.slice(0, 4))
    .slice(0, 8)
    .map((item) => {
      const p = progressMap.get(item.topicId);
      return {
        topicId:               item.topicId,
        topicName:             item.topicName,
        masteryLevel:          item.masteryLevel,
        accuracyPct:           item.accuracyPct,
        daysSinceLastPractice: p ? daysSince(p.lastPracticedAt) : 9999,
        sectionHint:           sections.find((s) => s.items.some((i) => i.topicId === item.topicId))?.type ?? "grade_level",
      };
    });

  let aiEnriched = false;
  if (candidates.length > 0) {
    try {
      const aiRecos = await recommendationService.enrich(candidates, {
        grade,
        learningPace:              profile.learningPace ?? "standard",
        confidenceLevel:           profile.confidenceLevel ?? 50,
        preferredExplanationStyle: (profile as Record<string, unknown>)["preferredExplanationStyle"] as string ?? "step_by_step",
        recentStreak:              0,
        totalXP:                   profile.totalXp ?? 0,
      }, memorySnapshot);

      // Merge AI reasons back into sections
      const aiRecoMap = new Map(aiRecos.map((r) => [r.topicId, r]));
      for (const section of sections) {
        for (const item of section.items) {
          const reco = aiRecoMap.get(item.topicId);
          if (reco) {
            item.reason        = reco.reason;
            item.encouragement = reco.encouragement;
            item.suggestedMode = reco.suggestedMode;
          }
        }
      }
      aiEnriched = true;
    } catch {
      // AI enrichment failed — returning algorithmic menu
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    aiEnriched,
    sections,
  };
}

