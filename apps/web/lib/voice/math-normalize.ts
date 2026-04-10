/**
 * @module lib/voice/math-normalize
 *
 * Converts spoken elementary math into structured text.
 *
 * Designed for children up to Grade 5. Handles:
 *   - Number words ("twenty five" → "25")
 *   - Operation words ("plus" → "+", "minus" → "−", "times" → "×", "divided by" → "÷")
 *   - Decimal speech ("three point five" → "3.5")
 *   - Fraction speech ("one half" → "1/2")
 *   - Mixed speech ("2 plus three" → "2 + 3")
 *
 * Does NOT attempt:
 *   - Algebra ("x plus three")
 *   - Advanced notation
 *   - Multi-step expressions with parentheses
 *
 * Always returns a human-readable string that the student can verify.
 */

// ─── Number word → digit mapping ────────────────────────────────────────────

const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

// ─── Operation word → symbol mapping ────────────────────────────────────────

const OPERATIONS: [RegExp, string][] = [
  [/\bdivided\s+by\b/gi,   " ÷ "],
  [/\btimes\b/gi,           " × "],
  [/\bmultiplied\s+by\b/gi, " × "],
  [/\bplus\b/gi,            " + "],
  [/\badd\b/gi,             " + "],
  [/\bminus\b/gi,           " − "],
  [/\bsubtract\b/gi,        " − "],
  [/\btake\s+away\b/gi,     " − "],
  [/\bequals?\b/gi,         " = "],
  [/\bis\b/gi,              " = "],    // "two plus three is five"
];

// ─── Fraction words ─────────────────────────────────────────────────────────

const FRACTION_WORDS: [RegExp, string][] = [
  [/\bone\s+half\b/gi,       "1/2"],
  [/\ba\s+half\b/gi,         "1/2"],
  [/\bone\s+third\b/gi,      "1/3"],
  [/\btwo\s+thirds?\b/gi,    "2/3"],
  [/\bone\s+quarter\b/gi,    "1/4"],
  [/\ba\s+quarter\b/gi,      "1/4"],
  [/\bthree\s+quarters?\b/gi,"3/4"],
  [/\bone\s+fourth\b/gi,     "1/4"],
  [/\btwo\s+fourths?\b/gi,   "2/4"],
  [/\bthree\s+fourths?\b/gi, "3/4"],
  [/\bone\s+fifth\b/gi,      "1/5"],
  [/\bone\s+sixth\b/gi,      "1/6"],
  [/\bone\s+eighth\b/gi,     "1/8"],
  [/\bone\s+tenth\b/gi,      "1/10"],
];

// ─── Main normalization function ────────────────────────────────────────────

/**
 * Normalize spoken math transcript into a clean written expression.
 *
 * @param transcript — raw STT output (e.g. "twenty five plus three")
 * @returns normalized math string (e.g. "25 + 3")
 */
export function normalizeMath(transcript: string): string {
  let text = transcript.toLowerCase().trim();

  // 1. Replace fraction words first (before number words consume them)
  for (const [pattern, replacement] of FRACTION_WORDS) {
    text = text.replace(pattern, replacement);
  }

  // 2. Replace "point" for decimals (e.g. "three point five" → "3.5")
  text = text.replace(
    /(\b\w+)\s+point\s+(\w+)/gi,
    (_match, left: string, right: string) => {
      const leftNum  = wordToNumber(left);
      const rightNum = wordToNumber(right);
      if (leftNum !== null && rightNum !== null) {
        return `${leftNum}.${rightNum}`;
      }
      return _match;
    },
  );

  // 3. Replace compound number words (e.g. "twenty five" → "25")
  text = replaceCompoundNumbers(text);

  // 4. Replace single number words (e.g. "three" → "3")
  text = replaceSingleNumbers(text);

  // 5. Replace operation words (e.g. "plus" → "+")
  for (const [pattern, replacement] of OPERATIONS) {
    text = text.replace(pattern, replacement);
  }

  // 6. Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  // 7. Remove trailing "=" if it's just "is" at the end with nothing after
  text = text.replace(/\s*=\s*$/, "");

  return text;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a single number word to its digit value (or null if not a number). */
function wordToNumber(word: string): number | null {
  const w = word.toLowerCase().trim();
  if (w in ONES) return ONES[w]!;
  if (w in TENS) return TENS[w]!;
  // Already a digit?
  const num = parseFloat(w);
  if (!isNaN(num)) return num;
  return null;
}

/** Replace compound number words like "twenty five" → "25". */
function replaceCompoundNumbers(text: string): string {
  const tensPattern = Object.keys(TENS).join("|");
  const onesPattern = Object.keys(ONES)
    .filter((w) => ONES[w]! >= 1 && ONES[w]! <= 9)
    .join("|");

  // Match "twenty five", "thirty one", etc.
  const regex = new RegExp(
    `\\b(${tensPattern})\\s+(${onesPattern})\\b`,
    "gi",
  );

  return text.replace(regex, (_match, tensWord: string, onesWord: string) => {
    const t = TENS[tensWord.toLowerCase()] ?? 0;
    const o = ONES[onesWord.toLowerCase()] ?? 0;
    return String(t + o);
  });
}

/** Replace single number words with digits. */
function replaceSingleNumbers(text: string): string {
  // Tens first (so "twenty" → 20 before we look at single-digit words)
  for (const [word, value] of Object.entries(TENS)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, "gi"), String(value));
  }
  // Then ones/teens
  for (const [word, value] of Object.entries(ONES)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, "gi"), String(value));
  }
  // "hundred" support (e.g. "three hundred" → "300")
  text = text.replace(/(\d+)\s+hundred(?:\s+and)?\s*(\d+)?/gi, (_m, h: string, r: string) => {
    const hundreds = parseInt(h, 10) * 100;
    const rest = r ? parseInt(r, 10) : 0;
    return String(hundreds + rest);
  });
  return text;
}
