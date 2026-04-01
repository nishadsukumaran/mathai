# MathAI Release Notes

---

## v2.0 — Adaptive Intelligence Platform (April 2026)

Major release transforming MathAI from a collection of features into a guided adaptive learning system.

### Learning Brain Engine

The central decision layer that connects memory, mastery, performance, and motivation into a single recommendation.

- **Pre-session intelligence** — `GET /api/learning/next` returns the student's next best learning action
- **5-tier priority framework**: severe misconception > confidence recovery > revision due > curriculum progression > challenge
- **Dashboard integration** — "Your Next Step" card shows the brain's recommendation with reason and one-tap start
- **Balance rules** — never drills weak areas endlessly; injects revision, confidence boosts, and healthy challenges
- **149 unit tests** covering all decision logic

### Session Adaptation Engine

Real-time in-session intelligence that adapts the practice experience after every answer.

- **Pattern detection** — consecutive wrong, hint dependency, careless rushing, recovery, momentum, fatigue
- **10 adaptive actions** — easier/harder questions, auto-hints, visual explanations, celebration, positive session ending
- **Trend-based** — reacts to patterns, not single events; never overreacts to one wrong answer
- **Integrated into submit flow** — zero additional API calls; `sessionAdaptation` field on every SubmissionResult

### Dynamic Difficulty

True difficulty adaptation inside practice sessions.

- **Multi-difficulty question pool** — easy/medium/hard questions generated on-demand
- **Lazy generation** — only generates new difficulty tiers when first needed (zero startup latency impact)
- **Guardrails** — max 2 difficulty shifts in 3 questions, no level skipping, pool exhaustion fallback
- **Backward compatible** — sessions without pools fall back to linear question list

### Visual Explanation Engine

Intelligent visual selection and rendering for Ask MathAI.

- **Heuristic + AI classifier** — 12 pattern rules for instant classification, AI refinement for ambiguous cases
- **Phase 1 enforcement** — only battle-tested renderers (number line, fraction bar, array, bar model, place value, equation steps)
- **Intent caching** — normalized question -> intent cache (200 entries, 30min TTL)
- **mathData-driven precision** — AI returns structured math understanding; plan builder uses it for exact visual data
- **Regex fallback** — always available when mathData is missing or invalid
- **Alignment verifier** — cross-checks explanation, mathData, and visual plan; falls back on 2+ mismatches

New renderers:
- **EquationSteps** — step-by-step equation solving with Framer Motion progressive reveal
- **LogicFlow** — SVG flow diagram for multi-step reasoning (Phase 2, gated)

### Parent Portal

A learning intelligence dashboard for parents.

- **`/parent` route** with dedicated layout, navigation, and role-based access
- **Learning Score** (0-100) — weighted composite of mastery, consistency, effort, accuracy, improvement
- **Learning Status** — Excellent / On Track / Needs Attention
- **Confidence Signal** with contextual explanation ("Confidence dipped — challenges in Fractions may be the cause")
- **Actionable Insights** — up to 6 prioritised insights, each with a parent-friendly action hint
- **Learning Personality** — derived from behavioral data (visual learner, independent solver, careful thinker, etc.)
- **Clustered Mastery Map** — topics grouped into Weak Areas, Improving, Strong, Revision Due
- **Insight Basis** — transparency label ("Based on 120 questions answered, 5 sessions")
- **Mock data** for 4 student personas

### Structured Math Data (mathData)

AI now returns compact structured math understanding alongside explanations.

- **12 math types** — addition, subtraction, multiplication, division, fraction_*, place_value, word_problem, equation, comparison
- **Validation layer** — sanitizes AI output (type checking, range clamping, zero-denominator rejection)
- **No extra AI calls** — mathData is part of the existing Ask MathAI response
- **Backward compatible** — mathData is optional; system works without it

### Shared Types

New types added to `@mathai/shared-types`:
- `LearningNextAction`, `SourceSignals`, `LearningActionType`, `SessionMode`, `BrainDifficulty`
- `SessionNextStep`, `SessionAdaptiveAction`, `SessionAdaptiveSignals`
- `EquationStepsData`, `LogicFlowData`
- `MathData`, `MathDataType`

### Test Suite

| Suite | Tests | New |
|---|---|---|
| learningBrain | 14 | New |
| sessionAdaptation | 13 | New |
| questionPoolManager | 25 | New |
| visualExplanationEngine | 31 | New |
| mathDataPlanBuilder | 19 | New |
| alignmentVerifier | 13 | New |
| parentInsights | 34 | New |
| **Total** | **149** | |

---

## v1.x — Foundation Platform (March 2026)

### Core Platform
- Student dashboard with XP, streaks, quests, badges
- Practice engine with AI-generated questions (Cambridge-aligned)
- Ask MathAI with freeform AI tutoring
- Curriculum tree with mastery progression
- Progress tracking and weak area detection

### Gamification
- XP system with level progression
- Streak tracking with shield protection
- Daily quests (3 per day, rotating)
- Badge system (6 categories)
- Virtual pet with AI-driven personality evolution

### Visual Explanations (v1)
- NumberLine, FractionBar, ArrayDiagram, BarModel, PlaceValueChart renderers
- StepPlayer for animated walkthroughs
- ConceptImage for AI-generated educational images
- On-demand image generation via Gemini + SVG fallback

### Student Learning Memory (Wave 5)
- Two-layer memory system (raw events + cached MemorySnapshot)
- Misconception tracking with resolution
- Confidence EWMA (30% new, 70% historical)
- Interest-aware AI personalisation
- Topic-level hint dependency tracking

### Profile & Preferences
- Student profile management (name, grade, pace, style, theme)
- Preferred explanation style inference from session behavior
- AI topic queue management (ordered by priority)

### Admin Panel
- Platform statistics dashboard
- User search, filter, pagination
- User detail with pet personality insight
- Account management (disable/enable, password reset)

### Authentication
- Email/password + Google OAuth via NextAuth
- JWT-based session with Express API verification
- Role-based access control (student, parent, teacher, admin)

### Cambridge Curriculum Alignment
- Grade-based topic suggestions aligned to Cambridge framework
- Cambridge objective codes on question generation prompts
- Grade-level guard prevents above-stage content
- Non-math question rejection with polite redirect

### Infrastructure
- Next.js 16 + React 18 frontend
- Express REST API with Zod validation
- PostgreSQL + Prisma ORM
- Vercel AI SDK + AI Gateway
- Turborepo monorepo
- Mock data layer for frontend development
