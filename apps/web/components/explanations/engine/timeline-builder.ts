/**
 * @module components/explanations/engine/timeline-builder
 *
 * Converts an ExplanationScene + SVG root into a GSAP master timeline
 * organized as an array of per-step sub-timelines.
 *
 * The player can then:
 *   - play the whole scene by playing each step in order
 *   - jump to a specific step by seeking to that step's start time
 *   - play a single step (for stepping forward/backward)
 *
 * ─── Element initialization ─────────────────────────────────────────────────
 *
 * All elements start hidden (opacity: 0) unless they have `startVisible: true`.
 * This lets `reveal` actions bring them in smoothly without a flash of content.
 */

import { gsap, ensureGsapPlugins } from "./gsap-setup";
import { applyAction } from "./primitives";
import type { ExplanationScene, ExplanationStep } from "./scene-types";

export interface BuiltTimeline {
  /** Master timeline (all steps chained). Use for play/pause/seek. */
  master: gsap.core.Timeline;
  /** Per-step timelines — useful for stepping forward/back. */
  steps: gsap.core.Timeline[];
  /** Start time (seconds from master start) of each step. */
  stepStarts: number[];
}

/**
 * Initialize all elements to their "before reveal" state and build the
 * master timeline. Returns a BuiltTimeline the player can control.
 */
export function buildTimeline(
  root: SVGSVGElement,
  scene: ExplanationScene,
): BuiltTimeline {
  ensureGsapPlugins();

  // 1. Initialize element visibility: hide all non-startVisible elements
  initializeElements(root, scene);

  // 2. Build a paused master timeline
  const master = gsap.timeline({ paused: true });
  const stepTimelines: gsap.core.Timeline[] = [];
  const stepStarts: number[] = [];

  // 3. For each step, build a sub-timeline and add to master
  for (const step of scene.steps) {
    const stepTl = buildStepTimeline(root, step);
    stepStarts.push(master.duration());
    master.add(stepTl);
    stepTimelines.push(stepTl);
  }

  return { master, steps: stepTimelines, stepStarts };
}

/**
 * Builds a standalone timeline for a single step. Used by the player for
 * stepping forward/backward without relying on the master playhead.
 */
export function buildStepTimeline(
  root: SVGSVGElement,
  step: ExplanationStep,
): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  for (const action of step.actions) {
    applyAction(tl, root, action);
  }
  return tl;
}

/**
 * Reset all elements to their pre-scene state. Used when the player restarts.
 * Elements with startVisible: true stay visible; all others are hidden.
 */
export function initializeElements(
  root: SVGSVGElement,
  scene: ExplanationScene,
): void {
  for (const el of scene.elements) {
    const node = root.querySelector<SVGElement>(`#${cssEscape(el.id)}`);
    if (!node) continue;
    const visible = el.startVisible === true;
    gsap.set(node, {
      opacity: visible ? 1 : 0,
      x: 0,
      y: 0,
      scale: 1,
    });
  }
}

/** Escape element IDs for querySelector. */
function cssEscape(id: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(id);
  return id.replace(/([^\w-])/g, "\\$1");
}
