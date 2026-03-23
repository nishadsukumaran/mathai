# Visual Explanations System — Design Spec

**Date:** 2026-03-23
**Status:** Approved
**Surfaces:** Practice explanations, Ask MathAI responses

## Summary

Add rich visual explanations to MathAI's two primary learning surfaces (practice and Ask MathAI). Two new visual types join the existing SVG diagram system:

1. **Animated step-by-step walkthroughs** — existing SVG diagrams (NumberLine, FractionBar, etc.) wrapped in a StepPlayer that reveals each solving step progressively with auto-play and manual controls.
2. **AI-generated concept images** — custom illustrations generated via Vercel AI Gateway (`google/gemini-3.1-flash-image-preview`), cached per concept+grade in Vercel Blob.

The AI decides when visuals add value — simple arithmetic gets `"none"`, process-based problems get animated walkthroughs, real-world concepts get generated images.

## Design Decisions

### Approach: Unified Visual System (Approach C)

Extends the existing `VisualPlan` discriminated union with new variants rather than building a parallel system. Rationale:
- `VisualRenderer` remains the single dispatch point
- `AskPageContent` already renders `<VisualRenderer plan={response.visualPlan} />` and automatically picks up new types
- Practice surface needs new wiring — `PracticeView` does not currently render `VisualRenderer`, so we add it to the explanation/teach flow within the practice UI
- Backward compatible — all existing `diagramType` values continue to work
- Each existing diagram component opts into animation support independently

Rejected alternatives:
- **Approach A (bolt-on):** Adding animation to existing diagrams without a StepPlayer abstraction — fragile, duplicated animation logic per component.
- **Approach B (parallel system):** Building a separate `VisualExplanation` system alongside `VisualPlan` — two systems to maintain, coordination overhead on frontend.

### Visual Strategy: Hybrid (selective generation)

The AI chooses when visuals help:
- `"animated_diagram"` — process-based concepts (step-by-step solving)
- `"concept_image"` — real-world illustration (groups, shapes, measurement)
- `"diagram"` — simple static diagram (existing behavior)
- `"none"` — no visual needed (pure arithmetic, simple questions)

Images are cached per concept+grade, not per question.

### Animation Model: Auto-play + Controls

- Walkthroughs auto-play by default (2s per step)
- Full controls: play/pause, next/back, replay
- Step progress indicator with label ("Step 2 of 4: Convert to common denominator")

## Types & Data Model

### Dual Type System — Frontend vs. Backend

The codebase has two separate visual plan types that must both be updated:

- **Frontend** (`packages/shared-types/index.ts`): `VisualPlan` — discriminated union with strongly typed `data` fields per diagram type. Used by `VisualRenderer` and all frontend components.
- **Backend** (`types/index.ts`): `VisualPlanPayload` — looser type with `data: Record<string, unknown>` and an extra `caption: string` field. Has additional diagram types (`"area_model"`, `"graph"`, `"table"`) not in the frontend type. Used by AI services and the explanation engine.

**Strategy:** Add new variants to both types. The API layer (`api/routes/tutor.ts`) already transforms `VisualPlanPayload` → `VisualPlan` when sending responses — the new types follow the same pattern. The backend `VisualPlanPayload` gets `"animated_walkthrough"` and `"concept_image"` added to its `diagramType` union. The frontend `VisualPlan` gets the strongly-typed variants. No unification of these types is attempted — that's a separate refactor.

### Grade Enum Mismatch

The Prisma `Grade` enum includes `K` and goes up to `G8`. The frontend `shared-types` `Grade` type includes `G9`, `G10` but excludes `K`. The `ConceptImage` model uses the Prisma `Grade` enum. The image generation service must map the frontend grade to the Prisma grade — grades `G9` and `G10` map to `G8` (highest available), and frontend requests must handle `K` correctly.

### Type Evolution

`VisualPlan` gains two new variants. Old name preserved as alias for backward compatibility.

```typescript
export type VisualExplanation =
  // Existing (unchanged)
  | { diagramType: "number_line";       data: NumberLineData }
  | { diagramType: "fraction_bar";      data: FractionBarData }
  | { diagramType: "array";             data: ArrayData }
  | { diagramType: "bar_model";         data: BarModelData }
  | { diagramType: "place_value_chart"; data: PlaceValueChartData }
  // New
  | { diagramType: "animated_walkthrough"; data: AnimatedWalkthroughData }
  | { diagramType: "concept_image";        data: ConceptImageData }
  // Unchanged
  | { diagramType: "coordinate_grid";   data: Record<string, unknown> }
  | { diagramType: "none";              data: Record<string, unknown> }

export type VisualPlan = VisualExplanation;
```

### New Data Shapes

