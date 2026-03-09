/**
 * @module ai/tutor/hint_engine
 *
 * Generates progressive, scaffolded hints for math problems.
 *
 * HINT LEVELS (controlled by HelpMode):
 *   hint_1 (HelpMode.Hint1)   — Gentle nudge. Related concept, no answer clues.
 *   hint_2 (HelpMode.Hint2)   — Bigger clue. Points at the operation or step.
 *   next_step (HelpMode.NextStep) — What to do next, not the full answer.
 *
 * DESIGN RULES:
 *   - All hints are encouraging and child-friendly
 *   - Misconception-aware: if detected, hint addresses it directly
 *   - Hints NEVER reveal the final answer — that's ExplanationEngine's job
 *   - Visual plan included when the concept benefits from a diagram
 *
 * This engine uses template-based responses rather than calling the AI model
 * for now, which makes it fast and consistent. The AI model can be introduced
 * for Hint 3 / next_step when subtlety matters.
 */

import { HelpMode, TutorContent, VisualPlanPayload, Grade, Difficulty } from "@/types";
import { MisconceptionResult } from "./misconception_engine";

export interface HintRequest {
  topicId:        string;
  conceptTags:    string[];
  questionText:   string;
  studentAnswer?: string;
  helpMode:       HelpMode;
  hintsUsed:      number;
  grade:          Grade;
  misconception?: MisconceptionResult;
}

export interface HintResult {
  content:     TutorContent;
  visualPlan?: VisualPlanPayload;
}

// ─── Hint Templates ────────────────────────────────────────────────────────────
// Keyed by [conceptArea][hintLevel]

type HintLevel = 1 | 2 | 3;

interface HintTemplate {
  hint1:    string;
  hint2:    string;
  nextStep: string;
  concept:  string;
  visual?:  VisualPlanPayload["diagramType"];
}

const HINT_TEMPLATES: Record<string, HintTemplate> = {
  "fraction-addition": {
    hint1:    "Think about what the denominator tells you. Does it tell you *how many pieces* the whole is cut into?",
    hint2:    "Before you add fractions, both fractions need to show the same size piece. What's the smallest number that both denominators divide into evenly?",
    nextStep: "Find the LCD of the denominators, then convert each fraction so they have the same denominator. After that, just add the top numbers.",
    concept:  "Adding fractions means adding pieces of the same size. First, make the pieces the same size.",
    visual:   "fraction_bar",
  },
  "fraction-subtraction": {
    hint1:    "Remember: you can only subtract fractions when they show the same size pieces.",
    hint2:    "Look at both denominators. Can you find a number that both of them divide into evenly?",
    nextStep: "Convert both fractions to the same denominator, then subtract the numerators. The denominator stays the same.",
    concept:  "Subtracting fractions requires the same denominator — think of it like subtracting slices of the same-size pizza.",
    visual:   "fraction_bar",
  },
  "multiplication": {
    hint1:    "Multiplication is a shortcut for adding the same number many times. What does × mean here?",
    hint2:    "Try drawing an array (rows and columns). How many rows? How many in each row?",
    nextStep: "Count the total objects in your array, or use your times table. How many groups of how many?",
    concept:  "Multiplication counts equal groups — 3 × 4 means 3 groups of 4.",
    visual:   "array",
  },
  "place-value": {
    hint1:    "Each digit in a number has a different value depending on its position. Which column is this digit in?",
    hint2:    "Try a place value chart: write the number in ones, tens, and hundreds columns. What value does that digit represent?",
    nextStep: "Add the value of each column separately, then combine. Remember: 10 ones = 1 ten, 10 tens = 1 hundred.",
    concept:  "The position of a digit tells you its value — 5 in the tens column means 50, not 5.",
    visual:   "place_value_chart",
  },
  "subtraction": {
    hint1:    "Subtraction means finding the difference between two numbers. Which is bigger?",
    hint2:    "Try counting up from the smaller number to the bigger one — that gap is your answer.",
    nextStep: "Line up the numbers by place value. Subtract column by column from right to left. Remember to borrow when needed.",
    concept:  "Subtraction finds the difference. Always start from the ones column.",
    visual:   "number_line",
  },
  "addition": {
    hint1:    "Addition means joining two groups. How many total?",
    hint2:    "Try a number line — start at the first number and jump forward the second number of steps.",
    nextStep: "Add column by column from right to left. If a column adds up to 10 or more, carry the extra tens to the next column.",
    concept:  "Addition joins amounts together. Line up by place value.",
    visual:   "number_line",
  },
  "default": {
    hint1:    "Read the question again carefully. What is it asking you to find?",
    hint2:    "Break it into smaller steps. What do you know? What do you need to find?",
    nextStep: "Write out the operation step by step. What comes first? What comes next?",
    concept:  "Every math problem has a plan. Read carefully, write out your steps.",
    visual:   "none",
  },
};

// ─── Engine ────────────────────────────────────────────────────────────────────

export class HintEngine {
  /**
   * Generates a hint at the level appropriate for the help mode.
   * Returns structured content the frontend can render directly.
   */
  generate(request: HintRequest): HintResult {
    const template = this.findTemplate(request.conceptTags);
    const level    = this.helpModeToLevel(request.helpMode);

    // If a misconception was detected, prepend a targeted correction
    let text = this.getText(template, level);
    if (request.misconception && request.misconception.confidence > 0.6) {
      text = `${request.misconception.addressInHint} ${text}`;
    }

    const content: TutorContent = {
      text,
      concept: level === 3 ? template.concept : undefined,
    };

    const visualPlan = template.visual && template.visual !== "none"
      ? this.buildVisualPlan(template.visual, request)
      : undefined;

    return { content, visualPlan };
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private findTemplate(conceptTags: string[]): HintTemplate {
    // Map concept tags to template keys
    const mapping: Record<string, string> = {
      "fraction-addition":    "fraction-addition",
      "fraction-subtraction": "fraction-subtraction",
      "unlike-denominators":  "fraction-addition",
      "like-denominators":    "fraction-addition",
      "multiplication":       "multiplication",
      "times-tables":         "multiplication",
      "place-value":          "place-value",
      "subtraction":          "subtraction",
      "addition":             "addition",
    };

    for (const tag of conceptTags) {
      const key = mapping[tag];
      if (key && HINT_TEMPLATES[key]) return HINT_TEMPLATES[key]!;
    }

    return HINT_TEMPLATES["default"]!;
  }

  private helpModeToLevel(mode: HelpMode): HintLevel {
    if (mode === HelpMode.Hint1)    return 1;
    if (mode === HelpMode.Hint2)    return 2;
    if (mode === HelpMode.NextStep) return 3;
    return 1;
  }

  private getText(template: HintTemplate, level: HintLevel): string {
    if (level === 1) return template.hint1;
    if (level === 2) return template.hint2;
    return template.nextStep;
  }

  private buildVisualPlan(
    type: VisualPlanPayload["diagramType"],
    request: HintRequest
  ): VisualPlanPayload {
    const captions: Record<string, string> = {
      fraction_bar:      "Use this fraction bar to visualise the pieces",
      number_line:       "Try using the number line to count up",
      array:             "Draw an array to see the multiplication",
      place_value_chart: "Write each digit in the right column",
    };

    return {
      diagramType: type,
      data:        { topicId: request.topicId, conceptTags: request.conceptTags },
      caption:     captions[type] ?? "Use this diagram to help you think through the problem",
    };
  }
}

export const hintEngine = new HintEngine();
