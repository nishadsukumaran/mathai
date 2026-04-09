/**
 * @module api/services/attemptRecorder
 *
 * Lightweight attempt recording for non-session learning interactions.
 * Used by: "Try one like this" (Ask MathAI), post-animation attempts,
 * recommendation-driven quick practice.
 *
 * Performs the same DB writes as practiceService.submitAnswer() without
 * requiring a PracticeSession lifecycle:
 *   - QuestionAttempt row
 *   - Misconception tracking (recordMistake / resolvePatterns)
 *   - XP award + level-up detection
 *   - Profile counter updates
 *   - Memory snapshot refresh
 *
 * This ensures every learning interaction feeds the same mastery model.
 */

import { prisma }                from "../lib/prisma";
import { xpEngine }              from "../../services/gamification/xp_engine";
import { studentMemoryService }  from "../../ai/services/studentMemoryService";
import { trackQuestProgress }    from "./questProgressService";
import { createId }              from "@paralleldrive/cuid2";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RecordAttemptRequest {
  userId:           string;
  topicId:          string;
  questionText:     string;
  studentAnswer:    string;
  correctAnswer:    string;
  timeSpentSeconds: number;
  hintsUsed?:       number;
  source:           "ask_similar" | "post_animation" | "recommendation" | "quick_practice";
}

export interface RecordAttemptResult {
  isCorrect:        boolean;
  xpEarned:         number;
  levelUp:          { newLevel: number; title: string } | null;
  misconceptionTag: string | null;
}

// ─── Answer checking (same logic as practiceService) ─────────────────────────

function checkAnswer(studentAnswer: string, correctAnswer: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  if (norm(studentAnswer) === norm(correctAnswer)) return true;

  const sa = parseFloat(studentAnswer.replace(",", "."));
  const ca = parseFloat(correctAnswer.replace(",", "."));
  if (!isNaN(sa) && !isNaN(ca)) return Math.abs(sa - ca) < 0.001;

  return false;
}

// ─── Simple misconception detection for non-session context ──────────────────

function detectSimpleMisconception(
  questionText: string,
  studentAnswer: string,
  correctAnswer: string,
): string | null {
  const correct = parseFloat(correctAnswer);
  const student = parseFloat(studentAnswer);

  if (isNaN(correct) || isNaN(student)) return null;

  // Sign error
  if (correct === -student) return "sign_error";

  // Off by factor of 10 (place value)
  if ([10, 100, 1000].includes(Math.abs(correct - student))) return "place_value_confusion";

  // Wrong operation (added instead of multiplied or vice versa)
  const nums = (questionText.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).slice(0, 2);
  if (nums.length === 2) {
    const [a, b] = nums as [number, number];
    if ((student === a + b && correct === a * b) || (student === a * b && correct === a + b)) {
      return "wrong_operation";
    }
  }

  // Fraction: adds num+num / den+den
  const fracMatch = questionText.match(/(\d+)\/(\d+)\s*[+\-]\s*(\d+)\/(\d+)/);
  if (fracMatch) {
    const [, n1, d1, n2, d2] = fracMatch.map(Number);
    const wrongAnswer = `${(n1 ?? 0) + (n2 ?? 0)}/${(d1 ?? 0) + (d2 ?? 0)}`;
    if (studentAnswer.trim() === wrongAnswer) return "fraction_misunderstanding";
  }

  return null;
}

// ─── Core recorder ───────────────────────────────────────────────────────────

export async function recordAttempt(req: RecordAttemptRequest): Promise<RecordAttemptResult> {
  const {
    userId, topicId, questionText, studentAnswer, correctAnswer,
    timeSpentSeconds, hintsUsed = 0, source,
  } = req;

  const isCorrect = checkAnswer(studentAnswer, correctAnswer);
  const misconceptionTag = isCorrect
    ? null
    : detectSimpleMisconception(questionText, studentAnswer, correctAnswer);

  // 1. Persist QuestionAttempt
  const attemptId = createId();
  prisma.questionAttempt.create({
    data: {
      id:               attemptId,
      sessionId:        `${source}_${Date.now()}`,   // synthetic session ID for grouping
      userId,
      topicId,
      practiceSetId:    source,
      questionText,
      studentAnswer,
      correctAnswer,
      isCorrect,
      hintsUsed,
      timeSpentSeconds,
      misconceptionTag,
    },
  }).catch((err) => console.error("[attemptRecorder] persist failed:", err));

  // 2. Misconception tracking
  if (!isCorrect && misconceptionTag) {
    studentMemoryService.recordMistake(userId, topicId, misconceptionTag)
      .catch((err) => console.error("[attemptRecorder] recordMistake failed:", err));
  }
  if (isCorrect) {
    studentMemoryService.checkAndResolvePatterns(userId, topicId)
      .catch((err) => console.error("[attemptRecorder] resolvePatterns failed:", err));
  }

  // 3. XP award
  const baseXP = isCorrect ? 10 : 2;   // lighter than full practice (15/5)
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  const currentXp = profile?.totalXp ?? 0;
  const levelUp = xpEngine.detectLevelUp(currentXp, baseXP);

  if (baseXP > 0) {
    prisma.studentProfile.upsert({
      where:  { userId },
      create: { userId, totalXp: baseXP, currentLevel: levelUp?.level ?? 1 },
      update: {
        totalXp: { increment: baseXP },
        ...(levelUp && { currentLevel: levelUp.level }),
      },
    }).catch((err) => console.error("[attemptRecorder] XP persist failed:", err));
  }

  // 4. Profile counters
  studentMemoryService.updateProfileCounters(userId, {
    questionsAttempted: 1,
    hintsUsed,
  }).catch((err) => console.error("[attemptRecorder] counters failed:", err));

  // 5. Refresh memory snapshot (async, don't block response)
  studentMemoryService.refreshSnapshot(userId)
    .catch((err) => console.error("[attemptRecorder] snapshot refresh failed:", err));

  // 6. Quest progress: track correct answer (fire-and-forget)
  if (isCorrect) {
    void trackQuestProgress(userId, "correct_answers", 1);
  }

  return {
    isCorrect,
    xpEarned: baseXP,
    levelUp: levelUp ? { newLevel: levelUp.level, title: levelUp.title } : null,
    misconceptionTag,
  };
}