```typescript
interface AnimatedWalkthroughData {
  title: string;
  steps: WalkthroughStep[];
  baseDiagram: "number_line" | "fraction_bar" | "array" | "bar_model" | "place_value_chart";
  baseData: NumberLineData | FractionBarData | ArrayData | BarModelData | PlaceValueChartData;
  autoPlay?: boolean;        // default true
  stepDurationMs?: number;   // default 2000
}

interface WalkthroughStep {
  stepNumber: number;
  label: string;
  // Partial override of baseData for this step.
  // Merge semantics: SHALLOW MERGE with baseData. Each key in visibleState
  // replaces the corresponding key in baseData for this step's render.
  // Keys not present in visibleState use baseData's values.
  // Example: for a fraction_bar, step 1 might set { fractions: [first_only] }
  // while baseData has all fractions — step 1 shows only the first bar.
  visibleState: Record<string, unknown>;
  highlightElements?: string[];  // element IDs within the SVG to pulse/highlight
}

interface ConceptImageData {
  imageUrl: string;          // Vercel Blob URL
  altText: string;
  caption: string;
  prompt?: string;           // generation prompt (debug)
  cached: boolean;
}
```

### Response Type Changes

Added to `TutorResponse` and `AskMathAIResponse`:

```typescript
visualStrategy: "diagram" | "animated_diagram" | "concept_image" | "none";
```

### Database: ConceptImage Model

```prisma
model ConceptImage {
  id          String   @id @default(cuid())
  conceptKey  String   // e.g., "multiplication-groups"
  grade       Grade
  prompt      String
  imageUrl    String   // Vercel Blob URL
  altText     String
  caption     String
  createdAt   DateTime @default(now())

  @@unique([conceptKey, grade])
  @@index([conceptKey])
}
```

## Component Architecture

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `StepPlayer` | `apps/web/components/mathai/visual/StepPlayer.tsx` | Wraps any diagram with playback (auto-play + controls) |
| `StepControls` | `apps/web/components/mathai/visual/StepControls.tsx` | Play/pause/next/back/replay buttons |
| `StepLabel` | `apps/web/components/mathai/visual/StepLabel.tsx` | Step indicator ("Step 2 of 4: ...") |
| `ConceptImage` | `apps/web/components/mathai/visual/ConceptImage.tsx` | AI image card with loading/error/caption |
| `ImageWithFallback` | `apps/web/components/mathai/visual/ImageWithFallback.tsx` | Image with skeleton loader + error state |

### New Hook

| Hook | Location | Purpose |
|------|----------|---------|
| `useStepPlayer` | `apps/web/hooks/useStepPlayer.ts` | Step state, auto-play timer, control handlers |

### Component Hierarchy

```
VisualRenderer (upgraded, single dispatch point)
├── NumberLine          (existing, unchanged — StepPlayer handles step data externally)
├── FractionBar         (existing, unchanged)
├── ArrayDiagram        (existing, unchanged)
├── BarModel            (existing, unchanged)
├── PlaceValueChart     (existing, unchanged)
├── StepPlayer          (NEW — wraps any diagram for animated walkthroughs)
│   ├── StepControls    (NEW — play/pause/next/back/replay buttons)
│   ├── StepLabel       (NEW — "Step 2 of 4: ..." with aria-live)
│   └── {BaseDiagram}   (any existing diagram, rendered with step-merged data)
└── ConceptImage        (NEW — AI-generated image card)
    └── ImageWithFallback  (NEW — skeleton → image → error fallback)
    (caption is rendered inline within ConceptImage, not a separate component)
```

**How StepPlayer works with existing diagrams:** StepPlayer does NOT pass a special prop to diagram components. Instead, it shallow-merges `step.visibleState` with `baseData` and passes the merged result as the diagram's normal `data` prop. The diagram component is unaware it's being animated — it just renders whatever data it receives. StepPlayer handles the timeline, transitions (CSS opacity/transform), and highlight overlays externally.

### Data Flow

```
1. Student triggers explanation (practice hint / Ask MathAI)
2. AI returns response with visualStrategy + visualPlan
3. If strategy = "concept_image":
   a. Backend checks ConceptImage table (conceptKey + grade)
   b. Cache HIT → return cached imageUrl
   c. Cache MISS → generate via AI Gateway → upload to Vercel Blob → cache → return
4. Frontend receives response with visualPlan
5. VisualRenderer dispatches to StepPlayer or ConceptImage based on diagramType
6. AskPageContent renders automatically (already uses VisualRenderer).
   PracticeView needs new wiring — add VisualRenderer to the explanation/teach panel within PracticePageContent.
```

## AI Integration

### Prompt Changes

**Explanation engine** (`ai/tutor/explanation_engine.ts`):
- Add `visualStrategy` to template outputs
- Templates specify which concepts benefit from animated walkthroughs vs. images

**Ask MathAI service** (`ai/services/askMathAIService.ts`):
- System prompt gets visual decision instructions:
  - `"animated_diagram"` for process-based solving
  - `"concept_image"` for real-world visualization
  - `"diagram"` for simple static diagrams
  - `"none"` for pure arithmetic

### Image Generation Service

