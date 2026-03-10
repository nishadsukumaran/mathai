/**
 * @module api/services/curriculumService
 *
 * Curriculum tree and topic detail — backed by Prisma.
 * Falls back to the static CURRICULUM_TREE if the DB has no strands yet.
 */

import {
  Topic,
  TopicProgress,
  CurriculumTreeNode,
  AdaptiveRecommendation,
  RecommendationReason,
  Grade,
  Strand,
  MasteryLevel,
} from "@/types";
import { CURRICULUM_TREE, getTopicById } from "../../curriculum/topic_tree";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../middlewares/error.middleware";

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getCurriculumTree(params: {
  userId: string;
  grade?: Grade;
  strand?: Strand;
}): Promise<CurriculumTreeNode[]> {
  const { userId, grade, strand } = params;

  // Student's topic progress (empty array for new users)
  const progressRows = await prisma.topicProgress.findMany({ where: { userId } });
  const progressMap  = buildProgressMap(progressRows);

  // Try DB-backed curriculum first
  const dbStrands = await prisma.curriculumStrand.findMany({
    include: {
      topics: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  if (dbStrands.length > 0) {
    return dbStrands
      .filter((s) => !strand || s.slug === strand.toLowerCase())
      .map((s) => ({
        strand: {
          id:          s.id,
          slug:        s.slug,
          name:        s.name,
          description: s.description,
          sortOrder:   s.sortOrder,
          iconEmoji:   s.iconEmoji ?? undefined,
        },
        topics: s.topics
          .filter((t) => !grade || t.gradeBand === grade)
          .map((t) => ({
            id:               t.id,
            strandId:         t.strandId,
            slug:             t.slug,
            name:             t.name,
            description:      t.description,
            gradeBand:        t.gradeBand as Grade,
            difficulty:       t.difficulty as import("@/types").Difficulty,
            prerequisites:    t.prerequisites,
            masteryThreshold: t.masteryThreshold,
            estimatedMinutes: t.estimatedMinutes,
            iconEmoji:        t.iconEmoji ?? undefined,
            sortOrder:        t.sortOrder,
            createdAt:        t.createdAt,
            updatedAt:        t.updatedAt,
            progress:         progressMap[t.id],
            masteryLevel:     progressMap[t.id]
              ? getMasteryLevel(progressMap[t.id])
              : MasteryLevel.NotStarted,
            lessonCount:      5, // estimated; TODO: join lessons count
            isUnlocked:       isTopicUnlocked(t, progressMap),
          })),
      }));
  }

  // No DB curriculum — fall back to static tree
  const nodes: CurriculumTreeNode[] = [];
  for (const gradeEntry of CURRICULUM_TREE) {
    if (grade && gradeEntry.grade !== grade) continue;
    for (const strandEntry of gradeEntry.strands) {
      if (strand && strandEntry.strand !== strand) continue;
      const topics = strandEntry.topics.map((t) => ({
        ...t,
        progress:     progressMap[t.id],
        masteryLevel: progressMap[t.id] ? getMasteryLevel(progressMap[t.id]) : MasteryLevel.NotStarted,
        lessonCount:  5,
        isUnlocked:   isTopicUnlocked(t, progressMap),
      }));
      nodes.push({
        strand: {
          id:          `strand-${gradeEntry.grade}-${strandEntry.strand}`,
          slug:        strandEntry.strand.toLowerCase(),
          name:        strandEntry.strand,
          description: `${strandEntry.strand} for Grade ${gradeEntry.grade}`,
          sortOrder:   nodes.length,
        },
        topics,
      });
    }
  }
  return nodes;
}

export async function getTopicDetail(
  topicId: string,
  userId?: string
): Promise<Topic & { progress?: TopicProgress; isUnlocked: boolean }> {
  // Try Prisma first
  const dbTopic = await prisma.topic.findUnique({ where: { id: topicId } }).catch(() => null)
    ?? await prisma.topic.findUnique({ where: { slug: topicId } }).catch(() => null);

  const topic = dbTopic ? normalizePrismaTopic(dbTopic) : (getTopicById(topicId) ? normalizeTopic(getTopicById(topicId) as Record<string, unknown>) : null);
  if (!topic) throw new NotFoundError("Topic", topicId);

  if (!userId) return { ...topic, isUnlocked: true };

  const progressRows = await prisma.topicProgress.findMany({ where: { userId } });
  const progressMap  = buildProgressMap(progressRows);

  return {
    ...topic,
    progress:   progressMap[topicId],
    isUnlocked: isTopicUnlocked(topic, progressMap),
  };
}

export async function getWeakAreas(userId: string): Promise<AdaptiveRecommendation[]> {
  const progressRows = await prisma.topicProgress.findMany({ where: { userId } });
  const progressMap  = buildProgressMap(progressRows);
  const recommendations: AdaptiveRecommendation[] = [];

  for (const [topicId, progress] of Object.entries(progressMap)) {
    if (progress.isMastered) continue;

    const dbTopic = await prisma.topic.findUnique({ where: { id: topicId } }).catch(() => null);
    const topicName = dbTopic?.name ?? getTopicById(topicId)?.name ?? topicId;

    if (progress.completionPercent > 0) {
      const daysSince = progress.lastPracticedAt
        ? Math.floor((Date.now() - (progress.lastPracticedAt as Date).getTime()) / 86_400_000)
        : 999;

      recommendations.push({
        topicId,
        topicName,
        reason:   daysSince > 7 ? RecommendationReason.LongTimeNoSee : RecommendationReason.WeakArea,
        priority: Math.round((1 - progress.masteryScore) * 10),
      });
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProgressMap(rows: Array<{
  topicId: string; masteryScore: number; isMastered: boolean;
  completionPercent: number; attemptCount: number; correctCount: number;
  lastPracticedAt: Date | null; updatedAt: Date; id: string; userId: string;
}>): Record<string, TopicProgress> {
  const map: Record<string, TopicProgress> = {};
  for (const tp of rows) {
    map[tp.topicId] = {
      id:                tp.id,
      userId:            tp.userId,
      topicId:           tp.topicId,
      masteryScore:      tp.masteryScore,
      isMastered:        tp.isMastered,
      completionPercent: tp.completionPercent,
      attemptCount:      tp.attemptCount,
      correctCount:      tp.correctCount,
      lastPracticedAt:   tp.lastPracticedAt ?? undefined,
      updatedAt:         tp.updatedAt,
    };
  }
  return map;
}

function getMasteryLevel(tp: TopicProgress): MasteryLevel {
  if (tp.isMastered) return tp.masteryScore >= 0.95 ? MasteryLevel.Extended : MasteryLevel.Mastered;
  if (tp.completionPercent > 0) return tp.masteryScore >= 0.5 ? MasteryLevel.Developing : MasteryLevel.Emerging;
  return MasteryLevel.NotStarted;
}

function isTopicUnlocked(
  topic: { prerequisites: string[] },
  progressMap: Record<string, TopicProgress>
): boolean {
  if (!topic.prerequisites || topic.prerequisites.length === 0) return true;
  return topic.prerequisites.every((prereqId) => progressMap[prereqId]?.isMastered === true);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePrismaTopic(t: any): Topic {
  return {
    id:               t.id,
    strandId:         t.strandId,
    slug:             t.slug,
    name:             t.name,
    description:      t.description,
    gradeBand:        t.gradeBand as Grade,
    difficulty:       t.difficulty as import("@/types").Difficulty,
    prerequisites:    t.prerequisites ?? [],
    masteryThreshold: t.masteryThreshold ?? 0.8,
    estimatedMinutes: t.estimatedMinutes ?? 30,
    iconEmoji:        t.iconEmoji ?? undefined,
    sortOrder:        t.sortOrder ?? 0,
    createdAt:        t.createdAt,
    updatedAt:        t.updatedAt,
  };
}

function normalizeTopic(raw: Record<string, unknown>): Topic {
  return {
    id:               String(raw["id"] ?? ""),
    strandId:         String(raw["strandId"] ?? raw["strand"] ?? ""),
    slug:             String(raw["slug"] ?? ""),
    name:             String(raw["name"] ?? ""),
    description:      String(raw["description"] ?? ""),
    gradeBand:        (raw["gradeBand"] ?? raw["grade"]) as Grade,
    difficulty:       (raw["difficulty"] ?? "beginner") as import("@/types").Difficulty,
    prerequisites:    (raw["prerequisites"] as string[]) ?? [],
    masteryThreshold: Number(raw["masteryThreshold"] ?? 0.8),
    estimatedMinutes: Number(raw["estimatedMinutes"] ?? 30),
    iconEmoji:        raw["iconEmoji"] as string | undefined,
    sortOrder:        Number(raw["sortOrder"] ?? 0),
    createdAt:        (raw["createdAt"] as Date) ?? new Date(),
    updatedAt:        (raw["updatedAt"] as Date) ?? new Date(),
  };
}
