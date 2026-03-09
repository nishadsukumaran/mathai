/**
 * @module api/services/curriculumService
 *
 * Serves curriculum data: topic trees, topic detail, and weak-area analysis.
 * Merges the static curriculum definition (topic_tree) with per-student
 * progress data (mock/Prisma) to produce enriched, student-aware responses.
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
import {
  CURRICULUM_TREE,
  getTopicById,
} from "../../curriculum/topic_tree";
import {
  findTopicProgress,
  MOCK_TOPICS,
  findTopicById as mockFindTopicById,
} from "../mock/data";
import { NotFoundError } from "../middlewares/error.middleware";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the full curriculum tree for a student, enriched with their progress.
 *
 * @param userId     — student ID (for progress lookup)
 * @param grade      — filter by grade band (optional)
 * @param strand     — filter by strand (optional)
 */
export async function getCurriculumTree(params: {
  userId: string;
  grade?: Grade;
  strand?: Strand;
}): Promise<CurriculumTreeNode[]> {
  const { userId, grade, strand } = params;

  // Fetch the student's topic progress once
  const progressList = findTopicProgress(userId);
  const progressMap = buildProgressMap(progressList);

  // Use the static curriculum tree and merge progress
  const nodes: CurriculumTreeNode[] = [];

  for (const gradeEntry of CURRICULUM_TREE) {
    if (grade && gradeEntry.grade !== grade) continue;

    for (const strandEntry of gradeEntry.strands) {
      if (strand && strandEntry.strand !== strand) continue;

      const topics = strandEntry.topics.map((t) => ({
        ...t,
        progress: progressMap[t.id],
        isUnlocked: isTopicUnlocked(t, progressMap),
      }));

      nodes.push({
        strand: {
          id: `strand-${gradeEntry.grade}-${strandEntry.strand}`,
          slug: strandEntry.strand.toLowerCase(),
          name: strandEntry.strand,
          description: `${strandEntry.strand} for Grade ${gradeEntry.grade}`,
          sortOrder: nodes.length,
        },
        topics,
      });
    }
  }

  return nodes;
}

/**
 * Returns a single topic by ID, enriched with the student's progress.
 */
export async function getTopicDetail(topicId: string, userId?: string): Promise<
  Topic & { progress?: TopicProgress; isUnlocked: boolean }
> {
  // Try the live curriculum tree first; fall back to mock DB topics
  const topic = getTopicById(topicId) ?? mockFindTopicById(topicId);
  if (!topic) throw new NotFoundError("Topic", topicId);

  // Normalize the shape — the mock topics have slightly different fields
  const normalized = normalizeTopic(topic);

  if (!userId) {
    return { ...normalized, isUnlocked: true };
  }

  const progressList = findTopicProgress(userId);
  const progressMap = buildProgressMap(progressList);

  return {
    ...normalized,
    progress: progressMap[topicId],
    isUnlocked: isTopicUnlocked(normalized, progressMap),
  };
}

/**
 * Returns the student's weak areas with remediation recommendations.
 *
 * A weak area is any topic that:
 *   - Has been started but not mastered (masteryScore < 0.8)
 *   - OR has not been started but whose prerequisite is mastered (ready gap)
 */
export async function getWeakAreas(userId: string): Promise<AdaptiveRecommendation[]> {
  const progressList = findTopicProgress(userId);
  const progressMap = buildProgressMap(progressList);
  const recommendations: AdaptiveRecommendation[] = [];

  for (const [topicId, progress] of Object.entries(progressMap)) {
    if (progress.isMastered) continue;

    const topic = getTopicById(topicId) ?? mockFindTopicById(topicId);
    if (!topic) continue;

    const topicName = topic.name;

    if (progress.completionPercent > 0 && !progress.isMastered) {
      // Started but not mastered — active weak area
      const daysSince = progress.lastPracticedAt
        ? Math.floor((Date.now() - progress.lastPracticedAt.getTime()) / 86_400_000)
        : 999;

      const reason = daysSince > 7
        ? RecommendationReason.LongTimeNoSee
        : RecommendationReason.WeakArea;

      recommendations.push({
        topicId,
        topicName,
        reason,
        priority: Math.round((1 - progress.masteryScore) * 10),
      });
    } else if (progress.completionPercent === 0) {
      // Not started — check if it's a prerequisite gap
      const isPrereqForOthers = isPrerequisiteForAny(topicId);
      if (isPrereqForOthers) {
        recommendations.push({
          topicId,
          topicName,
          reason: RecommendationReason.PrerequisiteGap,
          priority: 10,
        });
      }
    }
  }

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5); // cap at top 5
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProgressMap(list: TopicProgress[]): Record<string, TopicProgress> {
  return Object.fromEntries(list.map((p) => [p.topicId, p]));
}

function isTopicUnlocked(
  topic: { id: string; prerequisites: string[] },
  progressMap: Record<string, TopicProgress>
): boolean {
  if (topic.prerequisites.length === 0) return true;

  return topic.prerequisites.every((prereqId) => {
    const p = progressMap[prereqId];
    return p?.isMastered === true;
  });
}

function isPrerequisiteForAny(topicId: string): boolean {
  for (const gradeEntry of CURRICULUM_TREE) {
    for (const strandEntry of gradeEntry.strands) {
      for (const topic of strandEntry.topics) {
        if (topic.prerequisites.includes(topicId)) return true;
      }
    }
  }
  return false;
}

/** Normalizes a topic from any source to the canonical Topic shape. */
function normalizeTopic(raw: Record<string, unknown> | Topic): Topic {
  const t = raw as Record<string, unknown>;
  return {
    id:               String(t["id"] ?? ""),
    strandId:         String(t["strandId"] ?? t["strand"] ?? ""),
    slug:             String(t["slug"] ?? ""),
    name:             String(t["name"] ?? ""),
    description:      String(t["description"] ?? ""),
    gradeBand:        (t["gradeBand"] ?? t["grade"]) as Grade,
    difficulty:       (t["difficulty"] ?? "beginner") as import("@/types").Difficulty,
    prerequisites:    (t["prerequisites"] as string[]) ?? [],
    masteryThreshold: Number(t["masteryThreshold"] ?? 0.8),
    estimatedMinutes: Number(t["estimatedMinutes"] ?? 30),
    iconEmoji:        t["iconEmoji"] as string | undefined,
    sortOrder:        Number(t["sortOrder"] ?? 0),
    createdAt:        (t["createdAt"] as Date) ?? new Date(),
    updatedAt:        (t["updatedAt"] as Date) ?? new Date(),
  };
}
