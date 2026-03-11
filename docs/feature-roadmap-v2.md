# MathAI Feature Roadmap — v2 Implementation Plan

**Scope:** 5 major product capabilities
**Audience:** Engineering + Product
**Date:** March 2026
**Status:** Pre-implementation planning

---

## Codebase Architecture Summary

Before diving into each feature, here's what the current codebase gives us:

**Frontend** (`apps/web/`)
- `app/dashboard/page.tsx` — Server component, fetches data, passes to view
- `app/dashboard/DashboardView.tsx` — Pure presentation, no fetching
- `app/practice/page.tsx` — Client component, direct API calls with Bearer token
- `components/mathai/` — Gamified UI components (XPBar, QuestCard, BadgeChip, TopicCard, StreakCounter, MasteryRing, LessonRow)
- `packages/shared-types/index.ts` — Canonical API contract types

**Backend** (`api/`)
- Express app, JWT auth via NextAuth JWE tokens
- Prisma/PostgreSQL — StudentProfile, TopicProgress, StudentBadge, Streak, PracticeSession, QuestionAttempt
- AI: `ai/tutor/tutor_service` (handles hint + explanation requests), `curriculum/practice_generator`, `curriculum/mastery_evaluator`
- Existing routes: `/dashboard`, `/curriculum`, `/practice/start`, `/practice/submit`, `/practice/hint`, `/practice/explanation`, `/progress`, `/gamification`, `/daily-quests`

**What already exists that we can leverage:**
- `VisualPlan` type is already in `shared-types` with `diagramType` support (number_line, array, bar_model, fraction_bar, place_value_chart, coordinate_grid)
- `TutorResponse` already has `visualPlan?: VisualPlan` field
- `HelpMode` already has `explain_fully`, `teach_concept`, `similar_example`
- `StudentProfile` Prisma model has `learningPace`, `confidenceLevel`, `preferredTheme`
- `User` Prisma model has `gradeLevel`, `name`, `avatarUrl`
- `TopicProgress` Prisma model has `masteryScore`, `accuracyRate`, `isUnlocked`, `isMastered`, `lastPracticedAt`

**What's missing:**
- `preferredExplanationStyle` field on StudentProfile (DB migration needed)
- Visual renderer components (pure UI — types are ready, nothing renders them yet)
- Free-form Ask endpoint (existing tutor endpoints require an active session)
- Practice menu generation service (grade + weakness aware recommendations)
- Profile read/update API endpoints

---

## Feature 1: Ask MathAI

**What it is:** A prominent entry point on the dashboard where a student can paste any math problem or ask any doubt, pick a help mode, and get a full AI-powered explanation — without needing to be in a practice session.

### What's needed

**UI components to create**
- `components/mathai/ask-card.tsx` — The entry card on the dashboard (text input + quick-mode buttons + submit)
- `components/mathai/ask-panel.tsx` — Sliding drawer/sheet that opens when the student asks something; renders the AI response with visual plan support
- The panel reuses the visual renderer from Feature 2

**New API endpoint**
```
POST /api/tutor/ask
Body: { question: string; helpMode: HelpMode; grade: Grade; context?: string }
Auth: Bearer JWT
Response: TutorResponse (existing shared type — already supports text, steps, visualPlan, similarExample)
```

This is essentially the same as `/practice/explanation` but without requiring a sessionId. The tutor_service already supports this; we just need a new route that doesn't gate on session state.

**Help mode buttons in the UI**
```
"Explain visually"    → helpMode: "explain_fully"  (triggers visualPlan in response)
"Teach step by step"  → helpMode: "teach_concept"
"Give a similar example" → helpMode: "similar_example"
"Simplify explanation" → helpMode: "hint_2"  (gentler, simpler breakdown)
```

### Files to create/update

