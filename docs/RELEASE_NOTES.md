# MathAI Release Notes

---

## v2.1 — Parent Accounts, Pet Engine, UX Polish (April 2026)

### Parent-Child Account Model

Production-grade parent-child linking system replacing temporary conventions.

- **`parent_child_links` table** — proper relational model with FK constraints, unique constraint per parent-child pair, indexed for fast lookup
- **Enums**: `RelationshipType` (guardian/mother/father/other), `LinkStatus` (active/pending/revoked), `LoginMode` (parent_managed/pin_only/hybrid)
- **StudentProfile extensions**: displayName, curriculum, schoolName, onboardingGoal, preferredLoginMode, username (unique), hashedPin (bcrypt)
- **Parent onboarding flow** (`/parent/onboarding`) — 2-step: child profile + optional learning goal, login mode selection with PIN setup
- **Child PIN login** — `POST /api/auth/pin-login` validates username + hashed PIN, checks login mode permissions
- **Kid-friendly usernames** — auto-generated (name + 3-digit suffix, e.g. "aryan-472")
- **Future-ready** for: multiple children, multiple guardians, school-issued linking codes

### Parent Ask MathAI

- **`/parent/ask`** — dedicated AI tutor for parents, reusing existing endpoint with parent context
- **Parent-specific suggestions**: "How do I explain fractions?", "Why is my child struggling?"
- **LaTeX rendering** via KaTeX in all responses
- **Dashboard CTA card** — gradient indigo→purple card on parent dashboard
- **ParentNav** updated with "Ask AI" link

### Pet Engine

Centralized behavior system replacing scattered pet logic.

- **`petEngine.ts`** — pure function service (no React), single entry point: `getReaction(event, personality?)`
- **11 typed events**: correct_answer, wrong_answer, retry_success, hint_requested, streak_3/7/14, session_complete, level_up, badge_earned, idle
- **6 moods**: idle (bob), happy (bounce), cheering (pulse), thinking (wiggle), proud (glow), excited (big bounce)
- **132 message variations**: 3 personality tones (playful/calm/motivator) × 11 events × 4 messages each
- **Personality modifier**: maps 12 backend PetPersonality values to 3 tone categories
- **Anti-repeat logic**: tracks last message, filters from next pick
- **`usePetEngine` hook**: React lifecycle bridge with auto-idle timeout
- **PetCompanion refactored** to pure display component (zero logic, receives PetReaction)

### Floating Pet Companion

- Pet moved from content block to **header-area floating pill**
- Expandable detail panel with personality, stats, manage link
- Speech bubbles with mood-specific messages (auto-dismiss 2.5s)
- `excited` mood variant added (scale 1.25 + bounce + rotate)
- Idle animation: gentle 2.5s bob cycle

### Celebration Animations

- **CorrectBurst**: green checkmark scale-up on correct answers (400ms)
- **XPFloat**: rising +XP badge that fades out (800ms, replaces old bounce)
- **SessionCompleteEntrance**: card scale-up entrance (400ms)
- **StreakPulse**: flame animation for streak milestones (600ms)
- **FadeIn**: generic staggered entry wrapper for cards

### Retry Before Reveal

- First wrong answer → "Not quite — give it another try!" (amber banner)
- Answer clears, student retries with fresh attempt
- After second attempt → full result with correct answer revealed
- Max 2 attempts, always supportive tone, no frustration loops

### UI Redesign (v0 Style)

All 4 main screens redesigned for clean, minimal aesthetics:

**Dashboard:**
- Compact 3-column stat strip (Level, Streak, XP)
- Continue Learning as single prominent CTA button
- Section labels as uppercase tracking-wider headers
- Tighter spacing, subtler borders (rounded-xl, border-gray-100)

**Practice:**
- Sticky progress bar with blur backdrop
- Centered question card with clear difficulty/XP badges
- Animated progress bar and question transitions (Framer Motion)
- Micro-interactions: active:scale-[0.98] on all buttons

**Ask MathAI:**
- MathText component for KaTeX LaTeX rendering in all text
- Consistent card borders and section labels
- Formula blocks with overflow-x-auto

**Progress:**
- 4-column stat cards
- Color-coded mastery legend with dot indicators
- 3-column responsive topic grid
- Friendly empty state for new students

### LaTeX Math Rendering

- **MathText component** using KaTeX for inline `\(...\)` and display `\[...\]` math
- Applied to: Ask MathAI responses, practice hints, step formulas, worked examples
- Graceful fallback to code block on parse error
- KaTeX CSS imported for proper typesetting

### UX Fixes

