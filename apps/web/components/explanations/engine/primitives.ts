/**
 * @module components/explanations/engine/primitives
 *
 * Animation primitives that convert VisualAction objects into GSAP tweens.
 *
 * Each primitive:
 *   - takes the target element(s), the action config, and the parent timeline
 *   - adds the tween(s) to the timeline at the correct offset
 *   - is pure and stateless — reusable across scenes, topics, renderers
 *
 * These are the ONLY animation primitives in the engine. Everything the
 * renderers do must map to one of these. This keeps visual language consistent
 * across topics and prevents the one-off animation sprawl that broke v1.
 */

import { gsap } from "./gsap-setup";
import type {
  VisualAction, RevealAction, FocusAction, DrawAction,
  MoveAction, ReplaceAction, DimAction, WaitAction,
} from "./scene-types";
import { DEFAULT_DURATIONS } from "./scene-types";

// ─── Target resolution ──────────────────────────────────────────────────────

/** Resolves one or more element IDs to DOM nodes within the SVG root. */
function resolveTargets(
  root: SVGSVGElement,
  target: string | string[],
): SVGElement[] {
  const ids = Array.isArray(target) ? target : [target];
  const found: SVGElement[] = [];
  for (const id of ids) {
    const el = root.querySelector<SVGElement>(`#${cssEscape(id)}`);
    if (el) found.push(el);
    else console.warn(`[primitives] target not found: ${id}`);
  }
  return found;
}

/** Escape element IDs for use in querySelector (handles hyphens, digits, etc.) */
function cssEscape(id: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(id);
  return id.replace(/([^\w-])/g, "\\$1");
}

// ─── Reveal ─────────────────────────────────────────────────────────────────

export function applyReveal(
  tl: gsap.core.Timeline,
  root: SVGSVGElement,
  action: RevealAction,
): void {
  const targets = resolveTargets(root, action.target);
  if (targets.length === 0) return;

  const duration = action.duration ?? DEFAULT_DURATIONS.reveal;
  const at       = `+=${action.delay ?? 0}`;
  const from     = action.from ?? "fade";

  let fromVars: gsap.TweenVars = { opacity: 0 };
  let ease: string = "power2.out";

  switch (from) {
    case "fade":   fromVars = { opacity: 0 }; break;
    case "top":    fromVars = { opacity: 0, y: -20 }; break;
    case "bottom": fromVars = { opacity: 0, y: 20 }; break;
    case "left":   fromVars = { opacity: 0, x: -20 }; break;
    case "right":  fromVars = { opacity: 0, x: 20 }; break;
    case "pop":    fromVars = { opacity: 0, scale: 0, transformOrigin: "center" }; ease = "back.out(1.7)"; break;
  }

  tl.from(targets, { ...fromVars, duration, ease, stagger: 0.05 }, at);
}

// ─── Focus ──────────────────────────────────────────────────────────────────

export function applyFocus(
  tl: gsap.core.Timeline,
  root: SVGSVGElement,
  action: FocusAction,
): void {
  const targets = resolveTargets(root, action.target);
  if (targets.length === 0) return;

  const duration = action.duration ?? DEFAULT_DURATIONS.focus;
  const at       = `+=${action.delay ?? 0}`;
  const effect   = action.effect ?? "pulse";

  switch (effect) {
    case "pulse":
      tl.to(targets, {
        scale: 1.15,
        transformOrigin: "center",
        duration: duration / 2,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      }, at);
      break;

    case "glow": {
      // Drop-shadow filter pulsed via CSS
      const glowColor = action.color ?? "#6366f1";
      tl.to(targets, {
        filter: `drop-shadow(0 0 8px ${glowColor})`,
        duration: duration / 2,
        yoyo: true,
        repeat: 1,
      }, at);
      break;
    }

    case "scale":
      tl.to(targets, {
        scale: 1.1,
        transformOrigin: "center",
        duration,
        ease: "back.out(1.7)",
      }, at);
      break;

    case "color":
      if (action.color) {
        tl.to(targets, {
          fill:   action.color,
          stroke: action.color,
          duration,
          ease: "power2.inOut",
        }, at);
      }
      break;
  }
}