| Action | File |
|--------|------|
| Create | `api/routes/tutor.routes.ts` |
| Create | `api/controllers/tutorController.ts` |
| Update | `api/routes/index.ts` — add `router.use("/tutor", tutorRoutes)` |
| Create | `apps/web/components/mathai/ask-card.tsx` |
| Create | `apps/web/components/mathai/ask-panel.tsx` |
| Update | `apps/web/app/dashboard/DashboardView.tsx` — add AskCard section |
| Update | `packages/shared-types/index.ts` — add `AskRequest` type |

### New shared types needed

```typescript
// packages/shared-types/index.ts (additions)

export interface AskRequest {
  question:  string;
  helpMode:  HelpMode;
  grade:     Grade;
  context?:  string;   // e.g. "working on fractions" — optional context for better responses
}
// Response reuses TutorResponse (already defined)
```

### Can be mocked first? Yes.

The `ask-card` + `ask-panel` can be built entirely with mock responses before the backend endpoint exists. Create a mock `tutorResponse` fixture and toggle with `NEXT_PUBLIC_MOCK_TUTOR=true`.

---

## Feature 2: Visual Explanation Mode

**What it is:** A rendering layer that takes the `VisualPlan` object the tutor already returns and draws the actual diagram — number lines, fraction bars, arrays, place value charts, etc. Currently `VisualPlan` is defined and returned by AI but nothing renders it visually.

### What's needed

**This is 100% UI work — no backend changes, no schema changes.** The `VisualPlan` type contract is complete in `shared-types` and the tutor service already populates it.

**Visual renderer components to create**

All live in `components/mathai/visual/`:

```
visual/
  VisualRenderer.tsx         — dispatcher: reads diagramType, renders correct sub-component
  NumberLine.tsx             — SVG number line with tick marks, highlighted segments, arrows
  FractionBar.tsx            — colored horizontal bars divided into equal parts
  ArrayDiagram.tsx           — grid of circles/squares for multiplication (e.g. 3×4 = 12 dots)
  BarModel.tsx               — Singapore bar model: labeled rectangular bars
  PlaceValueChart.tsx        — columns (H, T, O) with digit blocks
  EquationSteps.tsx          — step-by-step equation transformation (already partially covered by TutorStep)
  GeometryDiagram.tsx        — basic shapes (angle labels, area, perimeter)
```

**VisualRenderer interface**

```typescript
// components/mathai/visual/VisualRenderer.tsx
interface VisualRendererProps {
  plan: VisualPlan;
  animated?: boolean;   // fade-in / draw animation for engagement
  size?: "sm" | "md" | "lg";
}
```

**VisualPlan.data shapes per diagramType**

The backend already sends these — we need to document what each renderer expects so backend and frontend stay in sync:

```typescript
// Add to shared-types for explicit data contracts

// diagramType: "number_line"
interface NumberLineData {
  min: number; max: number; step: number;
  highlight?: [number, number];   // range to shade
  point?: number;                 // single marked point
  arrow?: { from: number; to: number; label?: string };
}

// diagramType: "fraction_bar"
interface FractionBarData {
  fractions: Array<{ numerator: number; denominator: number; label?: string; color?: string }>;
  showEquivalent?: boolean;
}

// diagramType: "array"
interface ArrayData {
  rows: number; cols: number;
  highlightGroups?: Array<{ start: number; size: number; color: string }>;
}

// diagramType: "bar_model"
interface BarModelData {
  bars: Array<{ label: string; value: number; color?: string }>;
  total?: { label: string };
}

// diagramType: "place_value_chart"
interface PlaceValueChartData {
  digits: Record<string, number>;   // { "thousands": 3, "hundreds": 2, "tens": 1, "ones": 5 }
  highlight?: string[];             // columns to highlight
}
```

These types go into `shared-types` and are used to strongly type `VisualPlan.data` via a discriminated union.

### Files to create/update

