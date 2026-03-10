/**
 * Mock responses for the full practice session flow:
 *   POST /api/practice/start      → MOCK_SESSION_START
 *   POST /api/practice/submit     → MOCK_SUBMIT_CORRECT / MOCK_SUBMIT_WRONG / MOCK_SESSION_COMPLETE
 *   POST /api/practice/hint       → MOCK_HINT_RESPONSE
 *   POST /api/practice/explanation → MOCK_EXPLANATION_RESPONSE
 * Screen: /practice
 */

import type {
  PracticeSession,
  SubmissionResult,
  TutorResponse,
  SessionSummary,
} from "@mathai/shared-types";

// ── Practice Start ─────────────────────────────────────────────────────────────

export const MOCK_SESSION_START: PracticeSession = {
  sessionId:      "session-1741478400000-abc123",
  topicId:        "g4-fractions-add",
  mode:           "topic_practice",
  totalQuestions: 10,
  currentIndex:   0,
  xpEarned:       0,
  currentQuestion: {
    id:         "q-fa-01",
    type:       "fill_in_blank",
    prompt:     "What is 1/4 + 2/4?",
    difficulty: "beginner",
    xpReward:   10,
  },
};

// ── Submit Answer — Correct ────────────────────────────────────────────────────

export const MOCK_SUBMIT_CORRECT: SubmissionResult = {
  isCorrect:     true,
  correctAnswer: "3/4",
  xpEarned:      10,
  encouragement: "Brilliant! You nailed it first try!",
  nextAction:    "next_question",
  nextQuestion: {
    id:         "q-fa-02",
    type:       "multiple_choice",
    prompt:     "What is 2/5 + 2/5?",
    options:    ["4/10", "4/5", "4/25", "2/5"],
    difficulty: "beginner",
    xpReward:   10,
  },
};

// ── Submit Answer — Wrong (misconception detected) ─────────────────────────────

export const MOCK_SUBMIT_WRONG: SubmissionResult = {
  isCorrect:        false,
  correctAnswer:    "5/6",
  xpEarned:         0,
  encouragement:    "Great try! Fractions can be tricky. Here's a clue.",
  misconceptionTag: "fraction_misunderstanding",
  nextAction:       "retry",
};

// ── Submit Answer — Session Complete ──────────────────────────────────────────

export const MOCK_SESSION_COMPLETE: SubmissionResult = {
  isCorrect:      true,
  correctAnswer:  "7/8",
  xpEarned:       10,
  encouragement:  "You're on fire today!",
  nextAction:     "session_complete",
  masteryUpdate: {
    topicId:  "g4-fractions-add",
    newLevel: "developing",
  },
  questUpdate: {
    questId:   "dq-correct-5-1741478400000",
    completed: true,
    newCount:  5,
  },
  sessionComplete: {
    sessionId:      "session-1741478400000-abc123",
    totalQuestions: 10,
    correctCount:   8,
    accuracyPct:    80,
    xpEarned:       80,
    badgesEarned:   [
      {
        id:          "badge-streak-3",
        name:        "3-Day Streak!",
        description: "Practiced 3 days in a row!",
        iconUrl:     "/badges/streak-3.svg",
        category:    "streak",
        xpBonus:     10,
        earnedAt:    "2026-03-09T14:00:00Z",
      },
    ],
    masteryUpdate: {
      topicId:  "g4-fractions-add",
      newLevel: "developing",
    },
  },
};

// ── Level Up (can be nested in any SubmissionResult) ──────────────────────────

export const MOCK_LEVEL_UP_RESULT: SubmissionResult = {
  ...MOCK_SUBMIT_CORRECT,
  levelUp: {
    newLevel: 3,
    newTitle: "Fraction Fighter",
  },
};

// ── Hint Response ─────────────────────────────────────────────────────────────

export const MOCK_HINT_1: TutorResponse = {
  helpMode:      "hint_1",
  encouragement: "Almost there! Let's think about this together.",
  content: {
    text: "Think about what the denominator tells you. Does it tell you *how many pieces* the whole is cut into?",
  },
};

