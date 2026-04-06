/**
 * @module ai/services/visualExplanationEngine/classifier
 *
 * Visual Intent Classifier — determines the best visual explanation type
 * for a given math problem.
 *
 * Two-layer approach:
 *   1. Heuristic classifier (instant, always available)
 *   2. AI classifier via GPT-4o Mini (optional refinement, ~200ms)
 *
 * The heuristic is the primary path — fast, deterministic, and reliable.
 * AI is used only to refine borderline cases or add animation guidance.
 */

import { callAIModelJSON } from "../../ai_client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VisualType =
  | "number_line"
  | "fraction_bar"
  | "array_model"
  | "place_value"
  | "bar_model"
  | "equation_steps"
  | "geometry_sketch"
  | "logic_flow"
  | "comparison_model"
  | "worked_steps_only";

export type AnimationLevel = "none" | "light" | "guided";

export interface VisualIntent {
  visualType:       VisualType;
  confidence:       number;         // 0–1
  goal:             string;         // what the visual should teach
  animationLevel:   AnimationLevel;
  needsStepByStep:  boolean;
  interactive:      boolean;
  reason:           string;         // why this visual was chosen
}

// ─── Keyword pattern rules ───────────────────────────────────────────────────

interface PatternRule {
  patterns:        RegExp[];
  antiPatterns?:   RegExp[];        // if matched, skip this rule
  visualType:      VisualType;
  confidence:      number;
  goal:            string;
  animationLevel:  AnimationLevel;
  needsStepByStep: boolean;
}

const CLASSIFICATION_RULES: PatternRule[] = [
  // ── Fractions (high priority — very common in school math) ──────────────
  {
    patterns:        [/fraction/i, /\d+\s*\/\s*\d+/, /numerator|denominator/i, /equivalent\s+fraction/i, /simplif/i],
    visualType:      "fraction_bar",
    confidence:      0.9,
    goal:            "Show fraction parts visually as divided bars",
    animationLevel:  "light",
    needsStepByStep: false,
  },

  // ── Number line (addition, subtraction, negatives, decimals, rounding) ──
  {
    patterns:        [/number\s*line/i, /negativ/i, /round(ing|ed)?/i, /between.*and/i, /order(ing)?\s+(number|decimal|fraction)/i],
    visualType:      "number_line",
    confidence:      0.85,
    goal:            "Show position and movement on a number line",
    animationLevel:  "light",
    needsStepByStep: false,
  },

  // ── Simple addition/subtraction → number line
  {
    patterns:        [/\b\d+\s*[\+\-]\s*\d+\b/, /add(ition|ing)?|subtract(ion|ing)?/i],
    antiPatterns:    [/fraction/i, /decimal/i, /multiply|multipl/i, /divid/i],
    visualType:      "number_line",
    confidence:      0.7,
    goal:            "Show addition/subtraction as movement on a number line",
    animationLevel:  "light",
    needsStepByStep: false,
  },

  // ── Multiplication / division / grouping → array model ─────────────────
  {
    patterns:        [/multipl(y|ication|ied)/i, /times\s+table/i, /\d+\s*[×x]\s*\d+/i, /groups?\s+of/i, /rows?\s+(and|of)\s+column/i],
    antiPatterns:    [/fraction/i, /algebra/i, /equation/i],
    visualType:      "array_model",
    confidence:      0.85,
    goal:            "Show multiplication as rows and columns of dots",
    animationLevel:  "light",
    needsStepByStep: false,
  },

  // ── Division → array model
  {
    patterns:        [/divid(e|ing|sion)/i, /\d+\s*[÷\/]\s*\d+/, /shar(e|ed|ing)\s+\w*\s*equal/i, /split\s+into/i],
    antiPatterns:    [/fraction/i, /long\s+division/i],
    visualType:      "array_model",
    confidence:      0.75,
    goal:            "Show division as grouping in an array",
    animationLevel:  "light",
    needsStepByStep: false,
  },

  // ── Place value / regrouping ───────────────────────────────────────────
  {
    patterns:        [/place\s*value/i, /regroup/i, /tens\s+and\s+ones/i, /hundreds?\s+(tens?|ones?)/i, /expand(ed)?\s+form/i, /\b\d{3,}\b.*place/i],
    visualType:      "place_value",
    confidence:      0.9,
    goal:            "Show digits in place value columns with blocks",
    animationLevel:  "light",
    needsStepByStep: false,
  },

  // ── Word problems → bar model ──────────────────────────────────────────
  {
    patterns:        [/how\s+(many|much)\s+(more|less|left|total|altogether|remain)/i, /bar\s*model/i, /word\s*problem/i, /total|altogether|remain/i],
    antiPatterns:    [/fraction/i, /angle/i, /area|perimeter/i],
    visualType:      "bar_model",
    confidence:      0.8,
    goal:            "Show quantities as proportional bars for comparison",
    animationLevel:  "none",
    needsStepByStep: true,
  },

  // ── Algebra / equations → equation steps ───────────────────────────────
  {
    patterns:        [/solve|equation|algebra/i, /[a-z]\s*[\+\-\*\/\=]\s*\d+/i, /variable|unknown/i, /simplif.*express/i, /balance/i, /\bx\s*[=+\-]/i],
    visualType:      "equation_steps",
    confidence:      0.85,
    goal:            "Show equation solving step-by-step with operations",
    animationLevel:  "guided",
    needsStepByStep: true,
  },

  // ── Geometry ───────────────────────────────────────────────────────────
  {
    patterns:        [/angle|triangle|rectangle|circle|square|pentagon|hexagon/i, /area|perimeter|circumference/i, /parallel|perpendicular/i, /symmetr/i, /shape/i],
    visualType:      "geometry_sketch",
    confidence:      0.85,
    goal:            "Show geometric shapes with labeled measurements",
    animationLevel:  "none",
    needsStepByStep: false,
  },

  // ── Multi-step reasoning / logic → logic flow ──────────────────────────
  {
    patterns:        [/step\s*by\s*step|first.*then.*finally/i, /method|strategy|approach/i, /decide|choose|which\s+operation/i],
    antiPatterns:    [/fraction/i, /angle/i, /equation/i],
    visualType:      "logic_flow",
    confidence:      0.6,
    goal:            "Show reasoning steps as a connected flow diagram",
    animationLevel:  "guided",
    needsStepByStep: true,
  },

  // ── Comparison → comparison model ──────────────────────────────────────
  {
    patterns:        [/compar(e|ing|ison)/i, /greater|less|bigger|smaller|taller|shorter/i, /difference\s+between/i],
    antiPatterns:    [/fraction/i, /decimal/i],
    visualType:      "comparison_model",
    confidence:      0.7,
    goal:            "Show two quantities side by side for comparison",
    animationLevel:  "none",
    needsStepByStep: false,
  },

  // ── Long division → equation steps (special case)
  {
    patterns:        [/long\s+division/i],
    visualType:      "equation_steps",
    confidence:      0.8,
    goal:            "Show long division process step by step",
    animationLevel:  "guided",
    needsStepByStep: true,
  },
];

