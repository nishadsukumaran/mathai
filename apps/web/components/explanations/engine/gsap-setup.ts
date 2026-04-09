/**
 * @module components/explanations/engine/gsap-setup
 *
 * Registers GSAP plugins exactly once per client page load.
 *
 * GSAP plugins must be registered BEFORE any tween that uses them.
 * We do this in a module-level IIFE guarded by a typeof-window check so
 * Next.js server rendering doesn't break on the browser-only plugin code.
 *
 * As of GSAP 3.12 (April 2024) DrawSVGPlugin is free and shipped with the
 * main `gsap` package.
 */

import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

let registered = false;

export function ensureGsapPlugins(): void {
  if (registered) return;
  if (typeof window === "undefined") return;

  gsap.registerPlugin(DrawSVGPlugin);
  registered = true;
}

// Re-export for convenience so callers only import from this module
export { gsap, DrawSVGPlugin };
