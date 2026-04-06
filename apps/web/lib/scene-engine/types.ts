/**
 * @module lib/scene-engine/types
 *
 * Strict type system for animated math scene plans.
 * Zod schemas validate AI-generated plans at runtime.
 * TypeScript types drive the renderer at compile time.
 *
 * Design constraints:
 *  - 7 visual primitives (kept small to prevent AI hallucination)
 *  - 8 animation presets (enough for Duolingo-style, not noisy)
 *  - All positions in a 800x500 SVG viewBox coordinate space
 *  - Max 30 seconds total, max 8 steps per scene
 */

import { z } from "zod";

// ═════════════════════════════════════════════════════════════════════════════
// 1. Enums
// ═════════════════════════════════════════════════════════════════════════════

export const PRIMITIVE_TYPES = [
  "dot",        // circle — for arrays, counting, groups
  "bar",        // rectangle — for fractions, bar models, place value
  "numberLine", // line with ticks — for addition, subtraction, hops
  "mathText",   // text label — for equations, annotations, values
  "arrow",      // directional arrow — for hops, flows, connections
  "brace",      // curly/square brace — for grouping, totals
  "group",      // container — for visual grouping with optional outline
] as const;

export const ANIMATION_PRESETS = [
  "fadeIn",     // opacity 0 → 1
  "pop",        // scale 0 → 1.1 → 1 (spring)
  "slideUp",    // y+30 → 0, opacity 0 → 1
  "slideLeft",  // x+30 → 0, opacity 0 → 1
  "highlight",  // brief glow / color pulse
  "move",       // translate from current position to params.to
  "draw",       // stroke-dasharray reveal (for lines, arrows)
  "crossOut",   // strikethrough line animates across element
] as const;

export const PALETTE_KEYS = [
  "ocean",      // blues + teals (calm, default)
  "sunset",     // warm oranges + corals (energetic)
  "forest",     // greens + earth tones (growth)
  "candy",      // bright mixed (playful, child-friendly)
] as const;

export type PrimitiveType   = typeof PRIMITIVE_TYPES[number];
export type AnimationPreset = typeof ANIMATION_PRESETS[number];
export type PaletteKey      = typeof PALETTE_KEYS[number];

// ═════════════════════════════════════════════════════════════════════════════
// 2. Primitive prop schemas
// ═════════════════════════════════════════════════════════════════════════════

const DotPropsSchema = z.object({
  cx: z.number().min(0).max(800),
  cy: z.number().min(0).max(500),
  r:  z.number().min(2).max(40).default(12),
  fill: z.string().default("currentColor"),
  label: z.string().optional(),
});

const BarPropsSchema = z.object({
  x: z.number(), y: z.number(),
  width:  z.number().min(1).max(800),
  height: z.number().min(1).max(500),
  fill: z.string().default("currentColor"),
  label: z.string().optional(),
  divisions: z.number().min(1).max(20).optional(),
  filledDivisions: z.number().min(0).optional(),
  rx: z.number().default(4),
});

