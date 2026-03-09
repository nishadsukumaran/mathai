/**
 * @module curriculum/practice_generator
 *
 * Generates and selects practice questions for a student's session.
 *
 * MODES:
 *   Guided   — pulls questions sequentially from the lesson's practice set
 *   Practice — random selection within difficulty range, from topic's full question bank
 *   Challenge — hardest questions available, timed, no hints
 *   Review   — spaced repetition: pulls from weakest topics, lower difficulty
 *
 * QUESTION SELECTION ALGORITHM:
 *   1. Fetch eligible questions from the DB (matching topic, grade, difficulty)
 *   2. Exclude questions seen in recent sessions (deduplication window: 7 days)
 *   3. Prioritise questions that target the student's specific weak concept tags
 *   4. Shuffle the final set to prevent predictable ordering
 *
 * ADAPTIVE DIFFICULTY:
 *   After every 3 correct answers → bump difficulty up one level
 *   After every 2 incorrect answers in a row → drop difficulty one level
 */

import {
  PracticeQuestion,
  PracticeSession,
  PracticeMode,
  Difficulty,
  Grade,
  QuestionType,
  XPReason,
} from "@/types";

export interface PracticeSessionRequest {
  studentId: string;
  lessonId: string;
  topicId: string;
  mode: PracticeMode;
  grade: Grade;
  difficulty: Difficulty;
  questionCount?: number;  // default: 10
}

export interface SessionCreationResult {
  session: Omit<PracticeSession, "responses">;
  questions: PracticeQuestion[];
}

export class PracticeGenerator {
  private readonly DEFAULT_QUESTION_COUNT = 10;
  private readonly CHALLENGE_QUESTION_COUNT = 5;

  /**
   * Creates a new practice session with a selected set of questions.
   */
  async createSession(request: PracticeSessionRequest): Promise<SessionCreationResult> {
    const questionCount = this.getQuestionCount(request.mode, request.questionCount);
    const difficulty = this.resolveInitialDifficulty(request.mode, request.difficulty);

    const questions = await this.selectQuestions({
      topicId: request.topicId,
      grade: request.grade,
      difficulty,
      count: questionCount,
      excludeRecentlySeenBy: request.studentId,
    });

    const session: Omit<PracticeSession, "responses"> = {
      id: this.generateSessionId(),
      studentId: request.studentId,
      lessonId: request.lessonId,
      mode: request.mode,
      startedAt: new Date(),
      questions,
      xpEarned: 0,
      accuracyPercent: 0,
    };

    return { session, questions };
  }

  /**
   * Calculates XP earned for a single question response.
   * Called by the API's practice submission handler.
   */
  calculateQuestionXP(params: {
    isCorrect: boolean;
    attemptCount: number;
    mode: PracticeMode;
    baseXP: number;
  }): { amount: number; reason: XPReason } {
    const { isCorrect, attemptCount, mode, baseXP } = params;

    if (!isCorrect) return { amount: 0, reason: XPReason.CorrectAnswer };

    if (mode === PracticeMode.Challenge) {
      return { amount: baseXP * 2, reason: XPReason.ChallengeComplete };
    }

    if (attemptCount === 1) {
      return { amount: baseXP, reason: XPReason.CorrectAnswer }; // +10 standard
    }

    // Retry success — reduced XP for persistence
    return { amount: Math.floor(baseXP * 0.6), reason: XPReason.RetrySuccess }; // +6
  }

