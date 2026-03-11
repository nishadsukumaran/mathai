/**
 * @module ai/services/studentMemoryService
 *
 * Central student learning memory service — the "teacher's notebook" for MathAI.
 *
 * Every AI call in MathAI that touches a student should first call
 * studentMemoryService.getSnapshot(userId) to get full context about the student's
 * learning history, misconceptions, strengths, and preferences.
 *
 * ─── WHAT IS THE MEMORY SNAPSHOT? ───────────────────────────────────────────
 *
 * A MemorySnapshot is a pre-built JSON blob that contains:
 *   - Lessons covered (which lessons the student has started / completed)
 *   - Topics attempted (sorted by recency)
 *   - Strong topics (mastery ≥ 0.75) and weak topics (mastery < 0.45, attempted)
 *   - Active misconception patterns (tagged mistake types with frequency)
 *   - Hint dependency per topic (avg hints / question)
 *   - Confidence trend (rising / stable / falling)
 *   - Preferred explanation style and learning pace
 *   - Student interests (for question personalisation)
 *   - Recent sessions (last 5)
 *   - Derived suggested focus topics (top 3, used by the practice menu)
 *
 * ─── STALENESS & REFRESH ─────────────────────────────────────────────────────
 *
 * The snapshot is cached in the student_memory_snapshots table.
 * It is considered fresh for 2 hours. On each session complete, it is
 * refreshed immediately (backgrounded — doesn't block the response).
 * On reads, if stale, it is rebuilt synchronously and re-cached.
 *
 * ─── HOW MISTAKE PATTERNS WORK ───────────────────────────────────────────────
 *
 * After every incorrect answer, practiceService calls:
 *   studentMemoryService.recordMistake(userId, topicId, tag)
 *
 * After 3 consecutive correct answers on a topic, patterns can be resolved:
 *   studentMemoryService.checkAndResolvePatterns(userId, topicId)
 *
 * ─── HOW LESSON PROGRESS WORKS ───────────────────────────────────────────────
 *
 * When a practice session starts for a lesson:
 *   studentMemoryService.markLessonStarted(userId, lessonId, topicId)
 *
 * When a session completes:
 *   studentMemoryService.markLessonProgress(userId, lessonId, topicId, score)
 */

import { prisma } from "../../api/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeakTopic {
  topicId:     string;
  topicName:   string;
  masteryScore: number;
  accuracyRate: number;
  lastAttempt: string | null;
  activeMisconceptions: string[];
}

export interface StrongTopic {
  topicId:     string;
  topicName:   string;
  masteryScore: number;
}

export interface MistakePattern {
  topicId:    string;
  topicName:  string;
  tag:        string;
  count:      number;
  lastSeenAt: string;
}

export interface RecentSession {
  topicId:   string;
  topicName: string;
  date:      string;
  accuracy:  number;
  mode:      string;
}

/**
 * The full student learning memory snapshot.
 * This is what gets injected into every AI prompt.
 */
export interface MemorySnapshot {
  version: 1;

  // Coverage
  lessonsStarted:   string[];   // lesson IDs
  lessonsCompleted: string[];   // lesson IDs
  topicsAttempted:  string[];   // topic IDs, most recent first

  // Mastery bands
  strongTopics: StrongTopic[];
  weakTopics:   WeakTopic[];

  // Mistake memory
  activeMistakePatterns: MistakePattern[];

  // Behavioral signals
  hintDependencyByTopic: Record<string, number>; // topicId → avg hints per question
  confidenceTrend: "rising" | "stable" | "falling";
  avgConfidenceScore: number;

  // Preferences
  preferredExplanationStyle: string;
  learningPace: string;
  interests: string[];

  // Recent activity
  recentSessions: RecentSession[];

  // Derived — AI can use these without additional reasoning
  suggestedFocusTopics: string[];  // top 3 topic IDs to focus on next

  lastRefreshedAt: string;
}

// ─── Raw row types (used with $queryRaw since Prisma client can't be regenerated) ──

interface RawLessonProgressRow {
  lessonId:    string;
  topicId:     string;
  isCompleted: boolean;
  isStarted:   boolean;
  lastScore:   number;
}

interface RawMistakePatternRow {
  topicId:    string;
  tag:        string;
  count:      number;
  lastSeenAt: Date;
}

interface RawTopicProgressRow {
  topicId:          string;
  masteryScore:     number;
  accuracyRate:     number;
  isUnlocked:       boolean;
  isMastered:       boolean;
  lastPracticedAt:  Date | null;
}

interface RawSessionRow {
  practiceSetId:  string;
  completedAt:    Date | null;
  accuracyPercent: number;
  mode:           string;
}