| Action | File |
|--------|------|
| Create | `apps/web/components/mathai/visual/VisualRenderer.tsx` |
| Create | `apps/web/components/mathai/visual/NumberLine.tsx` |
| Create | `apps/web/components/mathai/visual/FractionBar.tsx` |
| Create | `apps/web/components/mathai/visual/ArrayDiagram.tsx` |
| Create | `apps/web/components/mathai/visual/BarModel.tsx` |
| Create | `apps/web/components/mathai/visual/PlaceValueChart.tsx` |
| Create | `apps/web/components/mathai/visual/index.ts` (barrel) |
| Update | `packages/shared-types/index.ts` — add typed data interfaces per diagramType, replace `VisualPlan.data: Record<string, unknown>` with discriminated union |
| Update | `apps/web/components/mathai/ask-panel.tsx` — wire in VisualRenderer |
| Update | `apps/web/app/practice/page.tsx` — render visual plan when hint/explanation response includes one |

### Can be mocked first? Yes.

Build each visual component in isolation with hard-coded `VisualPlan` data fixtures. No API calls needed to develop and test the rendering layer.

---

## Feature 3: Student Profile Management

**What it is:** A page or modal where the student can view and edit their profile — name, grade, learning pace, confidence level, explanation style preference, avatar/theme. This profile is already partially represented in Prisma; we need to surface it in the UI and add the missing `preferredExplanationStyle` field.

### What's needed

**Database migration** — add `preferredExplanationStyle` to `StudentProfile`

```sql
-- New enum
CREATE TYPE "ExplanationStyle" AS ENUM ('visual', 'step_by_step', 'story', 'analogy', 'direct');

-- New column on student_profiles
ALTER TABLE "student_profiles" ADD COLUMN "preferred_explanation_style" "ExplanationStyle" NOT NULL DEFAULT 'visual';
```

In `schema.prisma`:
```prisma
enum ExplanationStyle {
  visual
  step_by_step
  story
  analogy
  direct
}

model StudentProfile {
  // ... existing fields ...
  preferredExplanationStyle  ExplanationStyle  @default(visual)
}
```

**New API endpoints**

```
GET  /api/profile
     Response: StudentProfileResponse (name, grade, learningPace, confidenceLevel, preferredTheme, preferredExplanationStyle, avatarUrl)
     Auth: Bearer JWT — returns the authenticated user's own profile

PATCH /api/profile
      Body: Partial<UpdateProfileRequest>
      Response: StudentProfileResponse
      Auth: Bearer JWT — updates the authenticated user's own profile
```

**New service** — `api/services/profileService.ts`

Thin wrapper around Prisma — `getProfile(userId)`, `updateProfile(userId, patch)`. Keeps controller lean.

**UI components**

- `app/profile/page.tsx` — Server component shell (fetches current profile, passes to view)
- `app/profile/ProfileView.tsx` — Presentation: avatar selection, grade display (read-only for now unless parent/admin changes it), theme picker, learning pace selector, explanation style selector, confidence level display (read-only — AI-managed, not self-reported directly)
- Or: `components/mathai/profile-modal.tsx` — Modal version accessible from the dashboard header without full page nav

**Avatar/theme selection**

The `preferredTheme` field already exists. Define the theme slots:

```typescript
export const AVATAR_THEMES = [
  { id: "space",    label: "Space Explorer",  emoji: "🚀" },
  { id: "ocean",    label: "Ocean Diver",      emoji: "🌊" },
  { id: "forest",   label: "Forest Keeper",    emoji: "🌲" },
  { id: "volcano",  label: "Volcano Scientist", emoji: "🌋" },
  { id: "rainbow",  label: "Rainbow Artist",   emoji: "🌈" },
] as const;
```

**How profile influences the system**

Once the profile is set, it flows into:
- Practice generator: `learningPace` → question count and hint frequency
- Tutor service: `preferredExplanationStyle` → included in AI prompt context
- Dashboard: `preferredTheme` → gradient and color accent