// ─── Heuristic classifier (always available, instant) ────────────────────────

/**
 * Classify the best visual type for a question using keyword pattern matching.
 * Returns immediately, no AI call needed.
 */
export function classifyHeuristic(question: string): VisualIntent {
  let bestMatch: VisualIntent | null = null;
  let bestConfidence = 0;

  for (const rule of CLASSIFICATION_RULES) {
    // Check anti-patterns first
    if (rule.antiPatterns?.some((ap) => ap.test(question))) continue;

    // Check if any pattern matches
    const matched = rule.patterns.some((p) => p.test(question));
    if (matched && rule.confidence > bestConfidence) {
      bestConfidence = rule.confidence;
      bestMatch = {
        visualType:       rule.visualType,
        confidence:       rule.confidence,
        goal:             rule.goal,
        animationLevel:   rule.animationLevel,
        needsStepByStep:  rule.needsStepByStep,
        interactive:      false,
        reason:           `Matched heuristic pattern for ${rule.visualType}`,
      };
    }
  }

  // Default: worked steps only
  return bestMatch ?? {
    visualType:      "worked_steps_only",
    confidence:      0.5,
    goal:            "Explain with clear worked steps",
    animationLevel:  "none",
    needsStepByStep: true,
    interactive:     false,
    reason:          "No strong visual pattern detected — using worked steps",
  };
}

// ─── AI classifier (optional refinement) ─────────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT = `You classify math questions into the best visual explanation type. Return ONLY compact JSON.

Visual types (choose exactly one):
- number_line: addition/subtraction, number ordering, decimals, negatives, rounding
- fraction_bar: fractions, equivalent fractions, part-whole
- array_model: multiplication, division, grouping, times tables
- place_value: place value, regrouping, expanded form, large numbers
- bar_model: word problems, comparison, total/difference
- equation_steps: algebra, equation solving, simplifying expressions
- geometry_sketch: shapes, angles, area, perimeter, symmetry
- logic_flow: multi-step word problem reasoning, operation selection
- comparison_model: comparing quantities, greater/less than
- worked_steps_only: no visual adds value (definitions, simple arithmetic)

Rules:
- Pick the SINGLE best visual, not multiple
- Only choose visuals that genuinely help understanding
- "worked_steps_only" is valid — don't force visuals`;

