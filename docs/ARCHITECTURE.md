# MathAI System Architecture

**Last updated:** April 2026

This document describes the full system architecture of MathAI — how all the intelligence, data, and rendering layers connect.

---

## System Overview

```
                          STUDENT
                             │
                      ┌──────┴──────┐
                      │  Next.js    │
                      │  Frontend   │
                      └──────┬──────┘
                             │  REST API (Bearer JWT)
                      ┌──────┴──────┐
                      │  Express    │
                      │  API        │
                      └──┬───┬───┬──┘
                         │   │   │
             ┌───────────┘   │   └───────────┐
             │               │               │
      ┌──────┴──────┐ ┌─────┴─────┐ ┌───────┴───────┐
      │ AI Layer    │ │ Services  │ │ Database      │
      │ (Claude,    │ │ (Brain,   │ │ (PostgreSQL   │
      │  Gateway)   │ │  Memory,  │ │  + Prisma)    │
      └─────────────┘ │  Adapt.)  │ └───────────────┘
                      └───────────┘
```

---

## Data Flow: Practice Session

```
1. Student opens /practice
2. Frontend → POST /practice/start
3. practiceService.startSession()
   ├── Fetch: profile, memorySnapshot, masteredTopics (parallel)
   ├── AI question generation (Cambridge-aligned, personalised)
   ├── Initialize difficulty pool (medium questions + empty easy/hard)
   └── Return session + first question

4. Student answers → POST /practice/submit
5. practiceService.submitAnswer()
   ├── Check correctness
   ├── Detect misconception (heuristic)
   ├── Record mistake pattern (fire-and-forget)
   ├── Award XP + check level-up
   ├── Session Adaptation Engine → SessionNextStep
   └── Return result + adaptation + next question

6. practiceController
   ├── Read adaptation action (easier/harder/next)
   ├── getNextAdaptiveQuestion(sessionId, action)
   │   ├── Resolve target difficulty (guardrails applied)
   │   ├── Generate pool on-demand if needed (AI call)
   │   └── Serve next question from pool
   └── Return { result, sessionAdaptation, nextQuestion }

7. On session complete:
   ├── Update mastery (EWMA: 70% historical + 30% session)
   ├── Refresh memory snapshot
   ├── Re-prioritise topic queue
   ├── Infer explanation style
   └── Evaluate pet personality
```

---

## Intelligence Pipeline

### Learning Brain Engine (`api/services/learningBrain/`)

Decides WHAT the student should do next, BEFORE a session starts.

```
signals.ts   → Extract typed signals from TopicProgress + MemorySnapshot
scorer.ts    → Score each topic, apply priority framework, balance rules
index.ts     → Orchestrate data fetch + signal extraction + scoring

Input:  userId
Output: LearningNextAction { type, topicId, difficulty, reason, encouragement, ... }

Priority Framework:
  1. Severe misconception (4+ errors on one pattern)
  2. Confidence recovery (avg < 40, trend falling)
  3. Revision due (5+ days since practice)
  4. Curriculum progression (improving topic near mastery)
  5. Healthy challenge (strong topics ready for harder work)
```

### Session Adaptation Engine (`api/services/sessionAdaptationService.ts`)

Decides what happens INSIDE a session after each answer.

```
Input:  SessionContext (all responses, current index, topic)
Output: SessionNextStep { action, reason, encouragement, difficulty?, ... }

Priority Framework:
  1. Fatigue management (declining accuracy in long session)
  2. Repeated struggle (2+ consecutive wrong)
  3. Hint dependence (avg > 0.8 hints/question)
  4. Careless pattern (fast + inaccurate)
  5. Recovery recognition (wrong→wrong→correct)
  6. Confidence dropping (self-rating declining)
  7. Momentum (3+ consecutive correct → harder)
```

### Dynamic Difficulty (`api/services/questionPoolManager.ts`)

Maps adaptation decisions to actual difficulty shifts.

```
SessionQuestionPool:
  easy:   []  (generated on-demand)
  medium: [10 questions]  (generated at session start)
  hard:   []  (generated on-demand)

Guardrails:
  - Max 2 difficulty shifts in 3 questions
  - Cannot skip levels (easy↔medium↔hard)
  - Pool exhaustion falls back to medium
```

### Visual Explanation Engine (`ai/services/visualExplanationEngine/`)

Produces deterministic visual diagrams for math concepts.