This wiring happens in the service layer, not in the UI. The practice generator and tutor service need to accept and use `preferredExplanationStyle` and `learningPace` from the loaded profile.

### Files to create/update

| Action | File |
|--------|------|
| Update | `database/schema/schema.prisma` — add `ExplanationStyle` enum, add `preferredExplanationStyle` column |
| Create | Migration SQL (or `prisma migrate dev`) |
| Create | `api/routes/profile.routes.ts` |
| Create | `api/controllers/profileController.ts` |
| Create | `api/services/profileService.ts` |
| Update | `api/routes/index.ts` — add profile route |
| Create | `apps/web/app/profile/page.tsx` |
| Create | `apps/web/app/profile/ProfileView.tsx` |
| Create | `apps/web/components/mathai/profile-modal.tsx` (quick-edit version for dashboard) |
| Update | `apps/web/app/dashboard/DashboardView.tsx` — add profile quick-edit button in header |
| Update | `packages/shared-types/index.ts` — add `StudentProfileResponse`, `UpdateProfileRequest`, `ExplanationStyle` |

### New shared types needed

```typescript
// packages/shared-types/index.ts (additions)

export type LearningPace = "slow" | "standard" | "fast";
export type ExplanationStyle = "visual" | "step_by_step" | "story" | "analogy" | "direct";

export interface StudentProfileResponse {
  id:                       string;
  name:                     string;
  grade:                    Grade;
  avatarUrl?:               string;
  preferredTheme:           string;
  learningPace:             LearningPace;
  confidenceLevel:          number;         // 0–100, AI-managed
  preferredExplanationStyle: ExplanationStyle;
  totalXp:                  number;
  currentLevel:             number;
}

export interface UpdateProfileRequest {
  name?:                     string;
  preferredTheme?:           string;
  learningPace?:             LearningPace;
  preferredExplanationStyle?: ExplanationStyle;
}
```

### Can be mocked first? Partially.

The profile page/modal UI can be fully built with a static mock profile object. The PATCH endpoint can be stubbed to return the same object back. The DB migration is needed only when going to production.

---

## Feature 4: Grade-Aware AI-Generated Practice Menu

**What it is:** Replace the current static topic grid on the dashboard with a dynamic, personalized practice menu. Sections are generated based on grade level, mastery scores, recent session accuracy, weak areas, and confidence level. The student sees curated sections like "Best for You Today", "Revise This", "Challenge Yourself", "Quick Win", etc.

### What's needed

**New API endpoint**

```
GET /api/practice/menu
    Response: PracticeMenu
    Auth: Bearer JWT

// The endpoint reads:
// - User's grade from User.gradeLevel
// - TopicProgress rows (masteryScore, accuracyRate, lastPracticedAt, isUnlocked)
// - StudentProfile (confidenceLevel, learningPace)
// - Recent PracticeSession (last 7 days)
// - Curriculum topics for the grade
// Then runs the recommendation algorithm server-side
```

**New service** — `api/services/practiceMenuService.ts`

Algorithm (pure business logic, no AI calls — deterministic from DB data):

```
1. Load all TopicProgress for user
2. Identify weak areas: accuracyRate < 0.6 AND masteryScore < 0.5
3. Identify in-progress: masteryScore > 0 AND masteryScore < 0.8
4. Identify not-started: masteryScore == 0 AND isUnlocked
5. Calculate confidence signal: use StudentProfile.confidenceLevel
6. Build sections:
   - "Best for You Today": 2-3 items = in-progress topics with highest recent activity
   - "Revise This": 2-3 items = weak areas (low accuracy, last practiced > 3 days ago)
   - "Because You're in Grade X": 2-3 items = grade-level unlocked topics not yet started
   - "Challenge Yourself": 1-2 items = mastered topics (score > 0.8) — can go to advanced mode
   - "Quick Confidence Booster": 1-2 items = topics where confidence < 50 AND mastery is developing
```

**New UI components**