  /**
   * Determines the next question's difficulty based on recent performance.
   * Called mid-session to implement adaptive difficulty adjustment.
   */
  adaptDifficulty(
    currentDifficulty: Difficulty,
    recentCorrect: number,
    recentIncorrect: number
  ): Difficulty {
    const order: Difficulty[] = [
      Difficulty.Beginner,
      Difficulty.Intermediate,
      Difficulty.Advanced,
      Difficulty.Challenge,
    ];
    const idx = order.indexOf(currentDifficulty);

    if (recentCorrect >= 3 && idx < order.length - 1) {
      return order[idx + 1] ?? currentDifficulty;
    }

    if (recentIncorrect >= 2 && idx > 0) {
      return order[idx - 1] ?? currentDifficulty;
    }

    return currentDifficulty;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private async selectQuestions(params: {
    topicId: string;
    grade: Grade;
    difficulty: Difficulty;
    count: number;
    excludeRecentlySeenBy: string;
  }): Promise<PracticeQuestion[]> {
    // TODO: Replace stub with Prisma query:
    //
    //   return prisma.practiceQuestion.findMany({
    //     where: {
    //       topicId: params.topicId,
    //       grade: params.grade,
    //       difficulty: params.difficulty,
    //       NOT: { seenBy: { some: { studentId: params.excludeRecentlySeenBy, seenAt: { gte: sevenDaysAgo } } } },
    //     },
    //     take: params.count,
    //     orderBy: { random: true },  // Prisma extension or raw query
    //   });

    console.log("[practice_generator] selectQuestions stub called", params);
    return STUB_QUESTIONS.slice(0, params.count);
  }

  private getQuestionCount(mode: PracticeMode, override?: number): number {
    if (override) return override;
    if (mode === PracticeMode.Challenge) return this.CHALLENGE_QUESTION_COUNT;
    return this.DEFAULT_QUESTION_COUNT;
  }

  private resolveInitialDifficulty(mode: PracticeMode, requested: Difficulty): Difficulty {
    if (mode === PracticeMode.Challenge) return Difficulty.Challenge;
    if (mode === PracticeMode.Review) return Difficulty.Beginner;
    return requested;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ─── Question Bank (replace individual selectQuestions() with Prisma) ─────────
//
// Covers Grade 1–4 topics matching LESSON_CATALOG entries.
// ConceptTags must align with HINT_TEMPLATES and EXPLANATIONS keys in the
// ai/tutor engines so misconception-targeted hints work correctly.
//
// Difficulty spread per topic:
//   Beginner    — single-step, small numbers, familiar context
//   Intermediate — two-step or larger numbers
//   Advanced    — multi-step, requires two+ concepts
//   Challenge   — non-routine, explain your reasoning

const STUB_QUESTIONS: PracticeQuestion[] = [

  // ── Fraction Addition (G4) ─────────────────────────────────────────────────
  {
    id: "q-fa-01",
    lessonId: "lesson-fractions-add-intro",
    topicId: "g4-fractions-add",
    type: QuestionType.FillInBlank,
    prompt: "What is 1/4 + 2/4?",
    correctAnswer: "3/4",
    explanation: "The denominators are the same, so just add the numerators: 1 + 2 = 3. Answer: 3/4.",
    difficulty: Difficulty.Beginner,
    grade: Grade.G4,
    conceptTags: ["fraction-addition", "like-denominators"],
    xpReward: 10,
  },
  {
    id: "q-fa-02",
    lessonId: "lesson-fractions-add-intro",
    topicId: "g4-fractions-add",
    type: QuestionType.MultipleChoice,
    prompt: "What is 2/5 + 2/5?",
    options: ["4/10", "4/5", "4/25", "2/5"],
    correctAnswer: "4/5",
    explanation: "Same denominators — add numerators: 2 + 2 = 4. The denominator stays 5. Answer: 4/5.",
    difficulty: Difficulty.Beginner,
    grade: Grade.G4,
    conceptTags: ["fraction-addition", "like-denominators"],
    xpReward: 10,
  },
  {
    id: "q-fa-03",
    lessonId: "lesson-fractions-add-unlike",
    topicId: "g4-fractions-add",
    type: QuestionType.MultipleChoice,
    prompt: "What is 1/3 + 1/2?",
    options: ["2/5", "2/6", "5/6", "3/5"],
    correctAnswer: "5/6",
    explanation: "LCD of 3 and 2 is 6. Convert: 1/3 = 2/6, 1/2 = 3/6. Add: 2/6 + 3/6 = 5/6.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G4,
    conceptTags: ["fraction-addition", "unlike-denominators", "common-denominator"],
    xpReward: 10,
  },
  {
    id: "q-fa-04",
    lessonId: "lesson-fractions-add-unlike",
    topicId: "g4-fractions-add",
    type: QuestionType.FillInBlank,
    prompt: "What is 3/4 + 1/8?",
    correctAnswer: "7/8",
    explanation: "LCD of 4 and 8 is 8. Convert 3/4 to 6/8. Then 6/8 + 1/8 = 7/8.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G4,
    conceptTags: ["fraction-addition", "unlike-denominators", "common-denominator"],
    xpReward: 10,
  },
  {
    id: "q-fa-05",
    lessonId: "lesson-fractions-add-unlike",
    topicId: "g4-fractions-add",
    type: QuestionType.MultipleChoice,
    prompt: "A recipe needs 2/3 cup of flour and 1/6 cup of sugar. How much is that in total?",
    options: ["3/9", "3/6", "5/6", "1/2"],
    correctAnswer: "5/6",
    explanation: "LCD of 3 and 6 is 6. Convert 2/3 to 4/6. Then 4/6 + 1/6 = 5/6 cup.",
    difficulty: Difficulty.Advanced,
    grade: Grade.G4,
    conceptTags: ["fraction-addition", "unlike-denominators", "word-problem"],
    xpReward: 15,
  },

  // ── Fraction Subtraction (G4) ──────────────────────────────────────────────
  {
    id: "q-fs-01",
    lessonId: "lesson-fractions-sub",
    topicId: "g4-fractions-sub",
    type: QuestionType.FillInBlank,
    prompt: "What is 3/4 - 1/4?",
    correctAnswer: "2/4",
    explanation: "Same denominators — subtract numerators: 3 - 1 = 2. Answer: 2/4 (or simplified: 1/2).",
    difficulty: Difficulty.Beginner,
    grade: Grade.G4,
    conceptTags: ["fraction-subtraction", "like-denominators"],
    xpReward: 10,
  },
  {
    id: "q-fs-02",
    lessonId: "lesson-fractions-sub",
    topicId: "g4-fractions-sub",
    type: QuestionType.MultipleChoice,
    prompt: "What is 5/6 - 1/3?",
    options: ["4/3", "1/2", "2/3", "4/6"],
    correctAnswer: "1/2",
    explanation: "LCD of 6 and 3 is 6. Convert 1/3 to 2/6. Then 5/6 - 2/6 = 3/6 = 1/2.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G4,
    conceptTags: ["fraction-subtraction", "unlike-denominators", "common-denominator"],
    xpReward: 10,
  },
  {
    id: "q-fs-03",
    lessonId: "lesson-fractions-sub",
    topicId: "g4-fractions-sub",
    type: QuestionType.FillInBlank,
    prompt: "You had 7/8 of a pizza. You ate 3/8. How much is left?",
    correctAnswer: "4/8",
    explanation: "7/8 - 3/8 = 4/8. The denominators are the same so just subtract the tops.",
    difficulty: Difficulty.Beginner,
    grade: Grade.G4,
    conceptTags: ["fraction-subtraction", "like-denominators", "word-problem"],
    xpReward: 10,
  },

  // ── Multiplication (G3) ────────────────────────────────────────────────────
  {
    id: "q-mu-01",
    lessonId: "lesson-multiplication-intro",
    topicId: "g3-multiplication",
    type: QuestionType.FillInBlank,
    prompt: "What is 3 × 4?",
    correctAnswer: "12",
    explanation: "3 groups of 4: 4 + 4 + 4 = 12. Or picture a 3-row, 4-column array.",
    difficulty: Difficulty.Beginner,
    grade: Grade.G3,
    conceptTags: ["multiplication"],
    xpReward: 10,
  },
  {
    id: "q-mu-02",
    lessonId: "lesson-multiplication-intro",
    topicId: "g3-multiplication",
    type: QuestionType.MultipleChoice,
    prompt: "There are 6 bags with 7 apples each. How many apples in total?",
    options: ["13", "42", "36", "48"],
    correctAnswer: "42",
    explanation: "6 × 7 = 42. You can think of it as 6 groups of 7.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G3,
    conceptTags: ["multiplication", "word-problem"],
    xpReward: 10,
  },
  {
    id: "q-mu-03",
    lessonId: "lesson-multiplication-advanced",
    topicId: "g3-multiplication",
    type: QuestionType.FillInBlank,
    prompt: "What is 8 × 9?",
    correctAnswer: "72",
    explanation: "8 × 9 = 72. You can use 8 × 10 = 80 and subtract 8: 80 - 8 = 72.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G3,
    conceptTags: ["multiplication"],
    xpReward: 10,
  },
  {
    id: "q-mu-04",
    lessonId: "lesson-multiplication-advanced",
    topicId: "g3-multiplication",
    type: QuestionType.MultipleChoice,
    prompt: "A classroom has 4 rows of 9 desks. The teacher adds 2 more desks in a corner. How many desks total?",
    options: ["36", "38", "40", "34"],
    correctAnswer: "38",
    explanation: "4 × 9 = 36, then add 2 corner desks: 36 + 2 = 38.",
    difficulty: Difficulty.Advanced,
    grade: Grade.G3,
    conceptTags: ["multiplication", "addition", "word-problem"],
    xpReward: 15,
  },

  // ── Place Value (G3) ───────────────────────────────────────────────────────
  {
    id: "q-pv-01",
    lessonId: "lesson-place-value",
    topicId: "g3-place-value",
    type: QuestionType.MultipleChoice,
    prompt: "What is the value of the digit 5 in the number 352?",
    options: ["5", "50", "500", "5000"],
    correctAnswer: "50",
    explanation: "In 352, the digit 5 is in the tens place. 5 × 10 = 50.",
    difficulty: Difficulty.Beginner,
    grade: Grade.G3,
    conceptTags: ["place-value"],
    xpReward: 10,
  },
  {
    id: "q-pv-02",
    lessonId: "lesson-place-value",
    topicId: "g3-place-value",
    type: QuestionType.FillInBlank,
    prompt: "Write 400 + 60 + 7 as a single number.",
    correctAnswer: "467",
    explanation: "Hundreds column: 4 → 400. Tens column: 6 → 60. Ones: 7. Combined: 467.",
    difficulty: Difficulty.Beginner,
    grade: Grade.G3,
    conceptTags: ["place-value"],
    xpReward: 10,
  },
  {
    id: "q-pv-03",
    lessonId: "lesson-place-value",
    topicId: "g3-place-value",
    type: QuestionType.MultipleChoice,
    prompt: "Which number has a 3 in the hundreds place and a 7 in the ones place?",
    options: ["307", "370", "703", "730"],
    correctAnswer: "307",
    explanation: "Hundreds = 3, tens = 0, ones = 7 → 307.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G3,
    conceptTags: ["place-value"],
    xpReward: 10,
  },
  {
    id: "q-pv-04",
    lessonId: "lesson-place-value",
    topicId: "g3-place-value",
    type: QuestionType.FillInBlank,
    prompt: "What is 10 more than 489?",
    correctAnswer: "499",
    explanation: "Adding 10 increases the tens digit by 1: 489 + 10 = 499.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G3,
    conceptTags: ["place-value", "addition"],
    xpReward: 10,
  },

  // ── Subtraction with Regrouping (G3) ───────────────────────────────────────
  {
    id: "q-su-01",
    lessonId: "lesson-subtraction",
    topicId: "g3-subtraction",
    type: QuestionType.FillInBlank,
    prompt: "What is 82 - 47?",
    correctAnswer: "35",
    explanation: "2 - 7 needs regrouping: borrow 1 ten to make 12. 12 - 7 = 5. Then 7 - 4 = 3. Answer: 35.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G3,
    conceptTags: ["subtraction"],
    xpReward: 10,
  },
  {
    id: "q-su-02",
    lessonId: "lesson-subtraction",
    topicId: "g3-subtraction",
    type: QuestionType.MultipleChoice,
    prompt: "There were 100 students. 38 went home early. How many stayed?",
    options: ["72", "62", "68", "58"],
    correctAnswer: "62",
    explanation: "100 - 38 = 62. Subtract step by step: 100 - 30 = 70, then 70 - 8 = 62.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G3,
    conceptTags: ["subtraction", "word-problem"],
    xpReward: 10,
  },
  {
    id: "q-su-03",
    lessonId: "lesson-subtraction",
    topicId: "g3-subtraction",
    type: QuestionType.FillInBlank,
    prompt: "What is 403 - 158?",
    correctAnswer: "245",
    explanation: "403 - 158: Borrow as needed. 403 - 100 = 303, then 303 - 58 = 245.",
    difficulty: Difficulty.Advanced,
    grade: Grade.G3,
    conceptTags: ["subtraction"],
    xpReward: 15,
  },

  // ── Addition (G1) ──────────────────────────────────────────────────────────
  {
    id: "q-ad-01",
    lessonId: "lesson-addition-g1",
    topicId: "g1-addition",
    type: QuestionType.FillInBlank,
    prompt: "What is 5 + 3?",
    correctAnswer: "8",
    explanation: "Count on from 5: 6, 7, 8. So 5 + 3 = 8.",
    difficulty: Difficulty.Beginner,
    grade: Grade.G1,
    conceptTags: ["addition"],
    xpReward: 10,
  },
  {
    id: "q-ad-02",
    lessonId: "lesson-addition-g1",
    topicId: "g1-addition",
    type: QuestionType.MultipleChoice,
    prompt: "There are 4 red balls and 6 blue balls. How many balls altogether?",
    options: ["8", "9", "10", "11"],
    correctAnswer: "10",
    explanation: "4 + 6 = 10. This is a nice number bond to remember!",
    difficulty: Difficulty.Beginner,
    grade: Grade.G1,
    conceptTags: ["addition", "word-problem"],
    xpReward: 10,
  },
  {
    id: "q-ad-03",
    lessonId: "lesson-addition-g1",
    topicId: "g1-addition",
    type: QuestionType.FillInBlank,
    prompt: "What is 17 + 6?",
    correctAnswer: "23",
    explanation: "17 + 3 = 20 (bridge to 10), then 20 + 3 = 23.",
    difficulty: Difficulty.Intermediate,
    grade: Grade.G1,
    conceptTags: ["addition"],
    xpReward: 10,
  },

  // ── Challenge questions (cross-topic) ─────────────────────────────────────
  {
    id: "q-ch-01",
    lessonId: "lesson-fractions-add-unlike",
    topicId: "g4-fractions-add",
    type: QuestionType.MultipleChoice,
    prompt: "Mei walked 3/4 of a mile in the morning and 5/8 of a mile in the afternoon. How far did she walk altogether?",
    options: ["8/12", "11/8", "1 3/8", "8/8"],
    correctAnswer: "1 3/8",
    explanation: "LCD of 4 and 8 is 8. Convert 3/4 to 6/8. Then 6/8 + 5/8 = 11/8 = 1 3/8 miles.",
    difficulty: Difficulty.Challenge,
    grade: Grade.G4,
    conceptTags: ["fraction-addition", "unlike-denominators", "mixed-numbers", "word-problem"],
    xpReward: 20,
  },
  {
    id: "q-ch-02",
    lessonId: "lesson-multiplication-advanced",
    topicId: "g3-multiplication",
    type: QuestionType.FillInBlank,
    prompt: "A baker makes 9 trays of cookies. Each tray holds 8 cookies. She gives away 3 full trays. How many cookies does she have left?",
    correctAnswer: "48",
    explanation: "Total: 9 × 8 = 72. Given away: 3 × 8 = 24. Left: 72 - 24 = 48.",
    difficulty: Difficulty.Challenge,
    grade: Grade.G3,
    conceptTags: ["multiplication", "subtraction", "word-problem"],
    xpReward: 20,
  },
];

export const practiceGenerator = new PracticeGenerator();
