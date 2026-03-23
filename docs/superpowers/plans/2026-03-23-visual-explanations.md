# Visual Explanations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add animated step-by-step walkthroughs and AI-generated concept images to MathAI's practice and Ask MathAI surfaces.

**Architecture:** Extend the existing `VisualPlan` discriminated union with two new variants (`animated_walkthrough`, `concept_image`). `VisualRenderer` gains two new case branches. A `StepPlayer` component wraps existing diagrams with playback controls. An `imageGenerationService` calls AI Gateway for concept images, cached in Vercel Blob + PostgreSQL.

**Tech Stack:** Next.js (App Router), React, TypeScript, Prisma, Express, Vercel AI Gateway (`google/gemini-3.1-flash-image-preview`), `@vercel/blob`, CSS transitions.

**Spec:** `docs/superpowers/specs/2026-03-23-visual-explanations-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `packages/shared-types/visual.ts` | NOT created — types go directly in `packages/shared-types/index.ts` |
| `apps/web/hooks/useStepPlayer.ts` | Step state machine: current step, auto-play timer, play/pause/next/back/replay |
| `apps/web/components/mathai/visual/StepPlayer.tsx` | Wraps any diagram with step playback (merges visibleState, renders controls) |
| `apps/web/components/mathai/visual/StepControls.tsx` | Play/pause/next/back/replay button bar |
| `apps/web/components/mathai/visual/StepLabel.tsx` | "Step 2 of 4: ..." indicator with progress bar and aria-live |
| `apps/web/components/mathai/visual/ConceptImage.tsx` | AI-generated image card with caption |
| `apps/web/components/mathai/visual/ImageWithFallback.tsx` | Image element with skeleton loader + error state |
| `ai/services/imageGenerationService.ts` | AI Gateway image generation + Vercel Blob upload + DB cache lookup |

### Modified Files
| File | What Changes |
|------|-------------|
| `packages/shared-types/index.ts` | Add `AnimatedWalkthroughData`, `WalkthroughStep`, `ConceptImageData` interfaces. Extend `VisualPlan` union. Add `visualStrategy` to `TutorResponse` and `AskMathAIResponse`. |
| `types/index.ts` | Add `"animated_walkthrough"` and `"concept_image"` to `VisualPlanPayload.diagramType`. Add `visualStrategy` to `TutorHelpResponse`. |
| `database/schema/schema.prisma` | Add `ConceptImage` model. Add `imageGensToday` + `imageGenDate` to `StudentProfile`. |
| `apps/web/components/mathai/visual/VisualRenderer.tsx` | Add case branches for `"animated_walkthrough"` and `"concept_image"`. Import new components. |
| `ai/services/askMathAIService.ts` | Add visual strategy instructions to `SYSTEM_PROMPT`. Add `visualStrategy` to response type and JSON schema. |
| `ai/tutor/explanation_engine.ts` | Add `visualStrategy` to template outputs. |
| `api/routes/tutor.routes.ts` | Wire `imageGenerationService` — after AI response, if `visualStrategy === "concept_image"`, generate/cache image before returning. |
| `apps/web/components/mathai/practice/PracticeView.tsx` | Add `VisualRenderer` to the hint/explanation display area. |

---

## Task 1: Extend Types (Frontend + Backend)

**Files:**
- Modify: `packages/shared-types/index.ts:325-410`
- Modify: `types/index.ts:614-618`

- [ ] **Step 1: Add new data shape interfaces to shared-types**

In `packages/shared-types/index.ts`, add these interfaces BEFORE the `VisualPlan` type (before line 365):

```typescript
// ─── Animated Walkthrough ────────────────────────────────────────────────────

export interface WalkthroughStep {
  stepNumber: number;
  label: string;
  /** Shallow-merged with baseData for this step's render. */
  visibleState: Record<string, unknown>;
  highlightElements?: string[];
}

export interface AnimatedWalkthroughData {
  title: string;
  steps: WalkthroughStep[];
  baseDiagram: "number_line" | "fraction_bar" | "array" | "bar_model" | "place_value_chart";
  baseData: NumberLineData | FractionBarData | ArrayData | BarModelData | PlaceValueChartData;
  autoPlay?: boolean;
  stepDurationMs?: number;
}

