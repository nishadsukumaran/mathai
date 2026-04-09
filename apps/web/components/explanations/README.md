# Visual Explanation Engine

A structured, reusable engine for animated math explanations in MathAI.

Built with **GSAP + SVG + DrawSVG**. Designed for clarity, consistency, and extensibility — not one-off animations.

---

## Quick start

```tsx
import { VisualExplanationPlayer, dispatchExplanation } from "@/components/explanations";

// Dispatch from a problem text — returns null if no renderer matches
const scene = dispatchExplanation({ text: "27 + 15" });

if (scene) {
  return <VisualExplanationPlayer scene={scene} textFallback="Add the ones column first..." />;
}
```

Or construct a scene directly:

```tsx
import { buildAdditionRegroupingScene, VisualExplanationPlayer } from "@/components/explanations";

const scene = buildAdditionRegroupingScene(27, 15);
<VisualExplanationPlayer scene={scene} />
```

## Architecture

```
components/explanations/
├── engine/
│   ├── scene-types.ts       Type definitions (ExplanationScene, elements, actions)
│   ├── gsap-setup.ts        Plugin registration (client-only, idempotent)
│   ├── primitives.ts        The 7 animation primitives (reveal/focus/draw/move/replace/dim/wait)
│   ├── timeline-builder.ts  Scene + SVG root → GSAP master timeline
│   └── SceneCanvas.tsx      Pure SVG renderer (mounts all elements at once)
├── player/
│   └── VisualExplanationPlayer.tsx   Play/Pause/Prev/Next/Speed/Visual-toggle
├── renderers/
│   ├── arithmetic/
│   │   └── additionRegrouping.ts     buildAdditionRegroupingScene(a, b)
│   ├── fractions/
│   │   └── fractionComparison.ts     buildFractionComparisonScene({num1,den1,num2,den2})
│   └── algebra/
│       └── simpleEquation.ts         buildSimpleEquationScene({b, c})
├── dispatch.ts              Routes problem text → renderer
└── index.ts                 Public API
```

## Design philosophy

1. **Single persistent SVG tree.** Every element lives in the DOM from mount — hidden with `opacity: 0` until revealed. This lets GSAP animate elements *smoothly between steps* (moves, transforms, cancellations).

2. **Data-driven scenes.** A scene is pure JSON data: `{ elements, steps }`. Renderer factories are pure functions: `(params) => ExplanationScene`. No JSX, no React state, no side effects. This makes them testable, serializable, and cacheable.

3. **Step-based timeline.** A scene has N teaching steps. Each step is a group of actions that run together. The player controls step-level playback — forward, backward, or play-all with auto-advance.

4. **ID-based targeting.** Actions reference elements by ID. The timeline builder queries the SVG root and resolves `target` → DOM node. No refs, no React state threading.

5. **Small primitive vocabulary.** Only 7 primitives: `reveal`, `focus`, `draw`, `move`, `replace`, `dim`, `wait`. Everything a renderer does must map to one of these. This keeps the visual language consistent.

## The 7 primitives

| Primitive | Purpose | Example use |
|-----------|---------|-------------|
| `reveal`  | Bring a hidden element into view | "Show the ones column result" |
| `focus`   | Emphasize an element (pulse/glow/scale/color) | "Highlight the +3 term" |
| `draw`    | Animate SVG stroke from 0%→100% (via DrawSVGPlugin) | "Trace the focus box" / "Draw the arrow" |
| `move`    | Translate an element to a new position | "Move the carry digit to the tens column" |
| `replace` | Cross-fade one element into another | "Transform 42 into 3 tens + 12 ones" |
| `dim`     | Reduce opacity of irrelevant elements | "Fade the tens column while focusing on ones" |
| `wait`    | Pause for N seconds | "Hold the moment before the answer" |

## Adding a new explanation type

### 1. Write the renderer factory

Create a new file under `renderers/<category>/<name>.ts`. It must export a function that returns an `ExplanationScene`:

```ts
// renderers/arithmetic/subtractionBorrowing.ts
import type { ExplanationScene } from "../../engine/scene-types";

export function buildSubtractionBorrowingScene(a: number, b: number): ExplanationScene {
  return {
    id:    `subtraction-borrowing-${a}-${b}`,
    title: `${a} - ${b}`,
    topic: "Subtraction",
    viewBox: { width: 800, height: 500 },
    elements: [
      // ...all SVG elements the scene will ever contain, with unique IDs
    ],
    steps: [
      {
        id: "s1-setup",
        narration: "Let's line up the numbers.",
        actions: [
          { type: "reveal", target: "a-digit", from: "pop", duration: 0.5 },
          // ...
        ],
      },
      // ...more steps
    ],
  };
}
```

### 2. Register in dispatch.ts

Add a pattern matcher and a type case:

```ts
// dispatch.ts
const subtractionMatch = text.match(/^(\d+)\s*-\s*(\d+)/);
if (subtractionMatch) {
  const a = parseInt(subtractionMatch[1]!, 10);
  const b = parseInt(subtractionMatch[2]!, 10);
  if (a >= 10 && a < 100 && b >= 10 && b < 100 && (a % 10) < (b % 10)) {
    return buildSubtractionBorrowingScene(a, b);
  }
}
```

### 3. Export from index.ts

```ts
export { buildSubtractionBorrowingScene } from "./renderers/arithmetic/subtractionBorrowing";
```

### 4. Preview in the demo page

Add an entry to `DEMOS` in `apps/web/app/explanations-demo/page.tsx` to verify visually.

## Layout guidelines

- **ViewBox**: 800 × 500 is the standard canvas. Scale elements accordingly.
- **Font sizes**: 72-80px for big numbers, 44-56px for equations, 22-32px for labels.
- **Colors**: Use the default palette (`DEFAULT_PALETTE` in `scene-types.ts`). Only override for topic-specific highlights.
- **Focus highlights**: Use rectangles with `stroke: palette.warm` (amber) and `rx: 10` for rounded corners.
- **Answer reveals**: Use `color: palette.success` (emerald) for final results.
- **Dimming**: Use `opacity: 0.25` for de-emphasized elements; `0.15` for heavily backgrounded.

## Accessibility

The player respects `prefers-reduced-motion`: when enabled, all elements render in their final visible state immediately with no animations. Narration text is always shown below the canvas.

The "Show as text" button in the header toggles to a plain-text fallback mode — useful for students who prefer reading or have accessibility needs.

## Fallback behavior

`dispatchExplanation` returns `null` when no renderer matches. Always handle the null case:

```tsx
const scene = dispatchExplanation({ text: problem });
return scene
  ? <VisualExplanationPlayer scene={scene} textFallback={textExplanation} />
  : <PlainTextExplanation text={textExplanation} />;
```

The `textFallback` prop is shown when the user clicks "Text" in the player header.

## Migration note

This engine is the **replacement** for the older `lib/scene-engine/` + `components/scene-engine/` module, which used Framer Motion with step-wipe `AnimatePresence`. The old engine is still used by Ask MathAI and Practice recovery — those integrations will be migrated in a follow-up. Do not import from the old paths in new code.

## Known limits (v1)

- No LaTeX rendering inside SVG text — use plain text with manual formatting.
- Equation parts use monospace-approximated spacing, not real font metrics.
- Only three renderers are wired (addition regrouping, fraction comparison, simple equation). More can be added using the same pattern.
- `move` actions reset on step boundaries if the player steps backward — this is a known edge case in the stepping model.
