/**
 * @module ai/tutor/misconception_engine
 *
 * Detects common mathematical misconceptions from a student's incorrect answer.
 *
 * APPROACH:
 *   1. Fast pattern matching against MISCONCEPTION_LIBRARY (no AI needed)
 *   2. Falls back to heuristic classification by concept tag
 *   3. Returns the most likely misconception with a confidence score
 *
 * A misconception is a SYSTEMATIC error pattern — not a random slip.
 * The result is used by hint_engine to craft targeted corrections.
 *
 * CATEGORIES (from MisconceptionCategory enum):
 *   wrong_operation          — added instead of multiplied, etc.
 *   sign_error               — wrong sign in result
 *   place_value_confusion    — off by factor of 10/100/1000
 *   fraction_misunderstanding — adds numerators AND denominators
 *   skipped_step             — jumped to answer, missing intermediate work
 *   careless_error           — arithmetic slip, not conceptual
 *   conceptual_gap           — fundamentally missing the concept
 *   none                     — answer is correct
 */

import { MisconceptionCategory } from "@/types";

export interface MisconceptionResult {
  category:         MisconceptionCategory;
  name:             string;
  description:      string;
  confidence:       number;           // 0.0–1.0
  remediation:      string;           // what to address in the hint
  addressInHint:    string;           // 1–2 sentence fragment for the hint engine
}

// ─── Pattern Library ───────────────────────────────────────────────────────────

interface MisconceptionPattern {
  id:          string;
  category:    MisconceptionCategory;
  name:        string;
  description: string;
  remediation: string;
  conceptTags: string[];    // topic tags this pattern applies to
  detect: (opts: DetectOpts) => number;  // returns confidence 0–1
}

interface DetectOpts {
  questionText:  string;
  studentAnswer: string;
  correctAnswer: string;
  conceptTags:   string[];
}

const PATTERNS: MisconceptionPattern[] = [
  // ── Fractions ────────────────────────────────────────────────────────────────
  {
    id:          "frac-add-both",
    category:    MisconceptionCategory.FractionMisunderstanding,
    name:        "Add Numerators AND Denominators",
    description: "Student adds both numerators and both denominators separately (1/2 + 1/3 = 2/5)",
    remediation: "Denominators tell us the size of each piece. You must find a common piece size first.",
    conceptTags: ["fraction-addition", "fraction-subtraction"],
    detect({ questionText, studentAnswer }) {
      const m = questionText.match(/(\d+)\/(\d+)\s*[+]\s*(\d+)\/(\d+)/);
      if (!m) return 0;
      const [, n1, d1, n2, d2] = m.map(Number);
      const wrongNum = (n1 ?? 0) + (n2 ?? 0);
      const wrongDen = (d1 ?? 0) + (d2 ?? 0);
      return studentAnswer === `${wrongNum}/${wrongDen}` ? 0.95 : 0;
    },
  },
  {
    id:          "frac-ignore-denom",
    category:    MisconceptionCategory.FractionMisunderstanding,
    name:        "Ignore Denominator",
    description: "Student only adds numerators, keeping one denominator unchanged",
    remediation: "Both numerators change when you find a common denominator.",
    conceptTags: ["fraction-addition", "unlike-denominators"],
    detect({ questionText, studentAnswer }) {
      const m = questionText.match(/(\d+)\/(\d+)\s*[+]\s*(\d+)\/(\d+)/);
      if (!m) return 0;
      const [, n1, d1, n2, d2] = m.map(Number);
      // Wrong: just add numerators, keep first denominator
      if (studentAnswer === `${(n1 ?? 0) + (n2 ?? 0)}/${d1}`) return 0.85;
      if (studentAnswer === `${(n1 ?? 0) + (n2 ?? 0)}/${d2}`) return 0.85;
      return 0;
    },
  },
  // ── Place Value ──────────────────────────────────────────────────────────────
  {
    id:          "pv-off-by-10",
    category:    MisconceptionCategory.PlaceValueConfusion,
    name:        "Off by Factor of 10",
    description: "Student answer is 10x or 1/10 of the correct answer",
    remediation: "Check which place value column you're working in.",
    conceptTags: ["place-value", "multiplication", "addition"],
    detect({ studentAnswer, correctAnswer }) {
      const s = parseFloat(studentAnswer);
      const c = parseFloat(correctAnswer);
      if (isNaN(s) || isNaN(c) || c === 0) return 0;
      const ratio = s / c;
      if (Math.abs(ratio - 10) < 0.01 || Math.abs(ratio - 0.1) < 0.001) return 0.85;
      if (Math.abs(ratio - 100) < 0.01 || Math.abs(ratio - 0.01) < 0.001) return 0.80;
      return 0;
    },
  },
  // ── Sign Errors ──────────────────────────────────────────────────────────────
  {
    id:          "sign-flip",
    category:    MisconceptionCategory.SignError,
    name:        "Sign Flip",
    description: "Student got the correct magnitude but wrong sign",
    remediation: "Check whether the result should be positive or negative.",
    conceptTags: ["subtraction", "negative-numbers", "integers"],
    detect({ studentAnswer, correctAnswer }) {
      const s = parseFloat(studentAnswer);
      const c = parseFloat(correctAnswer);
      if (isNaN(s) || isNaN(c)) return 0;
      return s === -c ? 0.9 : 0;
    },
  },
  // ── Wrong Operation ──────────────────────────────────────────────────────────
  {
    id:          "add-instead-of-multiply",
    category:    MisconceptionCategory.WrongOperation,
    name:        "Added Instead of Multiplied",
    description: "Student added two numbers that should have been multiplied",
    remediation: "Look for the multiplication sign (×). Adding gives a smaller result.",
    conceptTags: ["multiplication", "times-tables"],
    detect({ questionText, studentAnswer, correctAnswer }) {
      const nums = (questionText.match(/\d+/g) ?? []).map(Number).slice(0, 2);
      if (nums.length < 2) return 0;
      const [a, b] = nums as [number, number];
      const s = parseFloat(studentAnswer);
      const c = parseFloat(correctAnswer);
      if (isNaN(s) || isNaN(c)) return 0;
      // Student added but should have multiplied
      if (Math.abs(s - (a + b)) < 0.001 && Math.abs(c - a * b) < 0.001) return 0.85;
      return 0;
    },
  },
  {
    id:          "multiply-instead-of-add",
    category:    MisconceptionCategory.WrongOperation,
    name:        "Multiplied Instead of Added",
    description: "Student multiplied two numbers that should have been added",
    remediation: "Look for the addition sign (+). Multiplying gives a larger result.",
    conceptTags: ["addition", "operations"],
    detect({ questionText, studentAnswer, correctAnswer }) {
      const nums = (questionText.match(/\d+/g) ?? []).map(Number).slice(0, 2);
      if (nums.length < 2) return 0;
      const [a, b] = nums as [number, number];
      const s = parseFloat(studentAnswer);
      const c = parseFloat(correctAnswer);
      if (isNaN(s) || isNaN(c)) return 0;
      if (Math.abs(s - a * b) < 0.001 && Math.abs(c - (a + b)) < 0.001) return 0.85;
      return 0;
    },
  },
];