// ─── AI-Generated Concept Image ──────────────────────────────────────────────

export interface ConceptImageData {
  imageUrl: string;
  altText: string;
  caption: string;
  prompt?: string;
  cached: boolean;
}
```

- [ ] **Step 2: Extend the VisualPlan union**

Replace the existing `VisualPlan` type at line 365-372 with:

```typescript
export type VisualPlan =
  | { diagramType: "number_line";           data: NumberLineData }
  | { diagramType: "fraction_bar";          data: FractionBarData }
  | { diagramType: "array";                 data: ArrayData }
  | { diagramType: "bar_model";             data: BarModelData }
  | { diagramType: "place_value_chart";     data: PlaceValueChartData }
  | { diagramType: "animated_walkthrough";  data: AnimatedWalkthroughData }
  | { diagramType: "concept_image";         data: ConceptImageData }
  | { diagramType: "coordinate_grid";       data: Record<string, unknown> }
  | { diagramType: "none";                  data: Record<string, unknown> };
```

- [ ] **Step 3: Add `visualStrategy` to response types**

Add to `TutorResponse` (line 302-312), after `similarExample`:

```typescript
  visualStrategy?: "diagram" | "animated_diagram" | "concept_image" | "none";
```

Add to `AskMathAIResponse` (line 398-410), after `encouragement`:

```typescript
  visualStrategy?: "diagram" | "animated_diagram" | "concept_image" | "none";
```

- [ ] **Step 4: Extend backend VisualPlanPayload**

In `types/index.ts`, update line 615 to add the new diagram types:

```typescript
  diagramType: "number_line" | "array" | "bar_model" | "fraction_bar" | "place_value_chart" | "coordinate_grid" | "area_model" | "graph" | "table" | "animated_walkthrough" | "concept_image" | "none";
```

Add `visualStrategy` to `TutorHelpResponse` (line 820-826), after `similarExample`:

```typescript
  visualStrategy?: "diagram" | "animated_diagram" | "concept_image" | "none";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors (existing errors may be present)

- [ ] **Step 6: Commit**

```bash
git add packages/shared-types/index.ts types/index.ts
git commit -m "feat(types): add animated_walkthrough and concept_image to VisualPlan union"
```

---

## Task 2: Database Schema — ConceptImage + Rate Limit Fields

**Files:**
- Modify: `database/schema/schema.prisma`

- [ ] **Step 1: Add ConceptImage model to schema.prisma**

Add at the end of the file, before any closing comments:

```prisma
// ─── Visual Explanation Cache ────────────────────────────────────────────────

/// Caches AI-generated concept images to avoid regeneration.
/// Key: conceptKey + grade. One image per concept per grade level.
model ConceptImage {
  id          String   @id @default(cuid())
  conceptKey  String   // e.g., "multiplication-groups"
  grade       Grade
  prompt      String   // The prompt used to generate
  imageUrl    String   // Vercel Blob URL
  altText     String
  caption     String
  createdAt   DateTime @default(now())

  @@unique([conceptKey, grade])
  @@index([conceptKey])
}
```

- [ ] **Step 2: Add rate limit fields to StudentProfile**

In the `StudentProfile` model (line 282), add after the `avgConfidenceScore` field (around line 319):

```prisma
  /// Daily image generation rate limit counter. Reset when imageGenDate changes.
  imageGensToday  Int       @default(0)
  imageGenDate    DateTime? // The date of the last image generation count
```

- [ ] **Step 3: Generate and apply migration**

Run: `cd database && npx prisma migrate dev --name add_concept_images_and_rate_limit`
Expected: Migration created and applied successfully.

- [ ] **Step 4: Generate Prisma client**

Run: `cd database && npx prisma generate`
Expected: Prisma client generated successfully.

- [ ] **Step 5: Commit**

```bash
git add database/schema/schema.prisma database/migrations/
git commit -m "feat(db): add ConceptImage model and image gen rate limit fields"
```

---

## Task 3: useStepPlayer Hook

**Files:**
- Create: `apps/web/hooks/useStepPlayer.ts`