interface RawAttemptAggRow {
  topicId:      string;
  hintsUsed:    number;
  attemptCount: number;
}

interface RawConfidenceRow {
  avgBefore: number | null;
  avgAfter:  number | null;
  period:    string;
}

// ─── SNAPSHOT_TTL ─────────────────────────────────────────────────────────────

const SNAPSHOT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ─── Service ──────────────────────────────────────────────────────────────────

class StudentMemoryService {

  // ─── Public read API ──────────────────────────────────────────────────────

  /**
   * Get the student's memory snapshot. Rebuilds from DB if stale or missing.
   * Call this at the start of any AI interaction.
   */
  async getSnapshot(userId: string): Promise<MemorySnapshot> {
    // Try cache first
    const cached = await prisma.$queryRaw<{ snapshot: unknown; refreshedAt: Date }[]>`
      SELECT snapshot, "refreshedAt"
      FROM student_memory_snapshots
      WHERE "userId" = ${userId}
      LIMIT 1
    `.catch(() => []);

    if (cached.length > 0) {
      const row = cached[0]!;
      const ageMs = Date.now() - new Date(row.refreshedAt as unknown as string).getTime();
      if (ageMs < SNAPSHOT_TTL_MS) {
        return row.snapshot as MemorySnapshot;
      }
    }

    // Build fresh
    return this.rebuildSnapshot(userId);
  }

  /**
   * Force a full snapshot rebuild and persist it. Call at session end.
   * Non-blocking — caller does not await.
   */
  async refreshSnapshot(userId: string): Promise<MemorySnapshot> {
    const snapshot = await this.rebuildSnapshot(userId);
    await this.persistSnapshot(userId, snapshot);
    return snapshot;
  }

  // ─── Lesson tracking ─────────────────────────────────────────────────────

  async markLessonStarted(userId: string, lessonId: string, topicId: string): Promise<void> {
    const id = createId();
    await prisma.$executeRaw`
      INSERT INTO lesson_progress (id, "userId", "lessonId", "topicId", "isStarted", "isCompleted", "lastScore", "attemptsCount", "createdAt", "updatedAt")
      VALUES (${id}, ${userId}, ${lessonId}, ${topicId}, TRUE, FALSE, 0, 1, NOW(), NOW())
      ON CONFLICT ("userId", "lessonId")
      DO UPDATE SET
        "isStarted"     = TRUE,
        "attemptsCount" = lesson_progress."attemptsCount" + 1,
        "updatedAt"     = NOW()
    `;
  }

  async markLessonProgress(
    userId: string, lessonId: string, topicId: string, score: number
  ): Promise<void> {
    const completed = score >= 0.7;
    const id = createId();
    await prisma.$executeRaw`
      INSERT INTO lesson_progress (id, "userId", "lessonId", "topicId", "isStarted", "isCompleted", "completedAt", "lastScore", "attemptsCount", "createdAt", "updatedAt")
      VALUES (${id}, ${userId}, ${lessonId}, ${topicId}, TRUE, ${completed}, ${completed ? new Date() : null}, ${score}, 1, NOW(), NOW())
      ON CONFLICT ("userId", "lessonId")
      DO UPDATE SET
        "isCompleted"   = CASE WHEN ${completed} THEN TRUE ELSE lesson_progress."isCompleted" END,
        "completedAt"   = CASE WHEN ${completed} AND lesson_progress."isCompleted" = FALSE THEN NOW() ELSE lesson_progress."completedAt" END,
        "lastScore"     = ${score},
        "attemptsCount" = lesson_progress."attemptsCount" + 1,
        "updatedAt"     = NOW()
    `;
  }

  // ─── Mistake pattern tracking ─────────────────────────────────────────────

  /**
   * Record a detected misconception. Increments count or inserts a new pattern.
   * Call after every incorrect answer where misconceptionTag != "none".
   */
  async recordMistake(userId: string, topicId: string, tag: string): Promise<void> {
    if (!tag || tag === "none" || tag === "None") return;
    const id = createId();
    await prisma.$executeRaw`
      INSERT INTO topic_mistake_patterns (id, "userId", "topicId", tag, count, "isResolved", "lastSeenAt", "createdAt", "updatedAt")
      VALUES (${id}, ${userId}, ${topicId}, ${tag}, 1, FALSE, NOW(), NOW(), NOW())
      ON CONFLICT ("userId", "topicId", tag)
      DO UPDATE SET
        count        = topic_mistake_patterns.count + 1,
        "isResolved" = FALSE,
        "resolvedAt" = NULL,
        "lastSeenAt" = NOW(),
        "updatedAt"  = NOW()
    `;
  }

