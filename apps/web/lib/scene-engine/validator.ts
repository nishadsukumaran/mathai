/**
 * @module lib/scene-engine/validator
 *
 * Validates AI-generated scene plans against the Zod schema.
 * If invalid, returns a safe fallback scene that explains the math
 * as plain text steps — never crashes the renderer.
 */

import { ScenePlanSchema, type ScenePlan } from "./types";

export interface ValidationResult {
  valid:    boolean;
  plan:     ScenePlan;
  issues:   string[];
}

/**
 * Validate a raw JSON object as a ScenePlan.
 * If it passes, return the parsed plan.
 * If it fails, return a text-only fallback scene.
 */
export function validateScenePlan(
  raw: unknown,
  fallbackTitle = "Let's work through this"
): ValidationResult {
  const result = ScenePlanSchema.safeParse(raw);

  if (result.success) {
    // Additional semantic checks
    const issues = semanticCheck(result.data);
    if (issues.length > 0) {
      return { valid: false, plan: buildFallback(fallbackTitle, issues), issues };
    }
    return { valid: true, plan: result.data, issues: [] };
  }

  // Zod validation failed — extract human-readable issues
  const issues = result.error.issues.map(
    (i) => `${i.path.join(".")}: ${i.message}`
  );

  return { valid: false, plan: buildFallback(fallbackTitle, issues), issues };
}

// ─── Semantic checks (beyond schema shape) ───────────────────────────────────

function semanticCheck(plan: ScenePlan): string[] {
  const issues: string[] = [];

  // Total step durations should roughly match declared duration
  const stepTotal = plan.steps.reduce((sum, s) => sum + s.duration, 0);
  if (Math.abs(stepTotal - plan.duration) > 5) {
    issues.push(`Step durations sum to ${stepTotal}s but plan declares ${plan.duration}s`);
  }

  // Animation targets must reference elements in the same step
  for (const step of plan.steps) {
    const elementIds = new Set(step.elements.map((e) => e.id));
    for (const anim of step.animations) {
      if (!elementIds.has(anim.target)) {
        issues.push(`Step "${step.id}": animation targets "${anim.target}" which doesn't exist`);
      }
    }
  }

  // No duplicate element ids within a step
  for (const step of plan.steps) {
    const seen = new Set<string>();
    for (const el of step.elements) {
      if (seen.has(el.id)) issues.push(`Step "${step.id}": duplicate element id "${el.id}"`);
      seen.add(el.id);
    }
  }

  return issues;
}

// ─── Fallback: safe text-only scene ──────────────────────────────────────────

function buildFallback(title: string, issues: string[]): ScenePlan {
  return {
    id:       "fallback",
    title,
    topic:    "Explanation",
    palette:  "ocean",
    duration: 4,
    steps: [
      {
        id: "step-1",
        duration: 4,
        narration: "Let me walk you through this step by step.",
        elements: [
          {
            id: "msg",
            type: "mathText",
            props: { x: 400, y: 200, text: title, fontSize: 28, anchor: "middle" },
          },
          {
            id: "sub",
            type: "mathText",
            props: {
              x: 400, y: 260,
              text: "Check the written explanation below",
              fontSize: 18, color: "#64748b", anchor: "middle",
            },
          },
        ],
        animations: [
          { target: "msg", preset: "fadeIn", delay: 0, duration: 0.6 },
          { target: "sub", preset: "slideUp", delay: 0.4, duration: 0.5 },
        ],
      },
    ],
  };
}