- [ ] **Step 1: Create the hook file**

```typescript
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { WalkthroughStep } from "@mathai/shared-types";

export interface StepPlayerState {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isComplete: boolean;
  step: WalkthroughStep | null;
}

export interface StepPlayerControls {
  play: () => void;
  pause: () => void;
  next: () => void;
  back: () => void;
  replay: () => void;
  goToStep: (n: number) => void;
}

interface UseStepPlayerOptions {
  steps: WalkthroughStep[];
  autoPlay?: boolean;
  stepDurationMs?: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useStepPlayer({
  steps,
  autoPlay = true,
  stepDurationMs = 2000,
}: UseStepPlayerOptions): [StepPlayerState, StepPlayerControls] {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() =>
    autoPlay && !prefersReducedMotion()
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = steps.length;
  const isComplete = currentStep >= totalSteps - 1;

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isPlaying && !isComplete) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const next = Math.min(prev + 1, totalSteps - 1);
          if (next >= totalSteps - 1) {
            // Stop playback outside state updater to avoid side-effect anti-pattern
            queueMicrotask(() => setIsPlaying(false));
          }
          return next;
        });
      }, stepDurationMs);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isComplete, stepDurationMs, totalSteps]);

  const play = useCallback(() => {
    if (isComplete) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  }, [isComplete]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const next = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const back = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const replay = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(true);
  }, []);

  const goToStep = useCallback(
    (n: number) => {
      setIsPlaying(false);
      setCurrentStep(Math.max(0, Math.min(n, totalSteps - 1)));
    },
    [totalSteps]
  );

  const state: StepPlayerState = {
    currentStep,
    totalSteps,
    isPlaying,
    isComplete,
    step: steps[currentStep] ?? null,
  };

  const controls: StepPlayerControls = {
    play,
    pause,
    next,
    back,
    replay,
    goToStep,
  };

  return [state, controls];
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep useStepPlayer`
Expected: No errors related to useStepPlayer

- [ ] **Step 3: Commit**

```bash
git add apps/web/hooks/useStepPlayer.ts
git commit -m "feat: add useStepPlayer hook for animated walkthrough playback"
```

---

## Task 4: StepControls + StepLabel Components

**Files:**
- Create: `apps/web/components/mathai/visual/StepControls.tsx`
- Create: `apps/web/components/mathai/visual/StepLabel.tsx`

- [ ] **Step 1: Create StepControls**

```typescript
"use client";

import type { StepPlayerControls, StepPlayerState } from "@/hooks/useStepPlayer";

interface StepControlsProps {
  state: StepPlayerState;
  controls: StepPlayerControls;
}

export function StepControls({ state, controls }: StepControlsProps) {
  const { isPlaying, isComplete, currentStep, totalSteps } = state;

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 border-t border-indigo-100">
      <button
        onClick={controls.back}
        disabled={currentStep === 0}
        aria-label="Previous step"
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 disabled:opacity-30 transition"
      >
        ⏮ Back
      </button>

      <button
        onClick={isPlaying ? controls.pause : controls.play}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
      >
        {isPlaying ? "⏸ Pause" : isComplete ? "▶ Play" : "▶ Play"}
      </button>

      <button
        onClick={controls.next}
        disabled={isComplete}
        aria-label="Next step"
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 disabled:opacity-30 transition"
      >
        Next ⏭
      </button>

      <button
        onClick={controls.replay}
        aria-label="Replay"
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition"
      >
        ↻ Replay
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create StepLabel**

```typescript
"use client";

