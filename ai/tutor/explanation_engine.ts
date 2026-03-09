/**
 * @module ai/tutor/explanation_engine
 *
 * Generates structured, step-by-step math explanations.
 *
 * HELP MODES HANDLED:
 *   explain_fully   — full worked solution with all steps
 *   teach_concept   — teach the underlying concept without solving
 *   similar_example — worked example with different (similar) numbers
 *
 * DESIGN RULES:
 *   - Always kid-friendly (no jargon without definition)
 *   - Steps are numbered and short (1–2 sentences each)
 *   - LaTeX for formulas (rendered by KaTeX on frontend)
 *   - Never just dumps the answer — insight precedes final result
 *   - Visual plan always returned for spatial concepts
 *
 * Template-based now; AI model wired in later for dynamic content.
 */

import {
  HelpMode,
  TutorContent,
  TutorStep,
  TutorExample,
  VisualPlanPayload,
  Grade,
} from "@/types";

export interface ExplanationRequest {
  topicId:       string;
  conceptTags:   string[];
  questionText:  string;
  helpMode:      HelpMode;
  grade:         Grade;
}

export interface ExplanationResult {
  content:      TutorContent;
  visualPlan?:  VisualPlanPayload;
  example?:     TutorExample;
}

// ─── Explanation Library ──────────────────────────────────────────────────────

interface ExplanationTemplate {
  conceptTitle:   string;
  conceptSummary: string;
  steps:          TutorStep[];
  keyInsight:     string;
  visualType:     VisualPlanPayload["diagramType"];
  similarExample: TutorExample;
}

const EXPLANATIONS: Record<string, ExplanationTemplate> = {
  "fraction-addition": {
    conceptTitle:   "Adding Fractions",
    conceptSummary: "To add fractions, the pieces must be the same size. We call this having a *common denominator*.",
    keyInsight:     "The denominator tells you the piece size. You can only add pieces of the same size!",
    visualType:     "fraction_bar",
    steps: [
      { stepNumber: 1, instruction: "Look at the denominators (bottom numbers). Are they the same?",                                             formula: undefined, visualCue: "compare denominators" },
      { stepNumber: 2, instruction: "If they are different, find the Lowest Common Denominator (LCD) — the smallest number both denominators divide into.", formula: "\\text{LCD}(a, b) = \\text{LCM}(a, b)",  visualCue: "find LCD" },
      { stepNumber: 3, instruction: "Convert each fraction to an equivalent fraction with the LCD as the new denominator.",                        formula: "\\frac{1}{2} = \\frac{3}{6}",              visualCue: "convert fractions" },
      { stepNumber: 4, instruction: "Now add the numerators (top numbers). The denominator stays the same.",                                      formula: "\\frac{a}{c} + \\frac{b}{c} = \\frac{a+b}{c}", visualCue: "add numerators" },
      { stepNumber: 5, instruction: "Simplify if possible by finding common factors in the numerator and denominator.",                           formula: undefined, visualCue: "simplify" },
    ],
    similarExample: {
      questionText: "What is 1/4 + 1/4?",
      workingSteps: [
        { stepNumber: 1, instruction: "The denominators are the same (both 4). No conversion needed!", formula: undefined },
        { stepNumber: 2, instruction: "Add the numerators: 1 + 1 = 2. Keep the denominator 4.",        formula: "\\frac{1}{4} + \\frac{1}{4} = \\frac{1+1}{4} = \\frac{2}{4}" },
        { stepNumber: 3, instruction: "Simplify: 2/4 = 1/2 (divide top and bottom by 2).",             formula: "\\frac{2}{4} = \\frac{1}{2}" },
      ],
      answer:     "1/2",
      keyInsight: "Same denominators? Just add the tops!",
    },
  },

  "multiplication": {
    conceptTitle:   "Multiplication",
    conceptSummary: "Multiplication is a fast way to add the same number many times. 3 × 4 = 4 + 4 + 4.",
    keyInsight:     "Multiplication counts equal groups. The × sign means 'groups of'.",
    visualType:     "array",
    steps: [
      { stepNumber: 1, instruction: "Identify the two factors (the numbers being multiplied).",                                    formula: "a \\times b",          visualCue: "identify factors" },
      { stepNumber: 2, instruction: "Think of the first factor as the number of groups, and the second as how many in each group.", formula: undefined,              visualCue: "groups of" },
      { stepNumber: 3, instruction: "Draw an array: rows = first factor, columns = second factor. Count all the dots.",            formula: undefined,              visualCue: "draw array" },
      { stepNumber: 4, instruction: "The total number of dots = the product.",                                                    formula: "a \\times b = \\text{product}", visualCue: "count total" },
    ],
    similarExample: {
      questionText: "What is 3 × 4?",
      workingSteps: [
        { stepNumber: 1, instruction: "3 groups of 4.",  formula: undefined },
        { stepNumber: 2, instruction: "4 + 4 + 4 = 12.", formula: "3 \\times 4 = 4 + 4 + 4 = 12" },
      ],
      answer:     "12",
      keyInsight: "3 groups of 4 is the same as adding 4 three times.",
    },
  },

  "place-value": {
    conceptTitle:   "Place Value",
    conceptSummary: "Every digit in a number has a *place* — and that place tells you its value.",
    keyInsight:     "A '3' in the hundreds column means 300, not 3!",
    visualType:     "place_value_chart",
    steps: [
      { stepNumber: 1, instruction: "Write your number in a place value chart: Hundreds | Tens | Ones.",  formula: undefined,                           visualCue: "place value chart" },
      { stepNumber: 2, instruction: "The value of each digit = digit × place value.",                     formula: "\\text{value} = \\text{digit} \\times \\text{place}", visualCue: "calculate value" },
      { stepNumber: 3, instruction: "Add all the place values together to verify the number.",             formula: "100a + 10b + c",                    visualCue: "add place values" },
    ],
    similarExample: {
      questionText: "What is the value of 3 in 356?",
      workingSteps: [
        { stepNumber: 1, instruction: "356: 3 is in the hundreds column.",      formula: undefined },
        { stepNumber: 2, instruction: "3 × 100 = 300.",                         formula: "3 \\times 100 = 300" },
      ],
      answer:     "300",
      keyInsight: "The hundreds column multiplies your digit by 100.",
    },
  },

  "default": {
    conceptTitle:   "Problem Solving",
    conceptSummary: "Every math problem can be solved by breaking it into smaller steps.",
    keyInsight:     "Read → Identify → Plan → Calculate → Check",
    visualType:     "none",
    steps: [
      { stepNumber: 1, instruction: "Read the question carefully. What is it asking for?",         formula: undefined, visualCue: "read" },
      { stepNumber: 2, instruction: "Identify what you know (given information).",                 formula: undefined, visualCue: "given" },
      { stepNumber: 3, instruction: "Choose the right operation (+, −, ×, ÷).",                   formula: undefined, visualCue: "operation" },
      { stepNumber: 4, instruction: "Calculate step by step.",                                     formula: undefined, visualCue: "calculate" },
      { stepNumber: 5, instruction: "Check: does your answer make sense?",                         formula: undefined, visualCue: "check" },
    ],
    similarExample: {
      questionText: "If you have 8 apples and eat 3, how many are left?",
      workingSteps: [
        { stepNumber: 1, instruction: "We start with 8 and lose 3 → subtraction.",  formula: undefined },
        { stepNumber: 2, instruction: "8 − 3 = 5.",                                 formula: "8 - 3 = 5" },
      ],
      answer:     "5",
      keyInsight: "Losing things = subtraction.",
    },
  },
};