  /**
   * Check if a student has sufficiently improved on a topic to resolve its patterns.
   * A pattern is resolved when the student's recent accuracy on that topic >= 80%
   * across at least 3 attempts (since the pattern was last seen).
   */
  async checkAndResolvePatterns(userId: string, topicId: string): Promise<void> {
    // Get recent attempts for this topic
    const recentAttempts = await prisma.questionAttempt.findMany({
      where:   { userId, topicId },
      orderBy: { createdAt: "desc" },
      take:    5,
      select:  { isCorrect: true },
    });

    if (recentAttempts.length < 3) return;

    const recentAccuracy = recentAttempts.filter((a) => a.isCorrect).length / recentAttempts.length;
    if (recentAccuracy >= 0.8) {
      await prisma.$executeRaw`
        UPDATE topic_mistake_patterns
        SET "isResolved" = TRUE, "resolvedAt" = NOW(), "updatedAt" = NOW()
        WHERE "userId" = ${userId} AND "topicId" = ${topicId} AND "isResolved" = FALSE
      `;
    }
  }

  /**
   * Update profile-level counters after a session.
   */
  async updateProfileCounters(
    userId: string,
    opts: { questionsAttempted: number; hintsUsed: number; avgConfidenceAfter?: number }
  ): Promise<void> {
    if (opts.avgConfidenceAfter !== undefined) {
      // EWMA with α=0.3 — new value weighted 30%, history weighted 70%
      await prisma.$executeRaw`
        UPDATE student_profiles SET
          "totalQuestionsAttempted" = "totalQuestionsAttempted" + ${opts.questionsAttempted},
          "totalHintsUsed"          = "totalHintsUsed"          + ${opts.hintsUsed},
          "avgConfidenceScore"      = "avgConfidenceScore" * 0.7 + ${opts.avgConfidenceAfter} * 0.3,
          "updatedAt"               = NOW()
        WHERE "userId" = ${userId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE student_profiles SET
          "totalQuestionsAttempted" = "totalQuestionsAttempted" + ${opts.questionsAttempted},
          "totalHintsUsed"          = "totalHintsUsed"          + ${opts.hintsUsed},
          "updatedAt"               = NOW()
        WHERE "userId" = ${userId}
      `;
    }
  }

  // ─── AI prompt helper ─────────────────────────────────────────────────────

  /**
   * Render the memory snapshot as a concise text block for AI prompts.
   * Designed to be injected into the system prompt without blowing the context window.
   */
  formatForPrompt(snapshot: MemorySnapshot): string {
    const lines: string[] = [];

    if (snapshot.weakTopics.length > 0) {
      const weakList = snapshot.weakTopics
        .slice(0, 4)
        .map((t) => {
          const misconceptions = t.activeMisconceptions.length > 0
            ? ` [struggles with: ${t.activeMisconceptions.slice(0, 2).join(", ")}]`
            : "";
          return `  • ${t.topicName} (mastery ${Math.round(t.masteryScore * 100)}%)${misconceptions}`;
        })
        .join("\n");
      lines.push(`WEAK AREAS:\n${weakList}`);
    }

    if (snapshot.activeMistakePatterns.length > 0) {
      const patternList = snapshot.activeMistakePatterns
        .slice(0, 3)
        .map((p) => `  • ${p.topicName}: ${p.tag} (seen ${p.count}x)`)
        .join("\n");
      lines.push(`KNOWN MISCONCEPTIONS:\n${patternList}`);
    }

    if (snapshot.strongTopics.length > 0) {
      lines.push(
        `STRONG AREAS: ${snapshot.strongTopics.slice(0, 3).map((t) => t.topicName).join(", ")}`
      );
    }

    if (snapshot.lessonsCompleted.length > 0) {
      lines.push(`LESSONS COMPLETED: ${snapshot.lessonsCompleted.length} lessons`);
    }

    if (snapshot.recentSessions.length > 0) {
      const last = snapshot.recentSessions[0]!;
      lines.push(
        `MOST RECENT SESSION: ${last.topicName} — ${Math.round(last.accuracy)}% accuracy (${last.mode} mode)`
      );
    }

    lines.push(`CONFIDENCE TREND: ${snapshot.confidenceTrend} (avg ${Math.round(snapshot.avgConfidenceScore)}/100)`);
    lines.push(`EXPLANATION STYLE: ${snapshot.preferredExplanationStyle}`);
    lines.push(`LEARNING PACE: ${snapshot.learningPace}`);

    if (snapshot.interests.length > 0) {
      lines.push(`INTERESTS: ${snapshot.interests.join(", ")}`);
    }

    return lines.join("\n");
  }