/**
 * Attempt AI-powered classification for borderline cases.
 * Returns null on timeout or failure — caller uses heuristic instead.
 */
export async function classifyWithAI(question: string, grade: string): Promise<VisualIntent | null> {
  try {
    const result = await callAIModelJSON<{
      visualType:      VisualType;
      confidence:      number;
      goal:            string;
      animationLevel:  AnimationLevel;
      needsStepByStep: boolean;
      reason:          string;
    }>(
      `Grade ${grade.replace("G", "")} student asks: "${question}"\n\nClassify the best visual explanation type. Return JSON: { visualType, confidence (0-1), goal (10 words max), animationLevel ("none"|"light"|"guided"), needsStepByStep (bool), reason (10 words max) }`,
      {
        system:      CLASSIFIER_SYSTEM_PROMPT,
        maxTokens:   200,
        temperature: 0.1,
        callSite:    "visual_classifier",
      },
    );

    if (!result.visualType || !VALID_TYPES.has(result.visualType)) return null;

    return {
      visualType:       result.visualType,
      confidence:       Math.min(1, Math.max(0, result.confidence ?? 0.7)),
      goal:             result.goal ?? "Visual explanation",
      animationLevel:   result.animationLevel ?? "none",
      needsStepByStep:  result.needsStepByStep ?? false,
      interactive:      false,
      reason:           result.reason ?? "AI classification",
    };
  } catch {
    return null;
  }
}

const VALID_TYPES = new Set<VisualType>([
  "number_line", "fraction_bar", "array_model", "place_value", "bar_model",
  "equation_steps", "geometry_sketch", "logic_flow", "comparison_model", "worked_steps_only",
]);

/**
 * Phase 1 types — the only types with production-quality renderers.
 * Phase 2 types (geometry_sketch, logic_flow, comparison_model) fall back
 * to worked_steps_only until their renderers are battle-tested.
 */
const PHASE_1_TYPES = new Set<VisualType>([
  "number_line", "fraction_bar", "array_model", "place_value",
  "bar_model", "equation_steps", "worked_steps_only",
]);

/**
 * Restrict an intent to Phase 1 types only. Phase 2 types are
 * downgraded to worked_steps_only.
 */
export function enforcePhase1(intent: VisualIntent): VisualIntent {
  if (PHASE_1_TYPES.has(intent.visualType)) return intent;
  return {
    ...intent,
    visualType:  "worked_steps_only",
    confidence:  0.5,
    reason:      `${intent.visualType} is Phase 2 — falling back to worked steps`,
  };
}

// ─── Intent cache (normalized question → intent) ─────────────────────────────

const INTENT_CACHE = new Map<string, { intent: VisualIntent; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_MAX_SIZE = 200;

function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/\s+/g, " ").trim();
}

function getCachedIntent(question: string): VisualIntent | null {
  const key = normalizeQuestion(question);
  const entry = INTENT_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    INTENT_CACHE.delete(key);
    return null;
  }
  return entry.intent;
}

function cacheIntent(question: string, intent: VisualIntent): void {
  // Evict oldest entries if cache is full
  if (INTENT_CACHE.size >= CACHE_MAX_SIZE) {
    const oldest = INTENT_CACHE.keys().next().value;
    if (oldest) INTENT_CACHE.delete(oldest);
  }
  INTENT_CACHE.set(normalizeQuestion(question), { intent, timestamp: Date.now() });
}

// ─── Combined classifier ─────────────────────────────────────────────────────

/**
 * Classify visual intent using heuristic first, optionally refined by AI.
 * AI is only called when the heuristic has low confidence (< 0.7).
 * Results are cached by normalized question text.
 * All results are enforced to Phase 1 types only.
 *
 * @param question - The student's math question
 * @param grade    - Student grade (e.g. "G4")
 * @param useAI    - Whether to attempt AI refinement (default: true)
 */
export async function classifyVisualIntent(
  question: string,
  grade: string,
  useAI = true,
): Promise<VisualIntent> {
  // Check cache first
  const cached = getCachedIntent(question);
  if (cached) return cached;

  const heuristic = classifyHeuristic(question);

  // High-confidence heuristic — skip AI
  let result: VisualIntent;
  if (heuristic.confidence >= 0.7 || !useAI) {
    result = heuristic;
  } else {
    // Try AI refinement for low-confidence cases
    const aiResult = await classifyWithAI(question, grade);
    result = (aiResult && aiResult.confidence > heuristic.confidence)
      ? aiResult
      : heuristic;
  }

  // Enforce Phase 1 types and validate AI output
  result = enforcePhase1(result);

  // Cache the result
  cacheIntent(question, result);

  return result;
}