interface StepLabelProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export function StepLabel({ currentStep, totalSteps, label }: StepLabelProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-100">
      <div aria-live="polite" aria-atomic>
        <span className="text-amber-600 font-semibold text-sm">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-gray-600 ml-3 text-sm">{label}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={`w-6 h-1 rounded-full transition-colors ${
              i <= currentStep ? "bg-green-400" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep -E "StepControls|StepLabel"`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/mathai/visual/StepControls.tsx apps/web/components/mathai/visual/StepLabel.tsx
git commit -m "feat: add StepControls and StepLabel components for walkthrough playback"
```

---

## Task 5: StepPlayer Component

**Files:**
- Create: `apps/web/components/mathai/visual/StepPlayer.tsx`

- [ ] **Step 1: Create StepPlayer**

This is the key component — it wraps any existing diagram with step-by-step playback. It shallow-merges `visibleState` with `baseData` and passes the result to the diagram component.

```typescript
"use client";

import type { AnimatedWalkthroughData } from "@mathai/shared-types";
import { useStepPlayer } from "@/hooks/useStepPlayer";
import { StepControls } from "./StepControls";
import { StepLabel } from "./StepLabel";
import { NumberLine } from "./NumberLine";
import { FractionBar } from "./FractionBar";
import { ArrayDiagram } from "./ArrayDiagram";
import { BarModel } from "./BarModel";
import { PlaceValueChart } from "./PlaceValueChart";

interface StepPlayerProps {
  data: AnimatedWalkthroughData;
  className?: string;
}

const DIAGRAM_COMPONENTS: Record<string, React.ComponentType<{ data: any; animated?: boolean }>> = {
  number_line: NumberLine,
  fraction_bar: FractionBar,
  array: ArrayDiagram,
  bar_model: BarModel,
  place_value_chart: PlaceValueChart,
};

export function StepPlayer({ data, className }: StepPlayerProps) {
  const { title, steps, baseDiagram, baseData, autoPlay, stepDurationMs } = data;

  const [state, controls] = useStepPlayer({
    steps,
    autoPlay: autoPlay ?? true,
    stepDurationMs: stepDurationMs ?? 2000,
  });

  const DiagramComponent = DIAGRAM_COMPONENTS[baseDiagram];
  if (!DiagramComponent || steps.length === 0) return null;

  // Shallow merge: step's visibleState overrides baseData keys
  const mergedData = state.step
    ? { ...baseData, ...state.step.visibleState }
    : baseData;

  return (
    <div
      className={[
        "rounded-2xl bg-white border border-indigo-100 overflow-hidden",
        className ?? "",
      ].join(" ").trim()}
    >
      {/* Title */}
      {title && (
        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold">
          {title}
        </div>
      )}

      {/* Step indicator */}
      <StepLabel
        currentStep={state.currentStep}
        totalSteps={state.totalSteps}
        label={state.step?.label ?? ""}
      />

      {/* Diagram area with transition */}
      <div className="p-4 transition-opacity duration-300">
        <DiagramComponent data={mergedData} animated={false} />
      </div>

      {/* Playback controls */}
      <StepControls state={state} controls={controls} />
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep StepPlayer`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/mathai/visual/StepPlayer.tsx
git commit -m "feat: add StepPlayer component for animated diagram walkthroughs"
```

---

## Task 6: ImageWithFallback + ConceptImage Components

**Files:**
- Create: `apps/web/components/mathai/visual/ImageWithFallback.tsx`
- Create: `apps/web/components/mathai/visual/ConceptImage.tsx`

- [ ] **Step 1: Create ImageWithFallback**

```typescript
"use client";

import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className="relative">
      {/* Skeleton loader */}
      {status === "loading" && (
        <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading visual...</span>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
          <span className="text-gray-400 text-sm">Visual couldn&apos;t load</span>
        </div>
      )}

      {/* Image — hidden until loaded */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={[
          "w-full rounded-xl object-contain max-h-80",
          status === "loaded" ? "block" : "hidden",
          className ?? "",
        ].join(" ").trim()}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create ConceptImage**

```typescript
"use client";

import type { ConceptImageData } from "@mathai/shared-types";
import { ImageWithFallback } from "./ImageWithFallback";

interface ConceptImageProps {
  data: ConceptImageData;
  className?: string;
}

export function ConceptImage({ data, className }: ConceptImageProps) {
  const { imageUrl, altText, caption } = data;

  return (
    <div
      className={[
        "rounded-2xl bg-white border border-indigo-100 overflow-hidden",
        className ?? "",
      ].join(" ").trim()}
    >
      <div className="p-4">
        <ImageWithFallback src={imageUrl} alt={altText} />
      </div>

      {caption && (
        <div className="px-4 pb-4 text-center">
          <p className="text-gray-700 text-sm font-medium">{caption}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep -E "ConceptImage|ImageWithFallback"`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/mathai/visual/ImageWithFallback.tsx apps/web/components/mathai/visual/ConceptImage.tsx
git commit -m "feat: add ConceptImage and ImageWithFallback components for AI-generated visuals"
```

---

## Task 7: Upgrade VisualRenderer

**Files:**
- Modify: `apps/web/components/mathai/visual/VisualRenderer.tsx`

- [ ] **Step 1: Add imports for new components**

At the top of `VisualRenderer.tsx`, add after the existing imports (after line 18):

```typescript
import { StepPlayer }   from "./StepPlayer";
import { ConceptImage }  from "./ConceptImage";
```

- [ ] **Step 2: Add new case branches**

In the `switch (diagramType)` block, add before the `case "coordinate_grid"` (before line 60):

```typescript
    case "animated_walkthrough":
      // TypeScript narrows `data` to AnimatedWalkthroughData inside this case branch
      diagram = <StepPlayer data={data} className={className} />;
      // StepPlayer renders its own container, skip the wrapper div
      return diagram;

    case "concept_image":
      // TypeScript narrows `data` to ConceptImageData inside this case branch
      diagram = <ConceptImage data={data} className={className} />;
      // ConceptImage renders its own container, skip the wrapper div
      return diagram;
```

- [ ] **Step 3: Verify compilation and existing diagrams still render**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep VisualRenderer`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/mathai/visual/VisualRenderer.tsx
git commit -m "feat: add animated_walkthrough and concept_image cases to VisualRenderer"
```

---

## Task 8: Image Generation Service (Backend)

**Files:**
- Create: `ai/services/imageGenerationService.ts`

**Prerequisites:** `@vercel/blob` must be installed. The `BLOB_READ_WRITE_TOKEN` env var must be set. Check `ai/package.json` or root `package.json` for where to install.

- [ ] **Step 1: Install @vercel/blob in the root workspace**

Run: `pnpm add @vercel/blob` (install at root since the `ai/` directory is not a separate workspace package — it shares the root `package.json`)

- [ ] **Step 2: Create imageGenerationService**

```typescript
/**
 * @module ai/services/imageGenerationService
 *
 * Generates educational concept images via Vercel AI Gateway,
 * caches them in Vercel Blob + PostgreSQL to avoid regeneration.
 *
 * Cache key: conceptKey + grade (one image per concept per grade level).
 * Rate limit: 10 generations per student per day.
 */

import { generateText } from "ai";
import { put } from "@vercel/blob";
import { prisma } from "../../database/client";
import { Grade as PrismaGrade } from "@prisma/client";

const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";
const MAX_DAILY_GENS = 10;
const TIMEOUT_MS = 15_000;

interface GenerateImageRequest {
  imagePrompt: string;
  conceptKey: string;
  grade: string;        // frontend grade string (G1-G10 or K)
  altText: string;
  caption: string;
  userId: string;
}

interface GenerateImageResult {
  imageUrl: string;
  altText: string;
  caption: string;
  prompt: string;
  cached: boolean;
}

/** Map frontend Grade to Prisma Grade enum value. */
function toPrismaGrade(grade: string): PrismaGrade {
  if (grade === "K") return PrismaGrade.K;
  const num = parseInt(grade.replace("G", ""), 10);
  if (isNaN(num) || num < 1) return PrismaGrade.G4; // fallback
  if (num > 8) return PrismaGrade.G8;               // G9, G10 map to G8
  return PrismaGrade[`G${num}` as keyof typeof PrismaGrade];
}

/** Check + increment daily rate limit. Returns true if within limit. */
async function checkRateLimit(userId: string): Promise<boolean> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { imageGensToday: true, imageGenDate: true },
  });
  if (!profile) return false;

  const today = new Date().toISOString().slice(0, 10);
  const lastDate = profile.imageGenDate?.toISOString().slice(0, 10);

  if (lastDate !== today) {
    // New day — reset counter
    await prisma.studentProfile.update({
      where: { userId },
      data: { imageGensToday: 1, imageGenDate: new Date() },
    });
    return true;
  }

  if (profile.imageGensToday >= MAX_DAILY_GENS) return false;

  await prisma.studentProfile.update({
    where: { userId },
    data: { imageGensToday: { increment: 1 } },
  });
  return true;
}

