/**
 * @module api/services/practiceService
 *
 * Orchestrates the full practice loop:
 *   start → select questions → submit answer → check → tag misconception
 *   → update progress → return next-step guidance.
 *
 * All session state is held in-memory (ACTIVE_SESSIONS map) until a proper
 * Redis/DB session store is wired. The session ID is returned to the client
 * and passed back on every submission.
 */

import {
  ActivePracticeSession,
  PracticeQuestion,
  QuestionResponse,
  SubmissionResult,
  PracticeMode,
  Difficulty,
  Grade,
  MasteryLevel,
  XPReason,
  MisconceptionCategory,
  TutorHelpRequest,
  TutorHelpResponse,
} from "@/types";
import { prisma } from "../lib/prisma";
import { xpEngine } from "../../services/gamification/xp_engine";
import { practiceGenerator } from "../../curriculum/practice_generator";
import { masteryEvaluator } from "../../curriculum/mastery_evaluator";
import { tutorService } from "../../ai/tutor/tutor_service";
import { questionGeneratorService } from "../../ai/services/questionGeneratorService";
import { studentMemoryService }    from "../../ai/services/studentMemoryService";
import { appendAfterCompletion }  from "./topicAssignmentService";
import { NotFoundError, ValidationError } from "../middlewares/error.middleware";

// ─── In-Memory Session Store ──────────────────────────────────────────────────

/**
 * Active session map — keyed by sessionId.
 * TODO: Replace with Redis HASH or Prisma practice_sessions row + in-memory cache.
 */
const ACTIVE_SESSIONS = new Map<string, ActivePracticeSession>();

// ─── Public API ───────────────────────────────────────────────────────────────

export interface StartPracticeParams {
  userId:         string;
  practiceSetId?: string;
  topicId:        string;
  lessonId?:      string;
  mode:           PracticeMode;
  difficulty?:    Difficulty;
  questionCount?: number;
  grade:          Grade;
}

/**
 * Starts a new practice session and returns the first question.
 */
export async function startSession(
  params: StartPracticeParams
): Promise<{ session: Omit<ActivePracticeSession, "responses">; firstQuestion: PracticeQuestion }> {
  const { userId, topicId, lessonId, mode, difficulty, questionCount, grade, practiceSetId } = params;

  // ── Step 1: Fetch student profile + memory snapshot in parallel ──────────────
  const [profile, memorySnapshot] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }).catch(() => null),
    studentMemoryService.getSnapshot(userId).catch(() => null),
  ]);
  const topicName = topicId.replace(/^g\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Step 2: AI-first question generation via Vercel AI Gateway ──────────────
  let questions: PracticeQuestion[];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileAny = profile as any;

    // Extract topic-specific misconceptions from the memory snapshot
    const topicMisconceptions = memorySnapshot?.activeMistakePatterns
      .filter((p) => p.topicId === topicId)
      .map((p) => p.tag) ?? [];

    const recentMistakeTags = memorySnapshot?.activeMistakePatterns
      .slice(0, 5)
      .map((p) => p.tag) ?? [];

    const aiQuestions = await questionGeneratorService.generate({
      topicId,
      topicName,
      grade: grade as import("@mathai/shared-types").Grade,
      difficulty:    difficulty ?? Difficulty.Intermediate,
      mode: mode as import("@mathai/shared-types").PracticeMode,
      questionCount: questionCount ?? 10,
      studentContext: {
        learningPace:              memorySnapshot?.learningPace ?? String(profileAny?.learningPace ?? "standard"),
        confidenceLevel:           memorySnapshot?.avgConfidenceScore ?? Number(profile?.confidenceLevel ?? 50),
        preferredExplanationStyle: memorySnapshot?.preferredExplanationStyle ?? String(profileAny?.preferredExplanationStyle ?? "step_by_step"),
        recentMistakes:            recentMistakeTags,
        interestKeywords:          memorySnapshot?.interests ?? [],
        activeMisconceptionsForTopic: topicMisconceptions,
      },
    });

    // Map AI questions to PracticeQuestion shape (correctAnswer is held server-side)
    questions = aiQuestions.map((q) => ({
      id:            q.id,
      topicId,
      type:          q.type,
      prompt:        q.prompt,
      options:       q.options,
      correctAnswer: q.correctAnswer,
      explanation:   "",          // AI explanations are generated on-demand via tutor
      difficulty:    q.difficulty as Difficulty,
      grade,
      xpReward:      q.xpReward,
      conceptTags:   q.conceptTags,
    } as PracticeQuestion));

    console.log(`[practiceService] AI generated ${questions.length} questions for topic "${topicName}" (grade ${grade})`);

  } catch (aiError) {
    // ── Fallback: static curriculum generator ──────────────────────────────────
    console.warn("[practiceService] AI question generation failed — falling back to static curriculum:", (aiError as Error).message);

    const result = await practiceGenerator.createSession({
      studentId:     userId,
      lessonId:      lessonId ?? "",
      topicId,
      mode,
      grade,
      difficulty:    difficulty ?? Difficulty.Intermediate,
      questionCount: questionCount ?? 10,
    });
    questions = result.questions;
  }

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const session: ActivePracticeSession = {
    id:              sessionId,
    userId,
    practiceSetId,
    topicId,
    lessonId,
    mode,
    grade,
    startedAt:       new Date(),
    questions,
    responses:       [],
    currentIndex:    0,
    xpEarned:        0,
    accuracyPercent: 0,
    difficulty:      difficulty ?? Difficulty.Intermediate,
  };

  ACTIVE_SESSIONS.set(sessionId, session);

  // Mark lesson started in memory (fire-and-forget)
  if (lessonId) {
    studentMemoryService.markLessonStarted(userId, lessonId, topicId)
      .catch((e) => console.warn("[practiceService] markLessonStarted failed:", e));
  }

  const firstQuestion = questions[0];
  if (!firstQuestion) throw new ValidationError("Practice set has no questions for this topic");

  const { responses: _r, ...sessionMeta } = session;
  return { session: sessionMeta, firstQuestion };
}

