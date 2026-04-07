/**
 * @module lib/scene-engine/reliabilityGate
 *
 * Pre-render decision layer that evaluates whether a visual explanation
 * should be offered and at what confidence level.
 *
 * Rules:
 *   high   → template-backed, proven types. Show CTA confidently.
 *   medium → plausible but AI-dependent. Show softer CTA, only on explicit request.
 *   low    → not suitable for visual. Don't show CTA; prefer steps.
 *
 * Uses: math type, available templates, number ranges, question complexity.
 */

import type { MathData } from "@/types";

// ═════════════════════════════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════════════════════════════

export type ReliabilityLevel = "high" | "medium" | "low";
export type VisualSource     = "template" | "ai" | "static" | "none";
export type VisualMode       = "scene" | "static" | "steps_only";

export interface GateResult {
  eligible:            boolean;
  reliability:         ReliabilityLevel;
  source:              VisualSource;
  reason:              string;
  preferredVisualMode: VisualMode;
}

// ═════════════════════════════════════════════════════════════════════════════
// Template fitness checks (match dispatcher.ts guards exactly)
// ═════════════════════════════════════════════════════════════════════════════

function checkTemplateFit(md: MathData): { fits: boolean; reason: string } {
  const v = md.values ?? [];

  switch (md.type) {
    case "multiplication": {
      const a = v[0], b = v[1];
      if (a && b && a >= 1 && a <= 10 && b >= 1 && b <= 10) {
        return { fits: true, reason: `${a}x${b} array — fully supported` };
      }
      return { fits: false, reason: `Numbers too large for dot array (max 10x10)` };
    }

    case "subtraction": {
      const a = v[0], b = v[1];
      if (a !== undefined && b !== undefined && a >= 0 && a <= 20 && b >= 0 && b <= a) {
        return { fits: true, reason: `${a}-${b} on number line — fully supported` };
      }
      return { fits: false, reason: `Numbers out of number-line range (max 20)` };
    }

    case "addition": {
      const a = v[0], b = v[1];
      if (a !== undefined && b !== undefined && a >= 0 && a <= 20 && b >= 0 && b <= 20) {
        return { fits: true, reason: `${a}+${b} on number line — fully supported` };
      }
      return { fits: false, reason: `Numbers out of number-line range (max 20)` };
    }

    case "division": {
      const total = v[0] ?? md.structure?.total;
      const divisor = v[1] ?? md.structure?.groups;
      if (total && divisor && total > 0 && total <= 24 && divisor > 0 && divisor <= 6 && total % divisor === 0) {
        return { fits: true, reason: `${total}/${divisor} groups — fully supported` };
      }
      return { fits: false, reason: `Not evenly divisible or too large for groups (max 24/6)` };
    }

    case "fraction_addition": {
      const fracs = md.fractions ?? [];
      if (fracs.length >= 2) {
        const f1 = fracs[0]!, f2 = fracs[1]!;
        if (f1.denominator === f2.denominator && f1.denominator <= 12) {
          return { fits: true, reason: `Same-denominator fraction bars — fully supported` };
        }
      }
      return { fits: false, reason: `Different denominators or missing fractions` };
    }

    case "equation": {
      const eq = md.equation;
      if (eq?.variable && eq.lhs && eq.rhs) {
        const match = eq.lhs.match(/(\w)\s*([+-])\s*(\d+)/);
        const total = parseInt(eq.rhs, 10);
        if (match && !isNaN(total) && total <= 100) {
          return { fits: true, reason: `Simple equation solving — fully supported` };
        }
      }
      return { fits: false, reason: `Equation format not supported for whiteboard template` };
    }

    // ── Phase 1 templates ──────────────────────────────────────────────────

    case "place_value": {
      const num = v[0];
      if (num && num >= 10 && num <= 999) {
        return { fits: true, reason: `Place value blocks for ${num} — fully supported` };
      }
      return { fits: false, reason: `Number out of place-value range (10–999)` };
    }

    case "comparison": {
      const a = v[0], b = v[1];
      if (a && b && a >= 1 && a <= 999 && b >= 1 && b <= 999) {
        return { fits: true, reason: `${a} vs ${b} comparison bars — fully supported` };
      }
      return { fits: false, reason: `Numbers out of comparison range (1–999)` };
    }

    case "fraction_comparison": {
      const fracs = md.fractions ?? [];
      if (fracs.length >= 2) {
        const f1 = fracs[0]!, f2 = fracs[1]!;
        if (f1.denominator >= 2 && f1.denominator <= 12 && f2.denominator >= 2 && f2.denominator <= 12) {
          return { fits: true, reason: `Fraction comparison bars — fully supported` };
        }
      }
      return { fits: false, reason: `Denominators out of range (2–12)` };
    }

    case "fraction_equivalence": {
      const fracs = md.fractions ?? [];
      if (fracs.length >= 2) {
        const f1 = fracs[0]!, f2 = fracs[1]!;
        if (f1.denominator >= 2 && f1.denominator <= 12 && f2.denominator >= 2 && f2.denominator <= 12) {
          return { fits: true, reason: `Equivalent fraction bars — fully supported` };
        }
      }
      return { fits: false, reason: `Denominators out of range (2–12)` };
    }

    case "word_problem": {
      const groups = md.structure?.groups;
      const perGroup = md.structure?.itemsPerGroup;
      if (groups && perGroup && groups >= 2 && groups <= 6 && perGroup >= 2 && perGroup <= 8 && groups * perGroup <= 30) {
        return { fits: true, reason: `${groups} groups of ${perGroup} — grouped dot template` };
      }
      return { fits: false, reason: `Word problem doesn't fit simple grouping pattern` };
    }

    default:
      return { fits: false, reason: `No template for type: ${md.type}` };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// AI eligibility check
// ═════════════════════════════════════════════════════════════════════════════

const AI_ELIGIBLE_TYPES = new Set([
  "fraction_subtraction",
]);

// ═════════════════════════════════════════════════════════════════════════════
// Complexity heuristic (for AI-eligible types)
// ═════════════════════════════════════════════════════════════════════════════

function estimateComplexity(md: MathData, question: string): "simple" | "moderate" | "complex" {
  // Count steps
  const stepCount = md.steps?.length ?? 0;
  if (stepCount > 5) return "complex";

  // Count numbers in the question
  const numbers = question.match(/\d+/g) ?? [];
  if (numbers.length > 4) return "complex";
  if (numbers.length > 2) return "moderate";

  // Multi-operation detection
  const ops = question.match(/[+\-x×÷/]/g) ?? [];
  if (ops.length > 2) return "complex";

  // Word problem length
  if (md.type === "word_problem" && question.length > 200) return "complex";

  return "simple";
}

// ═════════════════════════════════════════════════════════════════════════════
// Gate
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Evaluate whether a visual explanation should be offered.
 * Call this BEFORE showing any visual CTA.
 */
export function evaluateVisualReliability(
  mathData: MathData | undefined | null,
  question: string = "",
): GateResult {
  // No math data → can't determine anything
  if (!mathData) {
    return {
      eligible: false,
      reliability: "low",
      source: "none",
      reason: "No structured math data available for this question.",
      preferredVisualMode: "steps_only",
    };
  }

  // ── Check template fit ─────────────────────────────────────────────────
  const templateCheck = checkTemplateFit(mathData);

  if (templateCheck.fits) {
    return {
      eligible: true,
      reliability: "high",
      source: "template",
      reason: templateCheck.reason,
      preferredVisualMode: "scene",
    };
  }

  // ── Template type but out of range → still high source, medium reliability
  const TEMPLATE_TYPES = new Set([
    "multiplication", "subtraction", "addition", "division",
    "fraction_addition", "equation",
  ]);

  if (TEMPLATE_TYPES.has(mathData.type)) {
    // The type is supported but values are out of template range
    // Could try AI, but it's a known type → medium
    return {
      eligible: true,
      reliability: "medium",
      source: "ai",
      reason: `${mathData.type} is supported but values are outside template range. AI generation may work.`,
      preferredVisualMode: "scene",
    };
  }

  // ── Check AI-eligible types ────────────────────────────────────────────
  if (AI_ELIGIBLE_TYPES.has(mathData.type)) {
    const complexity = estimateComplexity(mathData, question);

    if (complexity === "complex") {
      return {
        eligible: false,
        reliability: "low",
        source: "none",
        reason: "This problem is too complex for a clear visual. Steps work better here.",
        preferredVisualMode: "steps_only",
      };
    }

    return {
      eligible: true,
      reliability: complexity === "simple" ? "medium" : "medium",
      source: "ai",
      reason: `${mathData.type} can be shown visually via AI generation.`,
      preferredVisualMode: "scene",
    };
  }

  // ── Unknown type → low reliability ─────────────────────────────────────
  return {
    eligible: false,
    reliability: "low",
    source: "none",
    reason: "This type of problem is better explained step by step.",
    preferredVisualMode: "steps_only",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// UX copy helpers
// ═════════════════════════════════════════════════════════════════════════════

/** CTA label based on reliability */
export function getVisualCTALabel(reliability: ReliabilityLevel): string {
  switch (reliability) {
    case "high":   return "Watch It";
    case "medium": return "Try Visual";
    default:       return "";
  }
}

/** Fallback message when visual isn't suitable */
export function getStepsFallbackMessage(reason?: string): string {
  const messages = [
    "This one is better explained step by step.",
    "Let's break this down with steps instead.",
    "A visual isn't the clearest way to show this one.",
  ];
  return reason ?? messages[Math.floor(Math.random() * messages.length)]!;
}