export const MOCK_HINT_2: TutorResponse = {
  helpMode:      "hint_2",
  encouragement: "Still working through it — that's the spirit!",
  content: {
    text: "Before you add fractions, both fractions need to show the same size piece. What's the smallest number that both denominators divide into evenly?",
  },
  visualPlan: {
    diagramType: "fraction_bar",
    data: {
      fractions: [
        { numerator: 1, denominator: 3, label: "1/3" },
        { numerator: 1, denominator: 2, label: "1/2" },
      ],
    },
  },
};

export const MOCK_NEXT_STEP: TutorResponse = {
  helpMode:      "next_step",
  encouragement: "No worries, this is tricky! Let me point you a bit further.",
  content: {
    text: "Find the LCD of the denominators, then convert each fraction so they have the same denominator. After that, just add the top numbers.",
  },
  visualPlan: {
    diagramType: "fraction_bar",
    data: {
      fractions: [
        { numerator: 1, denominator: 3, label: "1/3" },
        { numerator: 1, denominator: 2, label: "1/2" },
        { numerator: 2, denominator: 6, label: "2/6", color: "#10b981" },
        { numerator: 3, denominator: 6, label: "3/6", color: "#f59e0b" },
      ],
    },
  },
};

// ── Explanation Response ──────────────────────────────────────────────────────

export const MOCK_EXPLANATION_FULL: TutorResponse = {
  helpMode:      "explain_fully",
  encouragement: "Let me walk you through this step by step!",
  content: {
    text: "Adding fractions with different denominators needs a common denominator first.",
    steps: [
      {
        stepNumber:  1,
        instruction: "Find the LCD (Lowest Common Denominator) of 3 and 2.",
        formula:     "\\text{LCD}(3, 2) = 6",
        visualCue:   "Think: what's the first number both 3 and 2 count up to?",
      },
      {
        stepNumber:  2,
        instruction: "Convert 1/3 so it has a denominator of 6.",
        formula:     "\\frac{1}{3} = \\frac{1 \\times 2}{3 \\times 2} = \\frac{2}{6}",
      },
      {
        stepNumber:  3,
        instruction: "Convert 1/2 so it has a denominator of 6.",
        formula:     "\\frac{1}{2} = \\frac{1 \\times 3}{2 \\times 3} = \\frac{3}{6}",
      },
      {
        stepNumber:  4,
        instruction: "Now add the numerators. The denominator stays the same.",
        formula:     "\\frac{2}{6} + \\frac{3}{6} = \\frac{2+3}{6} = \\frac{5}{6}",
      },
      {
        stepNumber:  5,
        instruction: "Check: can we simplify 5/6? No — 5 and 6 share no common factors.",
        formula:     "\\frac{5}{6} \\text{ is already in simplest form.}",
      },
    ],
  },
  visualPlan: {
    diagramType: "fraction_bar",
    data: {
      fractions: [
        { numerator: 1, denominator: 3, label: "1/3" },
        { numerator: 1, denominator: 2, label: "1/2" },
        { numerator: 2, denominator: 6, label: "2/6", color: "#10b981" },
        { numerator: 3, denominator: 6, label: "3/6", color: "#f59e0b" },
      ],
    },
  },
};

export const MOCK_SIMILAR_EXAMPLE: TutorResponse = {
  helpMode:      "similar_example",
  encouragement: "Here's another one just like it, so you can see the steps.",
  content: {
    text: "Let's work through a similar problem: 1/4 + 1/2.",
  },
  similarExample: {
    questionText: "What is 1/4 + 1/2?",
    workingSteps: [
      {
        stepNumber:  1,
        instruction: "LCD of 4 and 2 is 4 (4 is already a multiple of 2).",
        formula:     "\\text{LCD}(4, 2) = 4",
      },
      {
        stepNumber:  2,
        instruction: "1/4 stays as 1/4. Convert 1/2 to have denominator 4.",
        formula:     "\\frac{1}{2} = \\frac{2}{4}",
      },
      {
        stepNumber:  3,
        instruction: "Add the fractions.",
        formula:     "\\frac{1}{4} + \\frac{2}{4} = \\frac{3}{4}",
      },
    ],
    answer:     "3/4",
    keyInsight: "When one denominator is a multiple of the other, the bigger one IS the LCD.",
  },
};
