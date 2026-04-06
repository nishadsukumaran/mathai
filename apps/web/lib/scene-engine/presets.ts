/**
 * @module lib/scene-engine/presets
 *
 * Animation preset definitions and color palettes.
 * Each preset maps to Framer Motion props applied to SVG elements.
 * Palettes provide 5 semantic colors for consistent theming.
 */

import type { AnimationPreset, PaletteKey, SceneAnimation } from "./types";

// ═════════════════════════════════════════════════════════════════════════════
// Animation presets → Framer Motion initial/animate/transition
// ═════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */
// Framer Motion prop types are complex union types that don't play well
// with strict Record<string, unknown>. Using `any` here is intentional —
// the preset functions below are the only producers, so safety is enforced
// by the switch cases, not by the container type.
export interface MotionConfig {
  initial:    any;
  animate:    any;
  transition: any;
}

/**
 * Resolve an animation definition into Framer Motion props.
 * All durations/delays are in seconds.
 */
export function resolveAnimation(anim: SceneAnimation): MotionConfig {
  const { preset, delay = 0, duration = 0.5, params } = anim;
  const base = { delay, duration, ease: "easeOut" as const };

  switch (preset) {
    case "fadeIn":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { ...base },
      };

    case "pop":
      return {
        initial: { opacity: 0, scale: 0 },
        animate: { opacity: 1, scale: 1 },
        transition: { ...base, type: "spring", stiffness: 400, damping: 20 },
      };

    case "slideUp":
      return {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { ...base },
      };

    case "slideLeft":
      return {
        initial: { opacity: 0, x: 30 },
        animate: { opacity: 1, x: 0 },
        transition: { ...base },
      };

    case "highlight":
      return {
        initial: { filter: "brightness(1)" },
        animate: { filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"] },
        transition: { ...base, duration: duration * 2, repeat: 0 },
      };

    case "move":
      return {
        initial: {},
        animate: params?.to ? { x: params.to.x, y: params.to.y } : {},
        transition: { ...base, type: "spring", stiffness: 100, damping: 15 },
      };

    case "draw":
      return {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { ...base, duration: duration * 1.5 },
      };

    case "crossOut":
      return {
        initial: { scaleX: 0, opacity: 0 },
        animate: { scaleX: 1, opacity: 1 },
        transition: { ...base },
      };

    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { ...base },
      };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Color palettes — 5 semantic slots per palette
// ═════════════════════════════════════════════════════════════════════════════

export interface Palette {
  primary:   string;   // main visual color (dots, bars, fills)
  secondary: string;   // second visual color (comparison, grouping)
  accent:    string;   // highlight, arrows, annotations
  bg:        string;   // canvas background
  text:      string;   // text, labels
}

export const PALETTES: Record<PaletteKey, Palette> = {
  ocean: {
    primary:   "#6366f1",   // indigo
    secondary: "#06b6d4",   // cyan
    accent:    "#f59e0b",   // amber
    bg:        "#f8fafc",   // slate-50
    text:      "#1e293b",   // slate-800
  },
  sunset: {
    primary:   "#f97316",   // orange
    secondary: "#ec4899",   // pink
    accent:    "#8b5cf6",   // violet
    bg:        "#fffbeb",   // amber-50
    text:      "#1c1917",   // stone-900
  },
  forest: {
    primary:   "#10b981",   // emerald
    secondary: "#3b82f6",   // blue
    accent:    "#f59e0b",   // amber
    bg:        "#f0fdf4",   // green-50
    text:      "#14532d",   // green-900
  },
  candy: {
    primary:   "#a855f7",   // purple
    secondary: "#f43f5e",   // rose
    accent:    "#22d3ee",   // cyan
    bg:        "#fdf4ff",   // fuchsia-50
    text:      "#1e1b4b",   // indigo-950
  },
};

/**
 * Get a color from the palette by index (wraps around).
 * Useful for giving each element in a set a unique color.
 */
export function paletteColor(palette: PaletteKey, index: number): string {
  const p = PALETTES[palette];
  const colors = [p.primary, p.secondary, p.accent];
  return colors[index % colors.length] ?? p.primary;
}
