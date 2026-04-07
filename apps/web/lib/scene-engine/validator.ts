/**
 * @module lib/scene-engine/validator
 *
 * Validates AI-generated scene plans against:
 *   1. Zod schema (structural)
 *   2. Semantic rules (references, durations)
 *   3. Pedagogical rules (complexity, bounds, readability)
 *
 * If invalid, returns a safe fallback scene — never crashes the renderer.
 */

import { ScenePlanSchema, PRIMITIVE_TYPES, ANIMATION_PRESETS, type ScenePlan } from "./types";

export interface ValidationResult {
  valid:    boolean;
  plan:     ScenePlan;
  issues:   string[];
  severity: "pass" | "degraded" | "failed";
}

/**
 * Validate a raw JSON object as a ScenePlan.
 * Returns the plan (possibly the fallback) and any issues found.
 */
export function validateScenePlan(
  raw: unknown,
  fallbackTitle = "Let's work through this"
): ValidationResult {
  // ── 1. Zod structural validation ─────────────────────────────────────────
  const result = ScenePlanSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `schema:${i.path.join(".")}: ${i.message}`
    );
    return { valid: false, plan: buildFallback(fallbackTitle), issues, severity: "failed" };
  }

  // ── 2. Semantic checks ───────────────────────────────────────────────────
  const semanticIssues = semanticCheck(result.data);

  // ── 3. Pedagogical checks ────────────────────────────────────────────────
  const pedagogicalIssues = pedagogicalCheck(result.data);

  const allIssues = [...semanticIssues, ...pedagogicalIssues];

  if (allIssues.some((i) => i.startsWith("CRITICAL:"))) {
    return { valid: false, plan: buildFallback(fallbackTitle), issues: allIssues, severity: "failed" };
  }

  if (allIssues.length > 0) {
    // Non-critical issues: plan is renderable but degraded
    return { valid: true, plan: result.data, issues: allIssues, severity: "degraded" };
  }

  return { valid: true, plan: result.data, issues: [], severity: "pass" };
}

// ─── Semantic checks ─────────────────────────────────────────────────────────

function semanticCheck(plan: ScenePlan): string[] {
  const issues: string[] = [];

  // Duration coherence (±5s tolerance)
  const stepTotal = plan.steps.reduce((sum, s) => sum + s.duration, 0);
  if (Math.abs(stepTotal - plan.duration) > 5) {
    issues.push(`CRITICAL:duration: steps sum to ${stepTotal.toFixed(1)}s but plan declares ${plan.duration}s`);
  }

  for (const step of plan.steps) {
    const elementIds = new Set(step.elements.map((e) => e.id));

    // Animation targets must reference elements
    for (const anim of step.animations) {
      if (!elementIds.has(anim.target)) {
        issues.push(`CRITICAL:ref: step "${step.id}" animation targets "${anim.target}" which doesn't exist`);
      }
    }

    // No duplicate element ids
    const seen = new Set<string>();
    for (const el of step.elements) {
      if (seen.has(el.id)) {
        issues.push(`CRITICAL:dup: step "${step.id}" has duplicate element id "${el.id}"`);
      }
      seen.add(el.id);
    }

    // Validate primitive types
    for (const el of step.elements) {
      if (!(PRIMITIVE_TYPES as readonly string[]).includes(el.type)) {
        issues.push(`CRITICAL:type: element "${el.id}" uses unknown primitive "${el.type}"`);
      }
    }

    // Validate animation presets
    for (const anim of step.animations) {
      if (!(ANIMATION_PRESETS as readonly string[]).includes(anim.preset)) {
        issues.push(`CRITICAL:preset: animation on "${anim.target}" uses unknown preset "${anim.preset}"`);
      }
    }
  }

  return issues;
}

// ─── Pedagogical checks ──────────────────────────────────────────────────────

function pedagogicalCheck(plan: ScenePlan): string[] {
  const issues: string[] = [];

  // Too many elements in a single step (visual clutter)
  for (const step of plan.steps) {
    if (step.elements.length > 25) {
      issues.push(`CRITICAL:complexity: step "${step.id}" has ${step.elements.length} elements (max 25 for readability)`);
    }
  }

  // Total element count across all steps
  const totalElements = plan.steps.reduce((sum, s) => sum + s.elements.length, 0);
  if (totalElements > 80) {
    issues.push(`complexity: plan has ${totalElements} total elements — may feel overwhelming`);
  }

  // Step duration sanity
  for (const step of plan.steps) {
    if (step.duration < 0.5) {
      issues.push(`CRITICAL:timing: step "${step.id}" is only ${step.duration}s — too fast to read`);
    }
    if (step.duration > 15) {
      issues.push(`timing: step "${step.id}" is ${step.duration}s — may feel too slow`);
    }
  }

  // Narration length
  for (const step of plan.steps) {
    if (step.narration && step.narration.length > 200) {
      issues.push(`narration: step "${step.id}" narration is ${step.narration.length} chars — may be too long for children`);
    }
  }

  // Coordinate bounds check (must be within 800x500 viewBox)
  for (const step of plan.steps) {
    for (const el of step.elements) {
      const props = el.props as Record<string, unknown>;
      const x = (props.x ?? props.cx ?? 0) as number;
      const y = (props.y ?? props.cy ?? 0) as number;
      if (x < -50 || x > 850 || y < -50 || y > 550) {
        issues.push(`CRITICAL:bounds: element "${el.id}" at (${x},${y}) is outside canvas`);
      }
    }
  }

  // Animation delay sanity (shouldn't exceed step duration)
  for (const step of plan.steps) {
    for (const anim of step.animations) {
      if (anim.delay + anim.duration > step.duration + 1) {
        issues.push(`timing: animation on "${anim.target}" ends at ${(anim.delay + anim.duration).toFixed(1)}s but step is ${step.duration}s`);
      }
    }
  }

  // Empty steps
  for (const step of plan.steps) {
    if (step.elements.length === 0) {
      issues.push(`CRITICAL:empty: step "${step.id}" has no elements`);
    }
  }

  return issues;
}

// ─── Fallback ────────────────────────────────────────────────────────────────

function buildFallback(title: string): ScenePlan {
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
        narration: "Let's break this down with steps instead.",
        elements: [
          {
            id: "msg",
            type: "mathText",
            props: { x: 400, y: 220, text: title, fontSize: 26, anchor: "middle" },
          },
          {
            id: "sub",
            type: "mathText",
            props: {
              x: 400, y: 270,
              text: "Check the step-by-step explanation below",
              fontSize: 16, color: "#64748b", anchor: "middle",
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