- `components/mathai/practice-menu.tsx` — Renders `PracticeMenu` object as styled sections with topic cards
- `components/mathai/practice-menu-section.tsx` — One section row with a label, emoji, and horizontal scroll of topic cards
- Each topic card in the menu links to `/practice?topicId=X&mode=guided` (or `challenge` for the challenge section)

### Files to create/update

| Action | File |
|--------|------|
| Create | `api/routes/practiceMenu.routes.ts` |
| Create | `api/controllers/practiceMenuController.ts` |
| Create | `api/services/practiceMenuService.ts` |
| Update | `api/routes/index.ts` — register `/practice/menu` route |
| Create | `apps/web/components/mathai/practice-menu.tsx` |
| Create | `apps/web/components/mathai/practice-menu-section.tsx` |
| Update | `apps/web/app/dashboard/page.tsx` — add `fetchPracticeMenu(userId)` call |
| Update | `apps/web/app/dashboard/DashboardView.tsx` — replace static topic grid with `PracticeMenu` component |
| Update | `packages/shared-types/index.ts` — add `PracticeMenu`, `PracticeMenuSection`, `PracticeMenuItem` |

### New shared types needed

```typescript
// packages/shared-types/index.ts (additions)

export type PracticeMenuSectionType =
  | "best_for_you"
  | "revise_this"
  | "grade_level"
  | "challenge"
  | "confidence_booster";

export interface PracticeMenuItem {
  topicId:      string;
  topicName:    string;
  iconSlug:     string;
  masteryLevel: MasteryLevel;
  accuracyPct:  number;
  suggestedMode: PracticeMode;  // "guided" | "challenge" | "review"
  reason:       string;         // e.g. "You got 4/10 last time" — shown as subtext
  isNew?:       boolean;        // badge for topics never practiced
}

export interface PracticeMenuSection {
  type:     PracticeMenuSectionType;
  title:    string;             // e.g. "Best for You Today ⚡"
  subtitle: string;             // e.g. "Pick up where you left off"
  items:    PracticeMenuItem[];
}

export interface PracticeMenu {
  generatedAt: string;          // ISO timestamp — used to avoid stale menus
  sections:    PracticeMenuSection[];
}
```

### Can be mocked first? Yes, strongly recommended.

The menu algorithm requires production data to be meaningful. Mock with a static `PracticeMenu` fixture that covers all 5 section types so the UI can be built, styled, and reviewed before the algorithm is wired. Toggle with `NEXT_PUBLIC_MOCK_MENU=true`.

---

## Feature 5: Dashboard Recommendations

**What it is:** Update the dashboard to incorporate the four new features above — Ask MathAI entry point, smart practice menu, profile quick-edit, and a homework/problem solver entry point. No new endpoints required — this is primarily orchestration and layout work.

### What's needed

**Dashboard layout changes (DashboardView.tsx)**

Current section order:
```
Header (name + grade + XP bar)
XP bar (full) + Streak
Daily Quests
Recent Badges
Keep Learning (static topic grid)
```

New section order:
```
Header (name + grade + XP bar compact + profile avatar → opens modal)
XP bar (full) + Streak

[NEW] Ask MathAI card             ← Feature 1 entry point
[NEW] Smart Practice Menu         ← Feature 4 output (replaces "Keep Learning")

Daily Quests                      ← kept, moved below practice menu
Recent Badges                     ← kept
```

**Ask MathAI card** (from Feature 1)

A full-width card with:
- Header: "Ask MathAI 🤖" + subtitle "Paste any problem or question"
- Text input (single line, expand to multi-line on focus)
- Quick action chips: "Explain visually", "Step by step", "Similar example", "Simplify"
- On submit → opens `ask-panel.tsx` sheet overlay

**Homework/solver entry point**

This is a mode of the Ask MathAI feature, not a separate endpoint. The chip "Explain my homework" on the ask card sets context="homework". No new backend work needed.

**Profile quick-edit access**

