/**
 * @module curriculum/lesson_engine
 *
 * Manages lesson sequencing, unlocking, and next-lesson recommendation.
 *
 * LESSON STATES:
 *   locked      — prerequisite topic not yet mastered
 *   unlocked    — ready to start
 *   in_progress — started but not finished
 *   completed   — done, mastery evaluation applied
 *   mastered    — mastery threshold achieved
 *
 * SCORING ASSUMPTIONS (documented in source):
 *   - A topic is "mastered" when TopicProgress.isMastered === true (masteryScore >= threshold, typically 0.8)
 *   - In-progress = completionPercent > 0 but < 1.0
 *   - "Next lesson" = earliest unlocked, non-mastered lesson in curriculum order
 *
 * TODO: Replace LESSON_CATALOG with a Prisma query for the lessons table.
 */

import { Lesson, Grade, MasteryLevel, TopicProgress } from "@/types";
import { getTopicById, getPrerequisiteChain, CURRICULUM_TREE } from "../topic_tree";

export type LessonState = "locked" | "unlocked" | "in_progress" | "completed" | "mastered";

export interface LessonWithState {
  lesson:         Lesson;
  state:          LessonState;
  masteryPercent: number;
  topicId:        string;
  isUnlocked:     boolean;
  missingPrereqs?: string[];
}

export interface NextLessonRecommendation {
  lesson:         Lesson;
  topicId:        string;
  topicName:      string;
  reason:         "next_in_sequence" | "weak_area" | "review_needed";
  masteryPercent: number;
}

// ─── Lesson Catalog ────────────────────────────────────────────────────────────