// ─── Engine ────────────────────────────────────────────────────────────────────

export class MisconceptionEngine {
  /**
   * Detects the most likely misconception from a student's wrong answer.
   * Returns null if the answer is correct or no pattern matches with confidence > 0.5.
   */
  detect(opts: {
    questionText:  string;
    studentAnswer: string;
    correctAnswer: string;
    conceptTags:   string[];
  }): MisconceptionResult | null {
    const { questionText, studentAnswer, correctAnswer, conceptTags } = opts;

    // Don't run on correct answers
    const norm = (s: string) => s.trim().toLowerCase();
    if (norm(studentAnswer) === norm(correctAnswer)) return null;

    // Try all patterns; keep the highest confidence match
    let bestMatch: { pattern: MisconceptionPattern; confidence: number } | null = null;

    for (const pattern of PATTERNS) {
      const confidence = pattern.detect({ questionText, studentAnswer, correctAnswer, conceptTags });
      if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { pattern, confidence };
      }
    }

    if (!bestMatch) {
      // Fallback: classify by concept tag if no specific pattern matched
      return this.fallbackClassify(conceptTags);
    }

    const { pattern, confidence } = bestMatch;
    return {
      category:      pattern.category,
      name:          pattern.name,
      description:   pattern.description,
      confidence,
      remediation:   pattern.remediation,
      addressInHint: `It looks like ${pattern.description.toLowerCase()}. ${pattern.remediation}`,
    };
  }

  /** Maps a MisconceptionResult to a short tag string for storage. */
  toTag(result: MisconceptionResult | null): string {
    return result?.category ?? MisconceptionCategory.None;
  }

  private fallbackClassify(conceptTags: string[]): MisconceptionResult {
    // Use concept tags to pick the most likely category
    if (conceptTags.some((t) => t.includes("fraction"))) {
      return this.makeResult(
        MisconceptionCategory.FractionMisunderstanding,
        "Fraction Concept Error",
        "The student may have a gap in understanding how fractions work.",
        "Remember: the denominator tells you how many equal parts the whole is split into.",
        0.55
      );
    }
    if (conceptTags.some((t) => t.includes("place-value"))) {
      return this.makeResult(
        MisconceptionCategory.PlaceValueConfusion,
        "Place Value Error",
        "The student may have confused the value of a digit by its position.",
        "Each column in a number has a different value: ones, tens, hundreds.",
        0.55
      );
    }
    return this.makeResult(
      MisconceptionCategory.CarelessError,
      "Arithmetic Slip",
      "The student made a calculation error not tied to a specific misconception.",
      "Double-check your arithmetic step by step.",
      0.5
    );
  }

  private makeResult(
    category: MisconceptionCategory,
    name: string,
    description: string,
    remediation: string,
    confidence: number
  ): MisconceptionResult {
    return {
      category,
      name,
      description,
      confidence,
      remediation,
      addressInHint: remediation,
    };
  }
}

export const misconceptionEngine = new MisconceptionEngine();