export async function generateConceptImage(
  req: GenerateImageRequest
): Promise<GenerateImageResult | null> {
  const prismaGrade = toPrismaGrade(req.grade);

  // 1. Check cache
  const cached = await prisma.conceptImage.findUnique({
    where: { conceptKey_grade: { conceptKey: req.conceptKey, grade: prismaGrade } },
  });

  if (cached) {
    return {
      imageUrl: cached.imageUrl,
      altText: cached.altText,
      caption: cached.caption,
      prompt: cached.prompt,
      cached: true,
    };
  }

  // 2. Check rate limit
  const withinLimit = await checkRateLimit(req.userId);
  if (!withinLimit) {
    console.warn(`[imageGen] Rate limit reached for user ${req.userId}`);
    return null;
  }

  // 3. Generate image via AI Gateway
  try {
    const prompt = `Educational illustration for children (grade ${req.grade}): ${req.imagePrompt}. Simple, colorful, clear. White background. No text in image.`;

    const result = await generateText({
      model: IMAGE_MODEL as any,
      prompt,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const imageFile = result.files?.[0];
    if (!imageFile) {
      console.error("[imageGen] No image file in AI response");
      return null;
    }

    // 4. Upload to Vercel Blob
    const blob = await put(
      `concept-images/${req.conceptKey}-${prismaGrade}.png`,
      imageFile.base64 ? Buffer.from(imageFile.base64, "base64") : imageFile.data,
      { access: "public", contentType: "image/png" }
    );

    // 5. Cache in DB
    await prisma.conceptImage.create({
      data: {
        conceptKey: req.conceptKey,
        grade: prismaGrade,
        prompt,
        imageUrl: blob.url,
        altText: req.altText,
        caption: req.caption,
      },
    });

    return {
      imageUrl: blob.url,
      altText: req.altText,
      caption: req.caption,
      prompt,
      cached: false,
    };
  } catch (error) {
    console.error("[imageGen] Generation failed:", error);
    return null; // Graceful fallback — explanation works without image
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep imageGenerationService`
Expected: No errors (may need to adjust imports based on project structure)

- [ ] **Step 4: Commit**

```bash
git add ai/services/imageGenerationService.ts
git commit -m "feat: add image generation service with AI Gateway + Blob cache"
```

---

## Task 9: AI Prompt Updates — Ask MathAI

**Files:**
- Modify: `ai/services/askMathAIService.ts:70-79` (SYSTEM_PROMPT)
- Modify: `ai/services/askMathAIService.ts:54-66` (AskMathAIResponse type)

- [ ] **Step 1: Add visual strategy to the BACKEND response type**

**Important:** There are TWO `AskMathAIResponse` types in the codebase:
1. `packages/shared-types/index.ts:398` — the **frontend** type (updated in Task 1 with just `visualStrategy`)
2. `ai/services/askMathAIService.ts:54` — the **backend** local type (updated here with `visualStrategy` + `imagePrompt` + `conceptKey`)

The `imagePrompt` and `conceptKey` fields are **backend-only intermediates** — used by the API route to generate/cache the image, then stripped before the response reaches the frontend. They do NOT belong in shared-types.

In the backend `AskMathAIResponse` at `ai/services/askMathAIService.ts` (line 54-66), add after `encouragement`:

```typescript
  visualStrategy?: "diagram" | "animated_diagram" | "concept_image" | "none";
  imagePrompt?: string;     // Backend-only: used by API route to generate image, not sent to frontend
  conceptKey?: string;       // Backend-only: cache key for concept image lookup
```

- [ ] **Step 2: Update SYSTEM_PROMPT with visual decision instructions**

Append to the end of the `SYSTEM_PROMPT` string (line 70-79), before the closing backtick:

```
- When responding, decide on a visual strategy:
  * "animated_diagram" — when the concept involves a PROCESS (step-by-step solving, building fractions, moving on number line). Return an animated_walkthrough visualPlan.
  * "concept_image" — when a REAL-WORLD picture helps (groups of objects, shapes, measurement). Return conceptKey (e.g., "multiplication-groups"), imagePrompt (describe the image), and a concept_image visualPlan with placeholder imageUrl "__PENDING__".
  * "diagram" — for simple static visuals (single fraction comparison, basic number line). Return a standard visualPlan.
  * "none" — no visual needed (pure arithmetic like "What is 7+3?", yes/no questions).
- Set the "visualStrategy" field in your response to indicate your choice.
```

- [ ] **Step 3: Update the JSON schema instruction in the prompt builder**

In the `buildPrompt` function, find where the JSON response schema is described and add `visualStrategy`, `imagePrompt`, and `conceptKey` as optional fields. This ensures the AI returns them.

- [ ] **Step 4: Commit**

```bash
git add ai/services/askMathAIService.ts
git commit -m "feat: add visual strategy decision to Ask MathAI system prompt"
```

---

## Task 10: AI Prompt Updates — Explanation Engine

**Files:**
- Modify: `ai/tutor/explanation_engine.ts:55+` (EXPLANATIONS templates)

- [ ] **Step 1: Add visualStrategy to ExplanationTemplate interface**

Add to the `ExplanationTemplate` interface (around line 46-53):

```typescript
  visualStrategy: "diagram" | "animated_diagram" | "concept_image" | "none";
```

- [ ] **Step 2: Add visualStrategy to existing templates**

Update each template in the `EXPLANATIONS` record. For example:

- `"fraction-addition"`: set `visualStrategy: "animated_diagram"` (process-based)
- `"multiplication"`: set `visualStrategy: "animated_diagram"` (process-based)
- Any word-problem or real-world templates: set `visualStrategy: "concept_image"`
- Simple arithmetic templates: set `visualStrategy: "none"`

- [ ] **Step 3: Pass visualStrategy through to the ExplanationResult**

Update the `generateExplanation` function to include `visualStrategy` in its return value.

- [ ] **Step 4: Commit**

```bash
git add ai/tutor/explanation_engine.ts
git commit -m "feat: add visualStrategy to explanation engine templates"
```

---

## Task 11: Wire Image Generation into API Route

**Files:**
- Modify: `api/routes/tutor.routes.ts:35-74`

- [ ] **Step 1: Import imageGenerationService**

Add at the top of `tutor.routes.ts`:

```typescript
import { generateConceptImage } from "../../ai/services/imageGenerationService";
```

- [ ] **Step 2: Add image generation after AI response**

In the `router.post("/ask", ...)` handler, after `const response = await askMathAIService.answer(...)` (line 59-70), add image generation logic before `res.json()`:

```typescript
    // If AI chose concept_image, generate/cache the image
    if (response.visualStrategy === "concept_image" && response.imagePrompt && response.conceptKey) {
      const imageResult = await generateConceptImage({
        imagePrompt: response.imagePrompt,
        conceptKey: response.conceptKey,
        grade: resolvedGrade,
        altText: response.imagePrompt,
        caption: response.imagePrompt,
        userId,
      });

      if (imageResult) {
        response.visualPlan = {
          diagramType: "concept_image",
          data: {
            imageUrl: imageResult.imageUrl,
            altText: imageResult.altText,
            caption: imageResult.caption,
            prompt: imageResult.prompt,
            cached: imageResult.cached,
          },
        };
      } else {
        // Fallback: remove the placeholder visual plan
        response.visualPlan = undefined;
      }
    }
```

- [ ] **Step 3: Commit**

```bash
git add api/routes/tutor.routes.ts
git commit -m "feat: wire image generation into Ask MathAI API route"
```

---

## Task 12: Add VisualRenderer to Practice Hint Display

**Files:**
- Modify: `apps/web/components/mathai/practice/PracticeView.tsx:294-304` (hint display area)

- [ ] **Step 1: Import VisualRenderer**

Add to imports in `PracticeView.tsx`:

```typescript
import { VisualRenderer } from "@/components/mathai/visual/VisualRenderer";
```

- [ ] **Step 2: Add visual rendering after hint text**

Currently, hints are rendered as plain text (line 301-304):
```tsx
{hint && !loading && (
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-amber-800 text-sm">
    💡 {hint}
  </div>
)}
```

The hint response needs to be extended to include `visualPlan` data. This requires:
1. Updating the `PracticeView` props interface to accept `visualPlan` alongside `hint`
2. Threading `visualPlan` from `PracticeContainer` through to `PracticeView`
3. Rendering `VisualRenderer` below the hint text when `visualPlan` is present

Add after the hint display block:

```tsx
{visualPlan && !loading && (
  <div className="mb-4">
    <VisualRenderer plan={visualPlan} animated />
  </div>
)}
```

Note: The `visualPlan` prop must be passed from `PracticeContainer` which receives it from the `/practice/hint` and `/practice/explanation` API responses. Check the `TutorResponse` type — it already includes `visualPlan`. You may need to store it in state within `PracticeContainer` alongside `hint`.

- [ ] **Step 3: Thread visualPlan through PracticeContainer**

In `PracticeContainer.tsx`, the `getHint` callback calls `/practice/hint` and stores the hint text. Update it to also store `visualPlan` from the response.

- [ ] **Step 4: Verify the practice flow works**

Run the dev server: `pnpm dev`
Navigate to a practice session, trigger a hint, and verify:
1. Hint text still renders
2. If the response includes a `visualPlan`, the diagram appears below the hint

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/mathai/practice/PracticeView.tsx apps/web/containers/PracticeContainer.tsx
git commit -m "feat: add VisualRenderer to practice hint/explanation display"
```

---

## Task 13: Unit & Component Tests

**Files:**
- Create: `apps/web/hooks/__tests__/useStepPlayer.test.ts`
- Create: `ai/services/__tests__/imageGenerationService.test.ts`

- [ ] **Step 1: Write useStepPlayer hook tests**

Test cases:
- Initial state: `currentStep` is 0, `isPlaying` respects `autoPlay` param
- `next()` increments step, `back()` decrements, both clamp to bounds
- `replay()` resets to step 0 and sets `isPlaying: true`
- `goToStep(n)` jumps to step n, pauses playback
- `isComplete` is true when on last step
- Auto-play timer advances steps (use `jest.advanceTimersByTime`)
- Auto-play stops when reaching last step

- [ ] **Step 2: Run hook tests**

Run: `cd apps/web && npx jest hooks/__tests__/useStepPlayer.test.ts --verbose`
Expected: All tests pass

- [ ] **Step 3: Write imageGenerationService tests**

Test cases (mock Prisma and AI Gateway):
- Cache HIT: returns cached result without calling AI Gateway
- Cache MISS + within rate limit: calls AI Gateway, uploads to Blob, caches in DB
- Rate limit exceeded: returns null without calling AI Gateway
- AI Gateway failure: returns null gracefully (no throw)
- New day resets rate limit counter

- [ ] **Step 4: Run service tests**

Run: `npx jest ai/services/__tests__/imageGenerationService.test.ts --verbose`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/hooks/__tests__/useStepPlayer.test.ts ai/services/__tests__/imageGenerationService.test.ts
git commit -m "test: add unit tests for useStepPlayer hook and imageGenerationService"
```

---

## Task 14: End-to-End Verification

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Test Ask MathAI with a concept that should trigger concept_image**

Go to `/ask`, type: "Show me what 3 groups of 4 looks like"
Expected: AI response includes an AI-generated image (or falls back gracefully if `BLOB_READ_WRITE_TOKEN` is not set).

- [ ] **Step 3: Test Ask MathAI with a process question**

Type: "How do I add 1/2 + 1/3 step by step?"
Expected: AI response includes an animated walkthrough with fraction bars.

- [ ] **Step 4: Test Ask MathAI with simple arithmetic**

Type: "What is 7 + 3?"
Expected: AI response has `visualStrategy: "none"`, no visual diagram generated.

- [ ] **Step 5: Test practice hint flow**

Start a practice session on a topic like fractions, get a question wrong, click "Hint".
Expected: Hint text appears. If the hint response includes a `visualPlan`, the diagram renders below.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: visual explanations system — animated walkthroughs + AI concept images"
```
