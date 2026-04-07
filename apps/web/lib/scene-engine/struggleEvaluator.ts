/**
 * @module lib/scene-engine/struggleEvaluator
 *
 * Detects when a student is struggling in practice and whether
 * visual intervention is appropriate.
 *
 * Combines struggle signals with the reliability gate to produce
 * an actionable intervention recommendation.
 */

import { evaluateVisualReliability, type GateResult } from "./reliabilityGate";
import type { MathData } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StruggleContext {
  incorrectAttempts:   number;    // consecutive wrong on current question
  hintLevel:           number;    // highest hint tier used (0-3)
  misconception?:      string;    // detected misconception tag
  totalSessionWrong:   number;    // total wrong in this session
  totalSessionCorrect: number;    // total correct in this session
}

export interface StruggleResult {
  struggleDetected: boolean;
  reason:           string;
}

export type InterventionType = "watch_visual" | "retry" | "continue";

export interface Intervention {
  type:         InterventionType;
  reliability?: GateResult["reliability"];
  reason:       string;     // child-friendly message
  gate?:        GateResult; // full gate result for telemetry
}

// ─── Struggle detection ──────────────────────────────────────────────────────

export function evaluateStruggle(ctx: StruggleContext): StruggleResult {
  // 2+ incorrect attempts on same question
  if (ctx.incorrectAttempts >= 2) {
    return { struggleDetected: true, reason: "Multiple wrong attempts on this question" };
  }

  // Used level 2+ hints (clue or full step)
  if (ctx.hintLevel >= 2) {
    return { struggleDetected: true, reason: "Needed significant hint support" };
  }

  // Repeated misconception with low session accuracy
  if (ctx.misconception && ctx.totalSessionWrong > ctx.totalSessionCorrect && ctx.totalSessionWrong >= 3) {
    return { struggleDetected: true, reason: "Recurring misconception pattern" };
  }

  return { struggleDetected: false, reason: "" };
}

// ─── Intervention decision (struggle + gate) ─────────────────────────────────

export function decideIntervention(
  struggle: StruggleResult,
  mathData: MathData | undefined | null,
  question: string,
): Intervention {
  if (!struggle.struggleDetected) {
    return { type: "continue", reason: "" };
  }

  // Run reliability gate
  const gate = evaluateVisualReliability(mathData, question);

  if (gate.eligible && gate.reliability === "high") {
    return {
      type: "watch_visual",
      reliability: "high",
      reason: "Let's look at this visually — it'll help it click!",
      gate,
    };
  }

  if (gate.eligible && gate.reliability === "medium") {
    return {
      type: "watch_visual",
      reliability: "medium",
      reason: "Want to try seeing this a different way?",
      gate,
    };
  }

  // Low reliability or not eligible — suggest retry
  return {
    type: "retry",
    reason: "Let's try a different approach — read through the steps carefully.",
  };
}