export interface SubmitAnswerParams {
  sessionId:         string;
  questionId:        string;
  studentAnswer:     string;
  timeSpentSeconds:  number;
  hintsUsed:         number;
  confidenceBefore?: number;
}

/**
 * Processes a student's answer submission.
 * Checks correctness, tags misconception, awards XP, updates mastery.
 */
export async function submitAnswer(params: SubmitAnswerParams): Promise<SubmissionResult> {
  const { sessionId, questionId, studentAnswer, timeSpentSeconds, hintsUsed } = params;

  const session = ACTIVE_SESSIONS.get(sessionId);
  if (!session) throw new NotFoundError("PracticeSession", sessionId);

  const question = session.questions.find((q) => q.id === questionId);
  if (!question) throw new NotFoundError("Question", questionId);

  // 1. Check correctness
  const isCorrect = checkAnswer(studentAnswer, question.correctAnswer);

  // 2. Detect misconception
  const misconceptionTag = isCorrect
    ? MisconceptionCategory.None
    : detectMisconception(question, studentAnswer);

  // 3. Attempt count
  const priorResponses = session.responses.filter((r) => r.questionId === questionId);
  const attemptCount = priorResponses.length + 1;

  // 4. Record response
  const response: QuestionResponse = {
    questionId,
    isCorrect,
    attemptCount,
    hintsUsed,
    timeSpentSeconds,
    studentAnswer,
    misconceptionTag,
  };
  session.responses.push(response);

  // 4a. Memory: record mistake pattern (fire-and-forget)
  if (!isCorrect && misconceptionTag && (misconceptionTag as string) !== "None" && (misconceptionTag as string) !== "none") {
    studentMemoryService.recordMistake(session.userId, session.topicId, misconceptionTag)
      .catch((e) => console.warn("[practiceService] recordMistake failed:", e));
  }
  // 4b. Memory: check if patterns resolved after a correct answer
  if (isCorrect) {
    studentMemoryService.checkAndResolvePatterns(session.userId, session.topicId)
      .catch((e) => console.warn("[practiceService] checkAndResolvePatterns failed:", e));
  }

  // 5. XP
  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.userId } });
  const currentXp = profile?.totalXp ?? 0;

  const { amount: xpEarned, reason: _xpReason } = practiceGenerator.calculateQuestionXP({
    isCorrect,
    attemptCount,
    mode: session.mode,
    baseXP: question.xpReward,
  });
  session.xpEarned += xpEarned;

  // 6. Level-up detection
  const levelUp = xpEngine.detectLevelUp(currentXp, xpEarned);

  // 6b. Persist XP to DB so progress pages reflect actual totals
  if (xpEarned > 0) {
    await prisma.studentProfile.upsert({
      where:  { userId: session.userId },
      create: {
        userId:       session.userId,
        totalXp:      xpEarned,
        currentLevel: levelUp?.level ?? 1,
      },
      update: {
        totalXp:      { increment: xpEarned },
        ...(levelUp && { currentLevel: levelUp.level }),
      },
    }).catch((e) => console.warn("[practiceService] XP persist failed:", e));
  }

  // 7. Advance question index
  if (isCorrect || attemptCount >= 3) {
    session.currentIndex = Math.min(session.currentIndex + 1, session.questions.length);
  }

  const sessionComplete = session.currentIndex >= session.questions.length;

  if (sessionComplete) {
    session.completedAt = new Date();
    session.accuracyPercent = computeAccuracy(session.responses);
    ACTIVE_SESSIONS.delete(sessionId);
  }

  // 8. Mastery update on session completion
  let masteryUpdate: SubmissionResult["masteryUpdate"];
  if (sessionComplete) {
    const topicProgress = await prisma.topicProgress.findFirst({
      where: { userId: session.userId, topicId: session.topicId },
    });
    const previousLevel = topicProgress
      ? scoreToMasteryLevel(topicProgress.masteryScore)
      : MasteryLevel.NotStarted;

    const evalSession = {
      id:              session.id,
      studentId:       session.userId,
      lessonId:        session.lessonId ?? session.topicId,
      topicId:         session.topicId,
      mode:            session.mode,
      startedAt:       session.startedAt,
      responses:       session.responses,
      questions:       session.questions,
      xpEarned:        session.xpEarned,
      accuracyPercent: session.accuracyPercent,
    };

    const evaluation = masteryEvaluator.evaluate(evalSession as any, previousLevel);
    masteryUpdate = {
      topicId:      session.topicId,
      newLevel:     evaluation.newLevel,
      levelChanged: evaluation.levelChanged,
    };

    // 8b. Persist mastery + topic progress to DB
    const sessionAccuracy  = session.accuracyPercent / 100;
    const prevMasteryScore = topicProgress?.masteryScore ?? 0;
    // EWMA blend: weight recent sessions at 30%, historical at 70%
    const newMasteryScore  = topicProgress
      ? prevMasteryScore * 0.7 + sessionAccuracy * 0.3
      : sessionAccuracy;
    const newIsMastered    = newMasteryScore >= 0.8;
    const newCompletionPct = Math.min((topicProgress?.completionPercent ?? 0) + 0.2, 1.0);

    await prisma.topicProgress.upsert({
      where:  { userId_topicId: { userId: session.userId, topicId: session.topicId } },
      create: {
        userId:            session.userId,
        topicId:           session.topicId,
        masteryScore:      newMasteryScore,
        accuracyRate:      sessionAccuracy,
        completionPercent: 0.2,
        isMastered:        newIsMastered,
        isUnlocked:        true,
        lastPracticedAt:   new Date(),
      },
      update: {
        masteryScore:      newMasteryScore,
        accuracyRate:      sessionAccuracy,
        completionPercent: newCompletionPct,
        isMastered:        newIsMastered,
        lastPracticedAt:   new Date(),
      },
    }).catch((e) => console.warn("[practiceService] Mastery persist failed:", e));

    // 8a. Memory: update lesson progress + profile counters + refresh snapshot (fire-and-forget)
    const totalHints = session.responses.reduce((sum, r) => sum + (r.hintsUsed ?? 0), 0);
    const confidenceAfterValues = session.responses
      .map((r) => params.confidenceBefore ?? 50)
      .filter((v) => v > 0);
    const avgConf = confidenceAfterValues.length > 0
      ? confidenceAfterValues.reduce((a, b) => a + b, 0) / confidenceAfterValues.length
      : undefined;

    Promise.allSettled([
      session.lessonId
        ? studentMemoryService.markLessonProgress(
            session.userId, session.lessonId, session.topicId,
            session.accuracyPercent / 100
          )
        : Promise.resolve(),
      studentMemoryService.updateProfileCounters(session.userId, {
        questionsAttempted: session.responses.length,
        hintsUsed:          totalHints,
        avgConfidenceAfter: avgConf,
      }),
      studentMemoryService.refreshSnapshot(session.userId),
      // Re-prioritise the AI topic queue: move the completed topic to the back
      // and check if new grade-level topics should be injected.
      appendAfterCompletion(session.userId, session.topicId),
    ]).catch((e) => console.warn("[practiceService] Post-session update failed:", e));
  }

  // 9. Encouragement
  const encouragement = pickEncouragement(isCorrect, attemptCount, session.mode);

  // 10. Next action
  let nextAction: SubmissionResult["nextAction"] = "continue";
  if (levelUp)             nextAction = "level_up";
  else if (sessionComplete) nextAction = "session_complete";
  else if (!isCorrect && hintsUsed === 0) nextAction = "hint_available";

  return {
    isCorrect,
    correctAnswer:    question.correctAnswer,
    xpEarned,
    misconceptionTag: misconceptionTag === MisconceptionCategory.None
      ? undefined
      : misconceptionTag,
    encouragement,
    nextAction,
    levelUp: levelUp
      ? { newLevel: levelUp.level, title: levelUp.label ?? "" }
      : undefined,
    sessionComplete,
    masteryUpdate,
  };
}