New file: `ai/services/imageGenerationService.ts`

```
1. Receive: imagePrompt, conceptKey, grade
2. Check ConceptImage table for cached result
3. On cache miss:
   a. Call AI Gateway: generateText with model 'google/gemini-3.1-flash-image-preview'
      This is a multimodal LLM that returns images via result.files (not generateImage).
      See Vercel AI SDK docs: generateText → result.files for image output.
   b. Prompt template: "Educational illustration for children: {imagePrompt}.
      Simple, colorful, clear. White background. No text in image."
   c. Extract image from result.files[0] (base64 or buffer)
   d. Upload to Vercel Blob via @vercel/blob put()
   e. Insert into ConceptImage table
   f. On generation FAILURE: return visualPlan with diagramType "none" —
      the explanation still works, just without an image. Log the error.
4. Return: { imageUrl, altText, caption, cached }
```

### Cost Controls

- Images cached per `conceptKey + grade` (not per question)
- Rate limit: max 10 image generations per student per day, tracked via a daily counter on `StudentProfile` (`imageGensToday` + `imageGenDate` fields). Reset when date changes.
- AI instructed to choose `"none"` for simple arithmetic
- No image generation for hints (hints stay lightweight text)
- No Blob eviction strategy needed initially — images are small (~100KB each) and the cache grows slowly (one per concept+grade combo). Revisit if storage exceeds 1GB.

### Error Handling

- **Image generation fails:** Backend returns `visualPlan: { diagramType: "none", data: {} }`. The text explanation is unaffected.
- **Image generation times out:** 15s timeout on the AI Gateway call. On timeout, same fallback as failure.
- **Vercel Blob upload fails:** Same fallback. Image is not cached, will retry on next request.
- **Frontend receives concept_image with broken URL:** `ImageWithFallback` shows error state with message "Visual couldn't load" — never blocks the explanation.

### Accessibility

- `StepPlayer` respects `prefers-reduced-motion` — when enabled, auto-play is disabled and step transitions are instant (no animation).
- Step controls have proper `aria-label` attributes ("Play", "Pause", "Next step", "Previous step", "Replay").
- `StepLabel` is an `aria-live="polite"` region so screen readers announce step changes.
- `ConceptImage` uses `altText` on the `<img>` tag and `caption` is visible text below the image.

### Unchanged Systems

- `ai/tutor/hint_engine.ts` — no changes
- `ai/services/questionGeneratorService.ts` — no changes
- Gamification, auth, profile — no changes

## File Change Summary

### New Files (8)

| File | Purpose |
|------|---------|
| `apps/web/components/mathai/visual/StepPlayer.tsx` | Playback wrapper |
| `apps/web/components/mathai/visual/StepControls.tsx` | Control buttons |
| `apps/web/components/mathai/visual/StepLabel.tsx` | Step indicator |
| `apps/web/components/mathai/visual/ConceptImage.tsx` | Image card |
| `apps/web/components/mathai/visual/ImageWithFallback.tsx` | Image with states |
| `apps/web/hooks/useStepPlayer.ts` | Step state hook |
| `ai/services/imageGenerationService.ts` | Image gen + cache |
| `database/migrations/xxx_add_concept_images.sql` | DB migration |

### Modified Files (8)

| File | Change |
|------|--------|
| `packages/shared-types/index.ts` | New types in VisualPlan union, visualStrategy field |
| `types/index.ts` | Add `"animated_walkthrough"` and `"concept_image"` to `VisualPlanPayload.diagramType` union |
| `apps/web/components/mathai/visual/VisualRenderer.tsx` | Two new case branches |
| `apps/web/app/practice/PracticePageContent.tsx` | Add `VisualRenderer` to explanation/teach panel |
| `ai/tutor/explanation_engine.ts` | visualStrategy in templates |
| `ai/services/askMathAIService.ts` | Visual decision in system prompt |
| `api/routes/tutor.ts` | Wire image generation into response flow |
| `database/schema/schema.prisma` | ConceptImage model + `imageGensToday`/`imageGenDate` on StudentProfile |

### New Dependencies

- `@vercel/blob` — image storage (in `api/` package). Requires `BLOB_READ_WRITE_TOKEN` env var.
- No new frontend dependencies (CSS transitions + requestAnimationFrame for animations)

Note: `visualStrategy` field is added to both frontend (`shared-types`) and backend (`types/index.ts`) response types. `VisualRenderer` imports `VisualPlan` from `@/types` (the local barrel), which re-exports from shared-types.

## Testing Strategy

- **Unit tests:** `useStepPlayer` hook (step transitions, auto-play timer, edge cases)
- **Component tests:** `StepPlayer` renders steps correctly, `ConceptImage` handles loading/error/success
- **Integration tests:** `imageGenerationService` cache hit/miss paths, API route returns correct visualPlan shapes
- **E2E tests:** Practice flow with animated walkthrough, Ask MathAI with concept image