- **Dashboard cards**: mastery level badge, fallback text, actionable empty state CTA
- **Admin link visibility**: correctly guarded (role === "admin" only)
- **Parent portal discoverability**: "Parent View" link added to Profile page
- **Mobile layout**: overflow-x-hidden on main, parent routes excluded from sidebar padding, AppNav hidden on /parent routes
- **Empty states**: friendly messages across dashboard, progress, parent portal

### Progressive Prompt Hook (Placeholder)

- `useProgressivePrompt(type)` hook for future progressive onboarding
- Types: "goal", "preference", "theme"
- Currently returns shouldShow=false — trigger logic to be implemented

### Code Quality

- **Prisma typing**: regenerated client, removed 5 `as any` casts
- **Session store**: isolated behind SessionStore interface (swappable to Redis)
- **Shared utility**: `daysSince()` extracted to `api/lib/dateUtils.ts` (was duplicated in 3 files)
- **Scorer constants**: documented with priority band explanation
- **Mock data drift**: fixed missing sessionAdaptation in MOCK_SESSION_COMPLETE
- **Route comments**: cleaned stale "NEW" and "Wave 5" markers

### Database Migration

- **`parent_child_links`** table created in production (Supabase)
- **`student_profiles`** extended with 7 new columns
- 3 new enums: RelationshipType, LinkStatus, LoginMode
- Migration SQL: `database/migrations/parent_child_links.sql`

### Test Suite

| Suite | Tests | Status |
|---|---|---|
| learningBrain | 14 | Existing |
| sessionAdaptation | 13 | Existing |
| questionPoolManager | 25 | Existing |
| visualExplanationEngine | 31 | Existing |
| mathDataPlanBuilder | 19 | Existing |
| alignmentVerifier | 13 | Existing |
| parentInsights | 34 | Existing |
| integrationFlows | 9 | New |
| petEngine | 14 | New |
| parentChild | 25 | New |
| **Total** | **197** | |

---

## v2.0 — Adaptive Intelligence Platform (April 2026)

Major release transforming MathAI from a collection of features into a guided adaptive learning system.

### Learning Brain Engine

- **Pre-session intelligence** — `GET /api/learning/next` returns next best learning action
- **5-tier priority framework**: severe misconception > confidence recovery > revision due > curriculum progression > challenge
- **Dashboard integration** — "Your Next Step" card with reason and one-tap start
- **Balance rules** — never drills weak areas endlessly

### Session Adaptation Engine

- **Pattern detection** — consecutive wrong, hint dependency, careless rushing, recovery, momentum, fatigue
- **10 adaptive actions** — easier/harder questions, auto-hints, visual explanations, celebration, positive session ending
- **Trend-based** — reacts to patterns, not single events

### Dynamic Difficulty

- **Multi-difficulty question pool** — easy/medium/hard generated on-demand
- **Guardrails** — max 2 shifts in 3 questions, no level skipping
- **Lazy generation** — zero startup latency impact

### Visual Explanation Engine

- **Heuristic + AI classifier** with Phase 1 enforcement and intent caching
- **mathData-driven precision** with regex fallback
- **Alignment verifier** — cross-checks explanation/mathData/plan consistency
- **New renderers**: EquationSteps (Framer Motion), LogicFlow (SVG, Phase 2 gated)

### Parent Portal (v1)

- Learning Score, Status, Confidence Signal with explanations
- Actionable Insights with parent tips
- Learning Personality, Clustered Mastery Map
- Mock data for 4 student personas

### Structured Math Data (mathData)

- 12 math types with validation layer
- No extra AI calls — part of existing response
- Backward compatible

---

## v1.x — Foundation Platform (March 2026)

### Core Platform
- Student dashboard with XP, streaks, quests, badges
- Practice engine with AI-generated questions (Cambridge-aligned)
- Ask MathAI with freeform AI tutoring
- Curriculum tree with mastery progression
- Progress tracking and weak area detection

### Gamification
- XP, levels, streaks, daily quests, badges, virtual pet

### Visual Explanations (v1)
- NumberLine, FractionBar, ArrayDiagram, BarModel, PlaceValueChart, StepPlayer, ConceptImage

### Student Learning Memory
- Two-layer memory (raw events + cached MemorySnapshot)
- Misconception tracking, confidence EWMA, interest-aware personalisation

### Admin Panel
- Platform stats, user management, pet personality insight

### Authentication
- Email/password + Google OAuth, JWT sessions, role-based access control

### Cambridge Curriculum Alignment
- Grade-based topics, Cambridge objective codes, grade-level guard

### Infrastructure
- Next.js 16, Express REST API, PostgreSQL + Prisma, Vercel AI SDK, Turborepo