/**
 * Returns the next question in the session, or null if complete.
 */
export async function getNextQuestion(sessionId: string): Promise<PracticeQuestion | null> {
  const session = ACTIVE_SESSIONS.get(sessionId);
  if (!session) throw new NotFoundError("PracticeSession", sessionId);
  return session.questions[session.currentIndex] ?? null;
}

/**
 * Delegates a help request to the AI tutor.
 */
export async function getTutorHelp(request: TutorHelpRequest): Promise<TutorHelpResponse> {
  return tutorService.handleHelpRequest(request);
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function checkAnswer(studentAnswer: string, correctAnswer: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  if (norm(studentAnswer) === norm(correctAnswer)) return true;

  const sa = parseFloat(studentAnswer.replace(",", "."));
  const ca = parseFloat(correctAnswer.replace(",", "."));
  if (!isNaN(sa) && !isNaN(ca)) return Math.abs(sa - ca) < 0.001;

  return false;
}

function detectMisconception(
  question: PracticeQuestion,
  studentAnswer: string
): MisconceptionCategory {
  const tags = question.conceptTags;

  // Fraction: adds numerators and denominators separately (1/2 + 1/3 = 2/5)
  if (tags.some((t) => t.includes("fraction"))) {
    const match = question.prompt.match(/(\d+)\/(\d+)\s*[+\-]\s*(\d+)\/(\d+)/);
    if (match) {
      const [, n1, d1, n2, d2] = match.map(Number);
      const wrongNum = (n1 ?? 0) + (n2 ?? 0);
      const wrongDen = (d1 ?? 0) + (d2 ?? 0);
      if (studentAnswer === `${wrongNum}/${wrongDen}`) {
        return MisconceptionCategory.FractionMisunderstanding;
      }
    }
  }

  // Place value: off by 10 or 100
  if (tags.some((t) => t.includes("place-value"))) {
    const correct = parseFloat(question.correctAnswer);
    const student = parseFloat(studentAnswer);
    if (!isNaN(correct) && !isNaN(student)) {
      if ([10, 100, 1000].includes(Math.abs(correct - student))) {
        return MisconceptionCategory.PlaceValueConfusion;
      }
    }
  }

  // Sign error
  if (tags.some((t) => t.includes("subtraction") || t.includes("negative"))) {
    const correct = parseFloat(question.correctAnswer);
    const student = parseFloat(studentAnswer);
    if (!isNaN(correct) && !isNaN(student) && correct === -student) {
      return MisconceptionCategory.SignError;
    }
  }

  // Wrong operation: added when should multiply (or vice versa)
  const correct = parseFloat(question.correctAnswer);
  const student = parseFloat(studentAnswer);
  const nums = (question.prompt.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).slice(0, 2);
  if (nums.length === 2 && !isNaN(correct) && !isNaN(student)) {
    const [a, b] = nums as [number, number];
    if ((student === a + b && correct === a * b) || (student === a * b && correct === a + b)) {
      return MisconceptionCategory.WrongOperation;
    }
  }

  return MisconceptionCategory.CarelessError;
}

function computeAccuracy(responses: QuestionResponse[]): number {
  if (responses.length === 0) return 0;
  return responses.filter((r) => r.isCorrect).length / responses.length;
}

function scoreToMasteryLevel(score: number): MasteryLevel {
  if (score >= 0.95) return MasteryLevel.Extended;
  if (score >= 0.8)  return MasteryLevel.Mastered;
  if (score >= 0.5)  return MasteryLevel.Developing;
  if (score > 0)     return MasteryLevel.Emerging;
  return MasteryLevel.NotStarted;
}

const ENCOURAGEMENTS = {
  correct_first:  ["Brilliant! You got it first try!", "Perfect!", "Nailed it! Keep going!", "Yes! That's exactly right!"],
  correct_retry:  ["You got there! Persistence pays off!", "Well done for sticking with it!", "That's it!"],
  incorrect:      ["Good try! Give it one more go.", "Almost! Think through each step carefully.", "Not quite — but that's how we learn!"],
  challenge:      ["Challenge mode — this one's tough, keep going!", "You're tackling the hard stuff!"],
};

function pickEncouragement(
  isCorrect: boolean,
  attemptCount: number,
  mode: PracticeMode
): string {
  const pool =
    mode === PracticeMode.Challenge
      ? ENCOURAGEMENTS.challenge
      : isCorrect
        ? attemptCount === 1 ? ENCOURAGEMENTS.correct_first : ENCOURAGEMENTS.correct_retry
        : ENCOURAGEMENTS.incorrect;
  return pool[Math.floor(Math.random() * pool.length)] ?? "Keep going!";
}