// ─── Draw (stroke reveal via DrawSVGPlugin) ─────────────────────────────────

export function applyDraw(
  tl: gsap.core.Timeline,
  root: SVGSVGElement,
  action: DrawAction,
): void {
  const targets = resolveTargets(root, action.target);
  if (targets.length === 0) return;

  const duration = action.duration ?? DEFAULT_DURATIONS.draw;
  const at       = `+=${action.delay ?? 0}`;

  // Ensure they become visible first (draw uses opacity 1 for the path itself)
  tl.set(targets, { opacity: 1 }, at);
  // DrawSVG animates stroke from 0% to 100%
  tl.from(targets, {
    drawSVG: "0%",
    duration,
    ease: "power2.inOut",
  } as gsap.TweenVars, "<");
}

// ─── Move ───────────────────────────────────────────────────────────────────

export function applyMove(
  tl: gsap.core.Timeline,
  root: SVGSVGElement,
  action: MoveAction,
): void {
  const el = resolveTargets(root, action.target)[0];
  if (!el) return;

  const duration = action.duration ?? DEFAULT_DURATIONS.move;
  const at       = `+=${action.delay ?? 0}`;
  const { x, y, dx, dy } = action.to;

  const vars: gsap.TweenVars = { duration, ease: "power2.inOut" };
  if (x !== undefined) vars["x"] = x;
  if (y !== undefined) vars["y"] = y;
  if (dx !== undefined) vars["x"] = `+=${dx}`;
  if (dy !== undefined) vars["y"] = `+=${dy}`;

  tl.to(el, vars, at);
}

// ─── Replace (cross-fade from one element to another) ──────────────────────

export function applyReplace(
  tl: gsap.core.Timeline,
  root: SVGSVGElement,
  action: ReplaceAction,
): void {
  const fromEl = root.querySelector<SVGElement>(`#${cssEscape(action.from)}`);
  const toEl   = root.querySelector<SVGElement>(`#${cssEscape(action.to)}`);
  if (!fromEl || !toEl) {
    console.warn("[primitives] replace: target not found", action);
    return;
  }

  const duration = action.duration ?? DEFAULT_DURATIONS.replace;
  const at       = `+=${action.delay ?? 0}`;
  const half     = duration / 2;

  tl.to(fromEl, { opacity: 0, duration: half, ease: "power2.out" }, at);
  tl.fromTo(toEl, { opacity: 0 }, { opacity: 1, duration: half, ease: "power2.in" }, ">");
}

// ─── Dim ────────────────────────────────────────────────────────────────────

export function applyDim(
  tl: gsap.core.Timeline,
  root: SVGSVGElement,
  action: DimAction,
): void {
  const targets = resolveTargets(root, action.target);
  if (targets.length === 0) return;

  const duration = action.duration ?? DEFAULT_DURATIONS.dim;
  const at       = `+=${action.delay ?? 0}`;
  const opacity  = action.opacity ?? 0.25;

  tl.to(targets, { opacity, duration, ease: "power2.inOut" }, at);
}

// ─── Wait ───────────────────────────────────────────────────────────────────

export function applyWait(tl: gsap.core.Timeline, action: WaitAction): void {
  tl.to({}, { duration: action.duration }, `+=0`);
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

/**
 * Applies a single action to the timeline by dispatching to the correct
 * primitive handler. This is the only function the timeline-builder needs
 * to call — it does not need to know about individual primitives.
 */
export function applyAction(
  tl: gsap.core.Timeline,
  root: SVGSVGElement,
  action: VisualAction,
): void {
  switch (action.type) {
    case "reveal":  applyReveal(tl, root, action); break;
    case "focus":   applyFocus(tl, root, action); break;
    case "draw":    applyDraw(tl, root, action); break;
    case "move":    applyMove(tl, root, action); break;
    case "replace": applyReplace(tl, root, action); break;
    case "dim":     applyDim(tl, root, action); break;
    case "wait":    applyWait(tl, action); break;
  }
}