  // ─── Private: Snapshot builder ────────────────────────────────────────────

  private async rebuildSnapshot(userId: string): Promise<MemorySnapshot> {
    // Run all DB queries in parallel
    const [
      profile,
      topicProgressRows,
      mistakeRows,
      lessonRows,
      recentSessionRows,
      hintAggRows,
      confidenceRows,
    ] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId } }),

      prisma.topicProgress.findMany({
        where:   { userId },
        include: { topic: { select: { name: true } } },
        orderBy: { lastPracticedAt: "desc" },
      }),

      prisma.$queryRaw<(RawMistakePatternRow & { topicName: string })[]>`
        SELECT p."topicId", t.name AS "topicName", p.tag, p.count, p."lastSeenAt"
        FROM topic_mistake_patterns p
        JOIN topics t ON t.id = p."topicId"
        WHERE p."userId" = ${userId} AND p."isResolved" = FALSE
        ORDER BY p.count DESC, p."lastSeenAt" DESC
        LIMIT 10
      `.catch(() => [] as (RawMistakePatternRow & { topicName: string })[]),

      prisma.$queryRaw<RawLessonProgressRow[]>`
        SELECT "lessonId", "topicId", "isCompleted", "isStarted", "lastScore"
        FROM lesson_progress
        WHERE "userId" = ${userId}
      `.catch(() => [] as RawLessonProgressRow[]),

      // Last 5 completed sessions with topic name via practiceSet join
      prisma.$queryRaw<(RawSessionRow & { topicSlug: string; topicName: string })[]>`
        SELECT ps.mode, ps."completedAt", ps."accuracyPercent",
               t.id AS "topicSlug", t.name AS "topicName"
        FROM practice_sessions ps
        JOIN practice_sets pset ON pset.id = ps."practiceSetId"
        JOIN topics t ON t.id = pset."topicId"
        WHERE ps."userId" = ${userId} AND ps."completedAt" IS NOT NULL
        ORDER BY ps."completedAt" DESC
        LIMIT 5
      `.catch(() => [] as (RawSessionRow & { topicSlug: string; topicName: string })[]),

      // Avg hints per question by topic (last 30 days)
      prisma.$queryRaw<RawAttemptAggRow[]>`
        SELECT "topicId",
               AVG("hintsUsed"::float) AS "hintsUsed",
               COUNT(*)::int           AS "attemptCount"
        FROM question_attempts
        WHERE "userId" = ${userId}
          AND "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY "topicId"
      `.catch(() => [] as RawAttemptAggRow[]),

      // Confidence trend: compare last-7-days avg to prior-7-days avg
      prisma.$queryRaw<RawConfidenceRow[]>`
        SELECT
          AVG(CASE WHEN "createdAt" > NOW() - INTERVAL '7 days'  THEN "confidenceAfter" END) AS "avgBefore",
          AVG(CASE WHEN "createdAt" > NOW() - INTERVAL '14 days'
                   AND "createdAt" <= NOW() - INTERVAL '7 days' THEN "confidenceAfter" END)    AS "avgAfter",
          'trend' AS period
        FROM question_attempts
        WHERE "userId" = ${userId} AND "confidenceAfter" IS NOT NULL
      `.catch(() => [] as RawConfidenceRow[]),
    ]);

    // ── Mastery bands ────────────────────────────────────────────────────────

    const strongTopics: StrongTopic[] = topicProgressRows
      .filter((t) => t.masteryScore >= 0.75 && t.completionPercent > 0)
      .slice(0, 6)
      .map((t) => ({
        topicId:      t.topicId,
        topicName:    (t as unknown as { topic: { name: string } }).topic.name,
        masteryScore: t.masteryScore,
      }));

    const weakTopics: WeakTopic[] = topicProgressRows
      .filter((t) => !t.isMastered && t.completionPercent > 0 && t.masteryScore < 0.55)
      .slice(0, 6)
      .map((t) => {
        const topicMistakes = mistakeRows
          .filter((m) => m.topicId === t.topicId)
          .map((m) => m.tag);
        return {
          topicId:              t.topicId,
          topicName:            (t as unknown as { topic: { name: string } }).topic.name,
          masteryScore:         t.masteryScore,
          accuracyRate:         t.accuracyRate,
          lastAttempt:          t.lastPracticedAt ? t.lastPracticedAt.toISOString() : null,
          activeMisconceptions: topicMistakes,
        };
      });

    // ── Misconception patterns ────────────────────────────────────────────────

    const activeMistakePatterns: MistakePattern[] = mistakeRows.map((m) => ({
      topicId:    m.topicId,
      topicName:  m.topicName,
      tag:        m.tag,
      count:      m.count,
      lastSeenAt: new Date(m.lastSeenAt).toISOString(),
    }));

    // ── Lesson progress ───────────────────────────────────────────────────────

    const lessonsStarted   = lessonRows.filter((l) => l.isStarted).map((l) => l.lessonId);
    const lessonsCompleted = lessonRows.filter((l) => l.isCompleted).map((l) => l.lessonId);

    // ── Topics attempted (ordered by recency via topicProgress) ──────────────

    const topicsAttempted = topicProgressRows
      .filter((t) => t.completionPercent > 0)
      .map((t) => t.topicId);

    // ── Hint dependency ───────────────────────────────────────────────────────

    const hintDependencyByTopic: Record<string, number> = {};
    for (const row of hintAggRows) {
      hintDependencyByTopic[row.topicId] = Number(row.hintsUsed ?? 0);
    }

    // ── Confidence trend ──────────────────────────────────────────────────────

    let confidenceTrend: MemorySnapshot["confidenceTrend"] = "stable";
    const conf = confidenceRows[0];
    if (conf && conf.avgBefore !== null && conf.avgAfter !== null) {
      const delta = Number(conf.avgBefore) - Number(conf.avgAfter);
      if (delta > 8)  confidenceTrend = "rising";
      if (delta < -8) confidenceTrend = "falling";
    }

    const avgConfidenceScore = Number(
      (profile as unknown as Record<string, unknown>)?.["avgConfidenceScore"] ?? 50
    );

    // ── Recent sessions ───────────────────────────────────────────────────────

    const recentSessions: RecentSession[] = recentSessionRows.map((s) => ({
      topicId:   s.topicSlug,
      topicName: s.topicName,
      date:      s.completedAt ? new Date(s.completedAt).toISOString() : "",
      accuracy:  s.accuracyPercent,
      mode:      s.mode,
    }));

    // ── Suggested focus topics ────────────────────────────────────────────────
    // Priority: weak topics with most recent mistakes + topics not practiced in > 7 days

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const suggestedFocusTopics = weakTopics
      .sort((a, b) => {
        // Score = more mistakes + lower mastery + longer gap since practice
        const aLastMs = a.lastAttempt ? new Date(a.lastAttempt).getTime() : 0;
        const bLastMs = b.lastAttempt ? new Date(b.lastAttempt).getTime() : 0;
        const aStale  = aLastMs < sevenDaysAgo ? 1 : 0;
        const bStale  = bLastMs < sevenDaysAgo ? 1 : 0;
        const aScore  = a.activeMisconceptions.length * 2 + (1 - a.masteryScore) * 3 + aStale;
        const bScore  = b.activeMisconceptions.length * 2 + (1 - b.masteryScore) * 3 + bStale;
        return bScore - aScore;
      })
      .slice(0, 3)
      .map((t) => t.topicId);

    // ── Preferences ───────────────────────────────────────────────────────────

    const interestsRaw = (profile as unknown as Record<string, unknown>)?.["interests"] as string ?? "";
    const interests = interestsRaw
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const snapshot: MemorySnapshot = {
      version:               1,
      lessonsStarted,
      lessonsCompleted,
      topicsAttempted,
      strongTopics,
      weakTopics,
      activeMistakePatterns,
      hintDependencyByTopic,
      confidenceTrend,
      avgConfidenceScore,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preferredExplanationStyle: (profile as any)?.preferredExplanationStyle ?? "step_by_step",
      learningPace:              profile?.learningPace               ?? "standard",
      interests,
      recentSessions,
      suggestedFocusTopics,
      lastRefreshedAt:           new Date().toISOString(),
    };

    // Persist asynchronously (don't block the caller)
    this.persistSnapshot(userId, snapshot).catch((e) =>
      console.warn("[studentMemoryService] Failed to persist snapshot:", e)
    );

    return snapshot;
  }

  private async persistSnapshot(userId: string, snapshot: MemorySnapshot): Promise<void> {
    const id = createId();
    const json = JSON.stringify(snapshot);
    await prisma.$executeRaw`
      INSERT INTO student_memory_snapshots (id, "userId", "refreshedAt", snapshot)
      VALUES (${id}, ${userId}, NOW(), ${json}::jsonb)
      ON CONFLICT ("userId")
      DO UPDATE SET snapshot = ${json}::jsonb, "refreshedAt" = NOW()
    `;
  }
}

export const studentMemoryService = new StudentMemoryService();