The header avatar (currently the first-letter circle) becomes clickable and opens `profile-modal.tsx`. The modal shows a condensed profile form (theme, pace, style). A "Full Profile" link navigates to `/profile`.

**Dashboard data changes** (`dashboard/page.tsx`)

```typescript
// Add to the existing Promise.all fetch:
const [dashboard, curriculum, practiceMenu] = await Promise.all([
  fetchDashboard(userId),
  fetchCurriculum(),
  fetchPracticeMenu(userId),   // new
]);
```

Pass `practiceMenu` to `DashboardView` — the view replaces the static topic grid with the `PracticeMenu` component.

### Files to update

| Action | File |
|--------|------|
| Update | `apps/web/app/dashboard/page.tsx` — add practiceMenu fetch, pass to view |
| Update | `apps/web/app/dashboard/DashboardView.tsx` — new layout, AskCard, PracticeMenu, profile avatar → modal |
| Create | `apps/web/lib/practiceMenu.ts` — `fetchPracticeMenu(userId)` server-side fetcher |

---

## Summary: All Files to Create / Update

### New files to create

```
// API
api/routes/tutor.routes.ts
api/controllers/tutorController.ts
api/routes/profile.routes.ts
api/controllers/profileController.ts
api/services/profileService.ts
api/routes/practiceMenu.routes.ts
api/controllers/practiceMenuController.ts
api/services/practiceMenuService.ts

// Frontend — Ask MathAI
apps/web/components/mathai/ask-card.tsx
apps/web/components/mathai/ask-panel.tsx

// Frontend — Visual Renderer
apps/web/components/mathai/visual/VisualRenderer.tsx
apps/web/components/mathai/visual/NumberLine.tsx
apps/web/components/mathai/visual/FractionBar.tsx
apps/web/components/mathai/visual/ArrayDiagram.tsx
apps/web/components/mathai/visual/BarModel.tsx
apps/web/components/mathai/visual/PlaceValueChart.tsx
apps/web/components/mathai/visual/index.ts

// Frontend — Profile
apps/web/app/profile/page.tsx
apps/web/app/profile/ProfileView.tsx
apps/web/components/mathai/profile-modal.tsx

// Frontend — Practice Menu
apps/web/components/mathai/practice-menu.tsx
apps/web/components/mathai/practice-menu-section.tsx
apps/web/lib/practiceMenu.ts
```

### Files to update

```
api/routes/index.ts                           — register 3 new route groups
database/schema/schema.prisma                  — ExplanationStyle enum + column
packages/shared-types/index.ts                 — 6 new types/interfaces
apps/web/app/dashboard/page.tsx               — add practiceMenu fetch
apps/web/app/dashboard/DashboardView.tsx      — new layout + 3 new sections
apps/web/app/practice/page.tsx                — wire in VisualRenderer for hint/explanation display
apps/web/components/mathai/index.ts           — re-export new components
```

---

## Backend Endpoints Needed

| Method | Route | Purpose | New? |
|--------|-------|---------|------|
| POST | `/api/tutor/ask` | Free-form ask (no session required) | ✅ New |
| GET | `/api/profile` | Load authenticated user's profile | ✅ New |
| PATCH | `/api/profile` | Update profile fields | ✅ New |
| GET | `/api/practice/menu` | Grade-aware personalized practice sections | ✅ New |
| POST | `/api/practice/start` | Start practice session | Exists |
| POST | `/api/practice/hint` | Get hint (in-session) | Exists |
| POST | `/api/practice/explanation` | Get explanation (in-session) | Exists |

---

## Shared Types Needed (new additions to `packages/shared-types/index.ts`)