```
classifier.ts        → Heuristic rules + AI fallback classify visual type
planBuilder.ts       → mathData-driven plan (precise) or regex-fallback (heuristic)
alignmentVerifier.ts → Cross-checks explanation vs mathData vs plan
index.ts             → Orchestrator

Pipeline:
  1. Classify: "What is 1/4 + 2/3?" → fraction_bar (confidence: 0.9)
  2. Build: mathData { fractions: [{1,4}, {2,3}] } → FractionBarData
  3. Verify: explanation mentions "1/4" and "2/3"? ✓ aligned
  4. Render: <FractionBar data={...} animated />

Phase 1 renderers: NumberLine, FractionBar, ArrayDiagram, BarModel, PlaceValueChart, EquationSteps
Phase 2 renderers: LogicFlow, GeometrySketch, ComparisonModel (built but gated)
```

### Student Learning Memory (`ai/services/studentMemoryService.ts`)

```
Layer 1 — Raw events (PostgreSQL, append-only):
  question_attempts, topic_mistake_patterns, lesson_progress, practice_sessions

Layer 2 — MemorySnapshot (JSON blob, 2hr TTL):
  strongTopics, weakTopics, activeMistakePatterns, hintDependencyByTopic,
  confidenceTrend, avgConfidenceScore, suggestedFocusTopics, recentSessions

Injected into every AI prompt via formatForPrompt()
```

---

## Frontend Architecture

### Container/View Pattern

Every page follows this separation:

```
page.tsx (Server Component)
  → Auth check + data fetch
  → Pass to Container or View

Container (Client Component) — owns state, API calls
  → Passes props to View

View (Client Component) — pure rendering, zero side effects
```

### Client-Side Data Fetching

```
React Query hooks in hooks/:
  useDashboard(studentId)   → GET /dashboard/:id
  usePracticeMenu()         → GET /practice/menu
  useLearningNext()         → GET /learning/next
  useProfile()              → GET/PATCH /profile
  usePet()                  → GET /pet
```

### Mock Data Mode

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` for frontend-only development. All hooks return realistic mock data with 600ms simulated delay. Mock data exists for all 4 student personas: struggling, improving, strong, revision-due.

---

## Authentication & Authorisation

```
NextAuth (JWT strategy)
  → Token contains: userId, gradeLevel, role, isActive
  → Express auth.middleware decrypts JWE with shared NEXTAUTH_SECRET
  → req.student: { id, grade, role }

Roles: student, parent, teacher, admin
  → requireAdmin middleware (admin routes)
  → requireParent middleware (parent portal routes)
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| users | Identity, role, grade, last login |
| student_profiles | XP, level, pace, confidence, explanation style, interests |
| streaks | Daily practice tracking |
| topic_progress | Per-topic mastery score, accuracy, completion |
| lesson_progress | Per-lesson started/completed tracking |
| practice_sessions | Session records with questions JSON |
| question_attempts | Individual answer records |
| topic_mistake_patterns | Misconception tag tracking with resolution |
| student_memory_snapshots | Cached MemorySnapshot JSON blobs |
| xp_events | Immutable XP audit trail |
| badges / student_badges | Badge catalog and earned badges |
| daily_quests / student_quest_progress | Quest system |
| student_pets | Pet personality tracking |

---

## Service Layer Map

| Service | Purpose |
|---|---|
| practiceService | Session lifecycle: start, submit, hint, next question |
| practiceMenuService | Algorithmic + AI-enriched practice recommendations |
| learningBrain (3 files) | Pre-session next-best-action decision |
| sessionAdaptationService | In-session adaptive decisions |
| questionPoolManager | Multi-difficulty question pool |
| studentMemoryService | Learning memory snapshot system |
| askMathAIService | Freeform AI tutor with visual intelligence |
| questionGeneratorService | AI practice question generation |
| recommendationService | AI topic ranking and personalisation |
| visualExplanationEngine (4 files) | Visual classification, planning, verification |
| parentInsightsService | Parent-friendly learning intelligence |
| parentDashboardService | Parent dashboard data aggregation |
| progressService | Student progress summaries |
| gamificationService | XP, levels, badges, streaks |
| questService | Daily quest management |
| profileService | Student profile CRUD |
| petService | Pet personality system |
| curriculumService | Curriculum tree and topic data |
| topicAssignmentService | AI-ordered topic queue |
| adminService | Platform admin operations |