const NumberLinePropsSchema = z.object({
  x1: z.number(), y1: z.number(),
  x2: z.number(), y2: z.number().optional(),
  min: z.number(), max: z.number(),
  step: z.number().min(0.1),
  markers: z.array(z.object({
    value: z.number(),
    label: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
  hops: z.array(z.object({
    from: z.number(), to: z.number(),
    label: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
});

const MathTextPropsSchema = z.object({
  x: z.number(), y: z.number(),
  text: z.string().min(1),
  fontSize: z.number().min(8).max(72).default(24),
  color: z.string().default("#1e293b"),
  anchor: z.enum(["start", "middle", "end"]).default("middle"),
  fontWeight: z.enum(["normal", "bold", "black"]).default("bold"),
});

const ArrowPropsSchema = z.object({
  x1: z.number(), y1: z.number(),
  x2: z.number(), y2: z.number(),
  color: z.string().default("#64748b"),
  strokeWidth: z.number().default(2),
  label: z.string().optional(),
  curved: z.boolean().default(false),
  curveHeight: z.number().default(40),
});

const BracePropsSchema = z.object({
  x: z.number(), y: z.number(),
  width: z.number().min(1),
  height: z.number().min(1),
  side: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
  label: z.string().optional(),
  color: z.string().default("#64748b"),
});

const GroupPropsSchema = z.object({
  x: z.number(), y: z.number(),
  width: z.number().min(1),
  height: z.number().min(1),
  outline: z.boolean().default(false),
  outlineColor: z.string().default("#cbd5e1"),
  fill: z.string().default("transparent"),
  rx: z.number().default(8),
  label: z.string().optional(),
});

// Union of all primitive props (discriminated by parent element's `type`)
export const PrimitivePropsSchema = z.union([
  DotPropsSchema,
  BarPropsSchema,
  NumberLinePropsSchema,
  MathTextPropsSchema,
  ArrowPropsSchema,
  BracePropsSchema,
  GroupPropsSchema,
]);

// ═════════════════════════════════════════════════════════════════════════════
// 3. Animation schema
// ═════════════════════════════════════════════════════════════════════════════

export const AnimationSchema = z.object({
  target:   z.string().min(1),                         // element id
  preset:   z.enum(ANIMATION_PRESETS),
  delay:    z.number().min(0).max(10).default(0),      // seconds from step start
  duration: z.number().min(0.1).max(5).default(0.5),   // seconds
  params: z.object({
    to:    z.object({ x: z.number(), y: z.number() }).optional(),   // for "move"
    color: z.string().optional(),                                    // for "highlight"
  }).optional(),
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Scene element schema
// ═════════════════════════════════════════════════════════════════════════════

export const ElementSchema = z.object({
  id:    z.string().min(1),
  type:  z.enum(PRIMITIVE_TYPES),
  props: z.record(z.unknown()),            // validated per-type at render time
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Scene step schema
// ═════════════════════════════════════════════════════════════════════════════

export const StepSchema = z.object({
  id:        z.string().min(1),
  duration:  z.number().min(0.5).max(10),  // seconds for this step
  narration: z.string().max(200).optional(), // text shown to student
  elements:  z.array(ElementSchema).min(1).max(30),
  animations: z.array(AnimationSchema).max(30).default([]),
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. Scene plan schema (top-level document)
// ═════════════════════════════════════════════════════════════════════════════

export const ScenePlanSchema = z.object({
  id:       z.string().min(1),
  title:    z.string().min(1).max(100),
  topic:    z.string().min(1).max(60),       // e.g. "Multiplication", "Fractions"
  grade:    z.string().optional(),            // e.g. "G3", "G5"
  palette:  z.enum(PALETTE_KEYS).default("ocean"),
  duration: z.number().min(1).max(30),        // total seconds, hard cap 30
  steps:    z.array(StepSchema).min(1).max(8),
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. Inferred TypeScript types
// ═════════════════════════════════════════════════════════════════════════════

export type DotProps        = z.infer<typeof DotPropsSchema>;
export type BarProps        = z.infer<typeof BarPropsSchema>;
export type NumberLineProps = z.infer<typeof NumberLinePropsSchema>;
export type MathTextProps   = z.infer<typeof MathTextPropsSchema>;
export type ArrowProps      = z.infer<typeof ArrowPropsSchema>;
export type BraceProps      = z.infer<typeof BracePropsSchema>;
export type GroupProps      = z.infer<typeof GroupPropsSchema>;

export type SceneAnimation  = z.infer<typeof AnimationSchema>;
export type SceneElement    = z.infer<typeof ElementSchema>;
export type SceneStep       = z.infer<typeof StepSchema>;
export type ScenePlan       = z.infer<typeof ScenePlanSchema>;
