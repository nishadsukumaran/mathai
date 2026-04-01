/**
 * @module api/services/learningBrain/signals
 *
 * Pure functions that extract typed learning signals from raw student data.
 * No DB access — receives pre-fetched data and returns signal objects.
 *
 * These signals feed into the scorer to produce the final recommendation.
 */

import type { MemorySnapshot } from "../../../ai/services/studentMemoryService";

// ─── Signal types ────────────────────────────────────────────────────────────

export interface TopicSignal {
  topicId:              string;
  topicName:            string;
  masteryScore:         number;  // 0–1
  accuracyRate:         number;  // 0–100
  daysSinceLastPractice: number;
  isWeak:               boolean;
  isStrong:             boolean;
  isNewTopic:           boolean;
  activeMisconceptions: string[];
  hintDependency:       number;  // avg hints per question (0 = none)

  // Behavioral signals derived from recent sessions
  recentAccuracy:       number | null;  // accuracy in recent sessions on this topic
  recentErrorCount:     number;         // mistakes in recent sessions
  isImproving:          boolean;        // accuracy trending up
}

export interface StudentSignals {
  confidenceTrend:      "rising" | "stable" | "falling";
  avgConfidence:        number;          // 0–100
  learningPace:         string;
  explanationStyle:     string;
  overallHintDependency: number;         // avg across all topics
  totalTopicsAttempted: number;
  totalLessonsCompleted: number;
  hasSevereMisconception: boolean;       // any misconception with count >= 4
  interests:            string[];

  // Behavioral pattern flags
  fastButInaccurate:    boolean;
  slowButAccurate:      boolean;
}

export interface ExtractedSignals {
  topics:  TopicSignal[];
  student: StudentSignals;
}

// ─── Topic progress row shape (matches Prisma) ──────────────────────────────

export interface TopicProgressRow {
  topicId:         string;
  masteryScore:    number;
  accuracyRate:    number;
  lastPracticedAt: Date | null;
  isUnlocked:      boolean;
  isMastered:      boolean;
  completionPercent: number;
}

// ─── Signal extraction ───────────────────────────────────────────────────────

function daysSince(date: Date | null): number {
  if (!date) return 9999;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

/**
 * Build a TopicSignal for a single topic by combining progress data and memory.
 */
function buildTopicSignal(
  row: TopicProgressRow,
  topicName: string,
  snapshot: MemorySnapshot,
): TopicSignal {
  const weak = snapshot.weakTopics.find((t) => t.topicId === row.topicId);
  const strong = snapshot.strongTopics.find((t) => t.topicId === row.topicId);
  const misconceptions = weak?.activeMisconceptions ?? [];
  const hintDep = snapshot.hintDependencyByTopic[row.topicId] ?? 0;

  // Recent sessions on this topic
  const recentOnTopic = snapshot.recentSessions.filter((s) => s.topicId === row.topicId);
  const recentAccuracy = recentOnTopic.length > 0
    ? recentOnTopic.reduce((sum, s) => sum + s.accuracy, 0) / recentOnTopic.length
    : null;

  // Check if improving: compare last session accuracy to topic's overall accuracy
  const lastSession = recentOnTopic[0];
  const isImproving = lastSession
    ? lastSession.accuracy > row.accuracyRate
    : false;

  const recentErrorCount = snapshot.activeMistakePatterns
    .filter((p) => p.topicId === row.topicId)
    .reduce((sum, p) => sum + p.count, 0);

  return {
    topicId:               row.topicId,
    topicName,
    masteryScore:          row.masteryScore,
    accuracyRate:          row.accuracyRate,
    daysSinceLastPractice: daysSince(row.lastPracticedAt),
    isWeak:                !!weak,
    isStrong:              !!strong,
    isNewTopic:            row.completionPercent === 0 && row.isUnlocked,
    activeMisconceptions:  misconceptions,
    hintDependency:        hintDep,
    recentAccuracy,
    recentErrorCount,
    isImproving,
  };
}

/**
 * Extract all learning signals from student data.
 *
 * @param progressRows - All TopicProgress rows for the student
 * @param topicNames   - Map of topicId → display name
 * @param snapshot     - Current MemorySnapshot
 */
export function extractSignals(
  progressRows: TopicProgressRow[],
  topicNames: Map<string, string>,
  snapshot: MemorySnapshot,
): ExtractedSignals {
  // Build topic signals for all unlocked/attempted topics
  const topics = progressRows
    .filter((r) => r.isUnlocked || r.completionPercent > 0)
    .map((r) => {
      const name = topicNames.get(r.topicId)
        ?? r.topicId.replace(/^g\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return buildTopicSignal(r, name, snapshot);
    });

  // Overall hint dependency
  const hintValues = Object.values(snapshot.hintDependencyByTopic);
  const overallHintDependency = hintValues.length > 0
    ? hintValues.reduce((a, b) => a + b, 0) / hintValues.length
    : 0;

  // Severe misconception: any pattern seen >= 4 times
  const hasSevereMisconception = snapshot.activeMistakePatterns.some((p) => p.count >= 4);

  // Behavioral patterns from recent sessions
  const recent = snapshot.recentSessions;
  let fastButInaccurate = false;
  let slowButAccurate = false;

  if (recent.length >= 2) {
    const avgAccuracy = recent.reduce((s, r) => s + r.accuracy, 0) / recent.length;
    // "Fast but inaccurate" = low accuracy despite completing sessions (implies rushing)
    // We detect this when accuracy < 50% across recent sessions
    fastButInaccurate = avgAccuracy < 50;
    // "Slow but accurate" = high accuracy with the student taking their time
    slowButAccurate = avgAccuracy >= 80;
  }

  const student: StudentSignals = {
    confidenceTrend:       snapshot.confidenceTrend,
    avgConfidence:         snapshot.avgConfidenceScore,
    learningPace:          snapshot.learningPace,
    explanationStyle:      snapshot.preferredExplanationStyle,
    overallHintDependency,
    totalTopicsAttempted:  snapshot.topicsAttempted.length,
    totalLessonsCompleted: snapshot.lessonsCompleted.length,
    hasSevereMisconception,
    interests:             snapshot.interests,
    fastButInaccurate,
    slowButAccurate,
  };

  return { topics, student };
}