// ─── Engine ────────────────────────────────────────────────────────────────────

export class ExplanationEngine {
  /**
   * Generates a structured explanation based on help mode.
   */
  generate(request: ExplanationRequest): ExplanationResult {
    const template = this.findTemplate(request.conceptTags);

    if (request.helpMode === HelpMode.TeachConcept) {
      return this.teachConcept(template);
    }

    if (request.helpMode === HelpMode.SimilarExample) {
      return this.similarExample(template);
    }

    // Default: full explanation
    return this.fullExplanation(template);
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private findTemplate(conceptTags: string[]): ExplanationTemplate {
    const mapping: Record<string, string> = {
      "fraction-addition":    "fraction-addition",
      "fraction-subtraction": "fraction-addition",
      "unlike-denominators":  "fraction-addition",
      "multiplication":       "multiplication",
      "times-tables":         "multiplication",
      "place-value":          "place-value",
    };

    for (const tag of conceptTags) {
      const key = mapping[tag];
      if (key && EXPLANATIONS[key]) return EXPLANATIONS[key]!;
    }
    return EXPLANATIONS["default"]!;
  }

  private fullExplanation(t: ExplanationTemplate): ExplanationResult {
    return {
      content: {
        text:    `Here's how to solve this step by step. ${t.keyInsight}`,
        steps:   t.steps,
        concept: t.conceptTitle,
      },
      visualPlan: t.visualType !== "none"
        ? { diagramType: t.visualType, data: {}, caption: `Visual: ${t.conceptTitle}` }
        : undefined,
    };
  }

  private teachConcept(t: ExplanationTemplate): ExplanationResult {
    return {
      content: {
        text:    t.conceptSummary,
        concept: t.conceptTitle,
        steps:   t.steps.slice(0, 2),   // Just the core idea, not the full worked solution
      },
      visualPlan: t.visualType !== "none"
        ? { diagramType: t.visualType, data: {}, caption: t.conceptTitle }
        : undefined,
    };
  }

  private similarExample(t: ExplanationTemplate): ExplanationResult {
    return {
      content: {
        text:  `Here's a similar example to help you see how it works. After you read it, try your original question again!`,
        steps: t.similarExample.workingSteps,
      },
      example: t.similarExample,
    };
  }
}

export const explanationEngine = new ExplanationEngine();
