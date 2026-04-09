/**
 * @module components/explanations/engine/scene-types
 *
 * Type definitions for the Visual Explanation Engine.
 *
 * ─── Design principles ──────────────────────────────────────────────────────
 *
 * 1. **Single persistent SVG tree.** Every element in a scene lives in the DOM
 *    from mount. Actions mutate their state (reveal, focus, move) over time.
 *    This lets GSAP smoothly animate positions *between* steps.
 *
 * 2. **Data-driven scenes.** A scene is pure data (JSON-serializable). Renderer
 *    factories produce scenes from problem parameters. This keeps teaching
 *    logic separate from rendering.
 *
 * 3. **Step-based timeline.** A scene has N steps; each step is a group of
 *    actions that fire together (with per-action delays). The player controls
 *    step-level playback — forward, backward, or play-all.
 *
 * 4. **ID-based targeting.** Actions reference elements by ID. The timeline
 *    builder queries the SVG root once and resolves target → DOM node.
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. Scene root
// ═════════════════════════════════════════════════════════════════════════════

export interface ExplanationScene {
  id:       string;
  title:    string;
  topic:    string;               // "addition" | "fractions" | "algebra" | ...
  viewBox:  { width: number; height: number };
  palette?: ScenePalette;         // optional color override
  elements: VisualElement[];      // all elements that will ever appear
  steps:    ExplanationStep[];    // ordered teaching steps
}

export interface ScenePalette {
  background: string;             // canvas background
  primary:    string;              // main ink color (text, lines)
  accent:     string;             // highlights, focus
  warm:       string;             // warnings / "attention"
  success:    string;             // answers / completions
  muted:      string;             // dimmed elements
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. Steps
// ═════════════════════════════════════════════════════════════════════════════

export interface ExplanationStep {
  id:         string;
  label?:     string;             // optional step label ("Step 1 of 4")
  narration?: string;             // friendly text explanation shown below canvas
  actions:    VisualAction[];
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. Visual elements — the building blocks of a scene
// ═════════════════════════════════════════════════════════════════════════════

export type VisualElement =
  | TextElement
  | EquationElement
  | RectElement
  | CircleElement
  | LineElement
  | PathElement
  | ArrowElement
  | BraceElement
  | GroupElement;

export interface BaseElement {
  id:          string;
  className?:  string;
  /** If true, element starts visible. Default false (starts hidden until revealed). */
  startVisible?: boolean;
}

export interface TextElement extends BaseElement {
  type:       "text";
  content:    string;
  x:          number;
  y:          number;
  fontSize?:  number;             // default 32
  weight?:    "normal" | "bold" | "black";
  color?:     string;
  anchor?:    "start" | "middle" | "end";  // text-anchor
}

/** Text with multiple parts that can be targeted individually (e.g. "2" + "7" + "+" + "1" + "5"). */
export interface EquationElement extends BaseElement {
  type:    "equation";
  x:       number;
  y:       number;
  fontSize?: number;
  parts:   EquationPart[];
}

export interface EquationPart {
  id:      string;                // unique within parent equation
  content: string;
  color?:  string;
  weight?: "normal" | "bold" | "black";
  spacing?: number;               // extra gap before this part (px)
}

export interface RectElement extends BaseElement {
  type:    "rect";
  x:       number;
  y:       number;
  width:   number;
  height:  number;
  rx?:     number;
  fill?:   string;
  stroke?: string;
  strokeWidth?: number;
}

export interface CircleElement extends BaseElement {
  type:    "circle";
  cx:      number;
  cy:      number;
  r:       number;
  fill?:   string;
  stroke?: string;
  strokeWidth?: number;
}

export interface LineElement extends BaseElement {
  type:    "line";
  x1:      number;
  y1:      number;
  x2:      number;
  y2:      number;
  stroke?: string;
  strokeWidth?: number;
  dash?:   string;                // e.g. "4 4" for dashed
}

/** Any SVG path (use for braces, custom shapes, annotations). */
export interface PathElement extends BaseElement {
  type:    "path";
  d:       string;                // SVG path data
  stroke?: string;
  strokeWidth?: number;
  fill?:   string;
}

export interface ArrowElement extends BaseElement {
  type:    "arrow";
  x1:      number;
  y1:      number;
  x2:      number;
  y2:      number;
  color?:  string;
  strokeWidth?: number;
  curved?: boolean;               // slight arc from (x1,y1) to (x2,y2)
}

/** Curly brace that visually groups a horizontal or vertical range. */
export interface BraceElement extends BaseElement {
  type:       "brace";
  x1:         number;
  y1:         number;
  x2:         number;
  y2:         number;
  direction?: "top" | "bottom" | "left" | "right";
  color?:     string;
  strokeWidth?: number;
}

/** Pure container — bundles child element IDs for batched actions. */
export interface GroupElement extends BaseElement {
  type:     "group";
  children: string[];             // element IDs to group
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. Actions — what happens during a step
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Actions share a common base:
 *   - target:   element ID (or array of IDs) to act on
 *   - delay:    offset within the step (seconds)
 *   - duration: animation duration (seconds)
 */
export type VisualAction =
  | RevealAction
  | FocusAction
  | DrawAction
  | MoveAction
  | ReplaceAction
  | DimAction
  | WaitAction;

interface ActionBase {
  delay?:    number;              // offset from step start, seconds (default 0)
  duration?: number;              // animation duration, seconds
}

/** Fade/slide in an element that was hidden. */
export interface RevealAction extends ActionBase {
  type:   "reveal";
  target: string | string[];
  from?:  "fade" | "top" | "bottom" | "left" | "right" | "pop";
}

/** Emphasize an element with pulse / glow / scale. */
export interface FocusAction extends ActionBase {
  type:    "focus";
  target:  string | string[];
  effect?: "pulse" | "glow" | "scale" | "color";
  color?:  string;                // for "color" effect
}

/**
 * Draw an SVG path stroke progressively (DrawSVG-style).
 * Works on line / path / arrow / brace elements.
 */
export interface DrawAction extends ActionBase {
  type:   "draw";
  target: string | string[];
}

/** Translate an element to a new position. */
export interface MoveAction extends ActionBase {
  type:   "move";
  target: string;
  to:     { x?: number; y?: number; dx?: number; dy?: number };
}

/** Smoothly swap one element for another (fade out + fade in). */
export interface ReplaceAction extends ActionBase {
  type: "replace";
  from: string;                   // element to hide
  to:   string;                   // element to show
}

/** Reduce opacity of irrelevant elements to focus attention. */
export interface DimAction extends ActionBase {
  type:    "dim";
  target:  string | string[];
  opacity?: number;               // default 0.25
}

/** Insert a pause within a step. */
export interface WaitAction extends ActionBase {
  type:     "wait";
  duration: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. Defaults
// ═════════════════════════════════════════════════════════════════════════════

export const DEFAULT_PALETTE: ScenePalette = {
  background: "#fafbff",
  primary:    "#1e293b",          // slate-800
  accent:     "#6366f1",          // indigo-500
  warm:       "#f59e0b",          // amber-500
  success:    "#10b981",          // emerald-500
  muted:      "#94a3b8",          // slate-400
};

export const DEFAULT_DURATIONS = {
  reveal:  0.5,
  focus:   0.6,
  draw:    0.8,
  move:    0.7,
  replace: 0.5,
  dim:     0.4,
} as const;