export const LESSON_CATALOG: Lesson[] = [
  { id: "lesson-g1-counting-01", topicId: "g1-numbers-counting",   title: "Count to 10",                  objective: "Count and identify numbers 1-10",                    contentSummary: "Using objects and number lines",                    orderIndex: 1, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g1-counting-02", topicId: "g1-numbers-counting",   title: "Count to 50",                  objective: "Count forward and backward within 50",               contentSummary: "Skipping by 5s and 10s",                            orderIndex: 2, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g1-counting-03", topicId: "g1-numbers-counting",   title: "Count to 100",                 objective: "Read, write, and count to 100",                      contentSummary: "Hundreds chart, counting by 10s",                   orderIndex: 3, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g1-add-01",      topicId: "g1-ops-addition",       title: "Adding to 10",                 objective: "Understand addition as joining groups",               contentSummary: "Counters and number bonds",                         orderIndex: 1, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g1-add-02",      topicId: "g1-ops-addition",       title: "Adding to 20",                 objective: "Add single-digit numbers with sums to 20",           contentSummary: "Ten-frames and number lines",                       orderIndex: 2, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g1-sub-01",      topicId: "g1-ops-subtraction",    title: "Subtracting from 10",          objective: "Subtract from numbers up to 10",                     contentSummary: "Taking away with objects and number lines",         orderIndex: 1, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g3-mult-01",     topicId: "g3-ops-multiplication", title: "Multiplication as Groups",     objective: "Understand multiplication as equal groups",           contentSummary: "Arrays, repeated addition, skip counting",         orderIndex: 1, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g3-mult-02",     topicId: "g3-ops-multiplication", title: "Times Tables: 2s, 5s, 10s",   objective: "Memorise and apply 2s, 5s, 10s tables",              contentSummary: "Pattern recognition and skip counting",             orderIndex: 2, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g3-mult-03",     topicId: "g3-ops-multiplication", title: "Times Tables: 3s, 4s, 6s",   objective: "Extend multiplication to 3s, 4s, 6s",                contentSummary: "Arrays and area models",                            orderIndex: 3, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g3-frac-01",     topicId: "g3-fractions-intro",    title: "What Is a Fraction?",          objective: "Identify fractions as parts of a whole",             contentSummary: "Pizza slices, fraction bars",                       orderIndex: 1, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g3-frac-02",     topicId: "g3-fractions-intro",    title: "Numerator and Denominator",    objective: "Name and interpret parts of a fraction",             contentSummary: "Reading fractions, shading models",                 orderIndex: 2, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g4-fracadd-01",  topicId: "g4-fractions-add",      title: "Adding Like Fractions",        objective: "Add fractions with the same denominator",            contentSummary: "Same denominator addition, simplifying results",    orderIndex: 1, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g4-fracadd-02",  topicId: "g4-fractions-add",      title: "Finding Common Denominators",  objective: "Find the LCM to create like denominators",           contentSummary: "LCM, equivalent fractions, conversion",             orderIndex: 2, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
  { id: "lesson-g4-fracadd-03",  topicId: "g4-fractions-add",      title: "Adding Unlike Fractions",      objective: "Add fractions with different denominators",          contentSummary: "Full workflow: find LCD, convert, add, simplify",   orderIndex: 3, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") },
];

// ─── Engine ────────────────────────────────────────────────────────────────────

export class LessonEngine {
  /**
   * Returns all lessons for a grade annotated with student state.
   *
   * SCORING:
   *   state = "mastered"    → isMastered && masteryScore >= 0.95
   *   state = "completed"   → isMastered || completionPercent >= 1.0
   *   state = "in_progress" → completionPercent > 0
   *   state = "unlocked"    → prereqs met, no progress yet
   *   state = "locked"      → at least one prereq topic not mastered
   */
  getLessonsForGrade(
    grade: Grade,
    topicProgressMap: Record<string, TopicProgress>
  ): LessonWithState[] {
    const gradeEntry = CURRICULUM_TREE.find((g) => g.grade === grade);
    if (!gradeEntry) return [];

    const topicIds = new Set(
      gradeEntry.strands.flatMap((s) => s.topics.map((t) => t.id))
    );

    return LESSON_CATALOG
      .filter((l) => topicIds.has(l.topicId))
      .map((lesson) => this.annotateLesson(lesson, topicProgressMap));
  }

  /**
   * Returns the best next lesson for a student.
   *
   * PRIORITY ORDER:
   *   1. In-progress lessons (resume what's started)
   *   2. Weak areas (low mastery, previously attempted)
   *   3. Next unlocked lesson in curriculum sequence
   */
  getRecommendedNextLesson(
    grade: Grade,
    topicProgressMap: Record<string, TopicProgress>
  ): NextLessonRecommendation | null {
    const all = this.getLessonsForGrade(grade, topicProgressMap);
    const available = all.filter(
      (l) => l.isUnlocked && l.state !== "mastered" && l.state !== "locked"
    );

    if (available.length === 0) return null;

    // 1. Resume in-progress
    const inProgress = available.find((l) => l.state === "in_progress");
    if (inProgress) return this.toRecommendation(inProgress, "next_in_sequence");

    // 2. Weak area: completed but low mastery
    const weak = available
      .filter((l) => l.state === "completed" && l.masteryPercent < 0.7)
      .sort((a, b) => a.masteryPercent - b.masteryPercent)[0];
    if (weak) return this.toRecommendation(weak, "weak_area");

    // 3. Next unlocked in sequence
    const next = available.find((l) => l.state === "unlocked");
    if (next) return this.toRecommendation(next, "next_in_sequence");

    return null;
  }

  /**
   * Checks if a student meets prerequisites for a lesson.
   */
  checkPrerequisites(
    lessonId: string,
    topicProgressMap: Record<string, TopicProgress>
  ): { allowed: boolean; missingPrereqs: string[] } {
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return { allowed: false, missingPrereqs: [] };

    const topic = getTopicById(lesson.topicId);
    if (!topic) return { allowed: true, missingPrereqs: [] };

    const missingPrereqs = getPrerequisiteChain(topic.id)
      .filter((p) => !topicProgressMap[p.id]?.isMastered)
      .map((p) => p.id);

    return { allowed: missingPrereqs.length === 0, missingPrereqs };
  }

  getLessonById(lessonId: string): Lesson | undefined {
    return LESSON_CATALOG.find((l) => l.id === lessonId);
  }

  getLessonsForTopic(topicId: string): Lesson[] {
    return LESSON_CATALOG
      .filter((l) => l.topicId === topicId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private annotateLesson(
    lesson: Lesson,
    progressMap: Record<string, TopicProgress>
  ): LessonWithState {
    const topic = getTopicById(lesson.topicId);
    const progress = progressMap[lesson.topicId];

    const prereqChain = topic ? getPrerequisiteChain(topic.id) : [];
    const missingPrereqs = prereqChain
      .filter((p) => !progressMap[p.id]?.isMastered)
      .map((p) => p.id);

    const isUnlocked = missingPrereqs.length === 0;
    const masteryPercent = progress?.masteryScore ?? 0;
    const completionPct  = progress?.completionPercent ?? 0;

    let state: LessonState = "locked";
    if (!isUnlocked) {
      state = "locked";
    } else if (progress?.isMastered && masteryPercent >= 0.95) {
      state = "mastered";
    } else if (progress?.isMastered || completionPct >= 1.0) {
      state = "completed";
    } else if (completionPct > 0) {
      state = "in_progress";
    } else {
      state = "unlocked";
    }

    return {
      lesson,
      state,
      masteryPercent,
      topicId: lesson.topicId,
      isUnlocked,
      missingPrereqs: missingPrereqs.length > 0 ? missingPrereqs : undefined,
    };
  }

  private toRecommendation(
    item: LessonWithState,
    reason: NextLessonRecommendation["reason"]
  ): NextLessonRecommendation {
    const topic = getTopicById(item.topicId);
    return {
      lesson:         item.lesson,
      topicId:        item.topicId,
      topicName:      topic?.name ?? item.topicId,
      reason,
      masteryPercent: item.masteryPercent,
    };
  }
}

export const lessonEngine = new LessonEngine();
