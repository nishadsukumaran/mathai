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
import {
  findProfile,
  findTopicProgress,
} from "../mock/data";
import { xpEngine } from "../../services/gamification/xp_engine";
import { practiceGenerator } from "../../curriculum/practice_generator";
import { masteryEvaluator } from "../../curriculum/mastery_evaluator";
import { tutorService } from "../../ai/tutor/tutor_service";
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

  const result = await practiceGenerator.createSession({
    studentId:     userId,
    lessonId:      lessonId ?? "",
    topicId,
    mode,
    grade,
    difficulty:    difficulty ?? Difficulty.Intermediate,
    questionCount: questionCount ?? 10,
  });

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
    questions:       result.questions,
    responses:       [],
    currentIndex:    0,
    xpEarned:        0,
    accuracyPercent: 0,
    difficulty:      difficulty ?? Difficulty.Intermediate,
  };

  ACTIVE_SESSIONS.set(sessionId, session);

  const firstQuestion = result.questions[0];
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

  // 5. XP
  const profile = findProfile(session.userId);
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
    const topicProgress = findTopicProgress(session.userId).find(
      (tp) => tp.topicId === session.topicId
    );
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
      ? { newLevel: levelUp.level, title: levelUp.label }
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