```typescript
// 1. Ask MathAI
AskRequest

// 2. Visual renderer data contracts
NumberLineData
FractionBarData
ArrayData
BarModelData
PlaceValueChartData
// VisualPlan.data becomes a discriminated union of the above

// 3. Profile
LearningPace         // (already in Prisma, needs to be in shared-types)
ExplanationStyle     // new
StudentProfileResponse
UpdateProfileRequest

// 4. Practice Menu
PracticeMenuSectionType
PracticeMenuItem
PracticeMenuSection
PracticeMenu
```

---

## Which Parts Can Be Mocked First

| Feature | Can mock first | What to mock |
|---------|---------------|--------------|
| Ask MathAI UI | ✅ Yes | Static `TutorResponse` fixture with text + visualPlan |
| Visual renderer | ✅ Yes | Static `VisualPlan` objects for each diagramType |
| Profile UI | ✅ Yes | Static `StudentProfileResponse` object |
| Practice menu UI | ✅ Yes | Static `PracticeMenu` with all 5 section types populated |
| Dashboard layout | ✅ Yes | All of the above mocks plugged into DashboardView |
| `/api/tutor/ask` | ⚠️ Partial | Route exists but returns hardcoded TutorResponse until tutor_service is wired |
| `/api/practice/menu` | ⚠️ Partial | Route exists but returns hardcoded PracticeMenu until DB query algorithm is built |
| `/api/profile` GET | ⚠️ Partial | Returns hardcoded profile until Prisma read is done |
| DB migration | ❌ Needs real work | ExplanationStyle enum + column migration |

---

## Recommended Build Order

Build in this sequence to minimise blocked dependencies and maximise demo-able progress at each step.

**Wave 1 — Pure UI (no backend required, mock data only)**

1. Visual renderer components (`NumberLine`, `FractionBar`, `ArrayDiagram`, `BarModel`, `PlaceValueChart`, `VisualRenderer`)
   - Zero risk, zero backend dependency
   - Gives us the rendering layer that everything else will use

2. `AskCard` + `AskPanel` components (with mock TutorResponse + VisualRenderer)
   - Dashboard looks complete with the Ask feature immediately

3. `ProfileModal` component (with mock StudentProfileResponse)
   - Quick win, very visible improvement

4. `PracticeMenu` + `PracticeMenuSection` components (with mock PracticeMenu fixture)
   - Replace static grid, dashboard feels alive

5. Update `DashboardView.tsx` layout to incorporate 2/3/4

**Wave 2 — Backend + types (real data)**

6. Add `ExplanationStyle` to `shared-types` + Prisma migration
7. Build `profileService` + `GET/PATCH /api/profile` endpoints
8. Wire `ProfileModal` to real profile data

9. Build `practiceMenuService` + `GET /api/practice/menu` endpoint
10. Wire `PracticeMenu` component to real data (remove mock flag)

11. Build `tutorController` + `POST /api/tutor/ask` route
12. Wire `AskPanel` to real tutor endpoint

**Wave 3 — Integration and polish**

13. Wire `preferredExplanationStyle` + `learningPace` into tutor_service prompt context
14. Wire `VisualRenderer` into `practice/page.tsx` for hint/explanation responses
15. Full profile page (`/profile`) — extended version of the modal
16. End-to-end testing of the complete flow: ask → visual explanation → practice → profile update

---

## Design Constraints (Non-Negotiables)

These must be respected throughout implementation:

- **Preserve gamified UI** — All new components must use the same gradient + rounded-3xl + shadow-md card style as existing mathai components. No flat Material Design. No plain tables.
- **View/container separation** — Every page has a server component (`page.tsx`) that fetches data and a separate view component (`*View.tsx`) that only renders. Client components are the exception, not the rule.
- **No TypeScript `any`** — Use the shared-types barrel. If a type doesn't exist, add it to shared-types first, then use it.
- **Mobile-first** — All new layouts use `grid-cols-1 sm:grid-cols-2` patterns consistent with existing dashboard grids.
- **No new npm packages for visuals** — SVG-based visual renderers only. No chart libraries. Keeps bundle lean and gives us full style control for the kid-friendly aesthetic.
