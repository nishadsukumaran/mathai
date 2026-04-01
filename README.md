# MathAI — Adaptive AI-Powered Math Learning Platform

MathAI is a full-stack TypeScript monorepo that combines adaptive AI tutoring, real-time learning intelligence, and gamification to help students (Grades 1-10) build genuine math mastery. Aligned to the Cambridge Mathematics Framework.

---

## What Makes MathAI Different

- **Learning Brain Engine** — a central decision layer that evaluates mastery, performance, misconceptions, and confidence to recommend the student's next best learning action
- **Session Adaptation Engine** — real-time in-session difficulty adjustment based on answer patterns, hint usage, and struggle/recovery signals
- **Dynamic Difficulty** — questions shift between easy/medium/hard pools mid-session based on adaptive signals
- **Visual Explanation Engine** — AI classifies the best visual type for each problem, builds structured data, and renders deterministic SVG diagrams (not AI-generated images)
- **Student Learning Memory** — a two-layer memory system (raw events + cached snapshots) that personalises every AI interaction
- **Parent Portal** — actionable learning intelligence for parents, not just scores
- **Cambridge Curriculum Alignment** — all questions and objectives mapped to the Cambridge Primary/Lower Secondary framework

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 18, Tailwind CSS, Framer Motion, React Query |
| Backend API | Node.js + Express (REST), Zod validation |
| AI | Vercel AI SDK + AI Gateway (Claude, Gemini), structured JSON responses |
| Auth | NextAuth.js (Email/password + Google OAuth), JWT |
| Database | PostgreSQL + Prisma ORM |
| Shared Types | `@mathai/shared-types` workspace package |
| Monorepo | Turborepo |
| Testing | Jest (149+ unit tests), Playwright (e2e) |
| Deploy | Vercel (web) + Render (API + DB) |

---

## Monorepo Structure

```
mathai/
├── apps/web/                    # Next.js frontend
│   ├── app/                     # Pages: dashboard, practice, ask, progress, profile, parent, admin
│   ├── components/mathai/       # UI components (visual renderers, cards, navigation)
│   ├── components/parent/       # Parent portal components
│   ├── components/admin/        # Admin panel components
│   ├── containers/              # State management containers
│   ├── hooks/                   # React Query hooks
│   ├── lib/                     # API client, mock data, utils
│   └── types/                   # Frontend view contracts
├── api/                         # Express REST API
│   ├── controllers/             # Request handlers
│   ├── routes/                  # Route registration (16 route files)
│   ├── services/                # Business logic (18 service files)
│   │   └── learningBrain/       # Learning Brain Engine (signals, scorer, orchestrator)
│   ├── middlewares/              # Auth, admin, parent, error handling
│   ├── lib/                     # Prisma client, response helpers
│   └── validators/              # Zod schemas
├── ai/                          # AI intelligence layer
│   ├── services/                # AI services
│   │   ├── askMathAIService     # Freeform question answering
│   │   ├── questionGenerator    # AI-generated practice questions
│   │   ├── recommendationService # AI-enriched recommendations
│   │   ├── studentMemoryService # Learning memory system
│   │   ├── imageGenerationService # On-demand visual generation
│   │   └── visualExplanationEngine/  # Visual intelligence pipeline
│   │       ├── classifier       # Heuristic + AI visual type classification
│   │       ├── planBuilder      # mathData-driven + regex-fallback plan building
│   │       └── alignmentVerifier # Explanation-visual consistency checking
│   ├── tutor/                   # Hint and explanation engines
│   └── ai_client.ts            # Unified AI provider wrapper
├── curriculum/                  # Cambridge-aligned topic tree + practice generator
├── services/                    # Gamification engine, analytics
├── database/                    # Prisma schema + migrations
├── packages/shared-types/       # Canonical API type contracts
├── types/                       # Backend-internal types
└── tests/                       # Unit (7 suites, 149 tests), integration, e2e
```

---

## Pages & Routes

| Page | Path | Description |
|---|---|---|
| Landing | `/` | Hero page, redirects to dashboard if signed in |
| Dashboard | `/dashboard` | Student home: XP, streak, quests, Learning Brain card, practice menu |
| Practice | `/practice` | Practice hub + adaptive session with dynamic difficulty |
| Ask MathAI | `/ask` | Freeform AI tutor with visual explanations |
| Progress | `/progress` | Topic mastery, accuracy, weak areas |
| Profile | `/profile` | Learning preferences, explanation style, avatar |
| Leaderboard | `/leaderboard` | Student rankings |
| Parent Portal | `/parent` | Parent learning intelligence dashboard |
| Admin | `/admin` | Platform stats, user management |

---

## API Endpoints

Base URL: `http://localhost:3001/api`

All endpoints except `/health` require Bearer JWT auth.

### Core

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check (no auth) |
| GET | `/dashboard/:studentId` | Full student dashboard data |
| GET | `/curriculum` | Curriculum tree with mastery |
| GET | `/curriculum/topic/:topicId` | Topic detail with lessons |
| GET | `/curriculum/weak-areas/:studentId` | Student weak areas |

### Practice

| Method | Endpoint | Description |
|---|---|---|
| POST | `/practice/start` | Start adaptive practice session |
| POST | `/practice/submit` | Submit answer (returns SessionNextStep + adaptive next question) |
| POST | `/practice/hint` | Get progressive AI hint |
| POST | `/practice/explanation` | Get full step-by-step explanation |
| GET | `/practice/menu` | AI-enriched personalised practice menu |

### Intelligence

| Method | Endpoint | Description |
|---|---|---|
| GET | `/learning/next` | Learning Brain: next best learning action |
| POST | `/tutor/ask` | Ask MathAI: freeform question with visual explanation |
| POST | `/tutor/generate-visual` | On-demand concept image generation |

### Student Data

| Method | Endpoint | Description |
|---|---|---|
| GET | `/progress/:studentId` | Progress summary |
| GET | `/daily-quests/:studentId` | Active daily quests |
| GET | `/gamification/dashboard` | XP, level, badges, streak |
| GET | `/profile` | Student profile |
| PATCH | `/profile` | Update preferences |
| GET | `/student/memory` | Learning memory snapshot |
| POST | `/student/memory/refresh` | Force memory rebuild |
| PATCH | `/student/interests` | Update student interests |

### Parent Portal

| Method | Endpoint | Description |
|---|---|---|
| GET | `/parent/dashboard/:childId` | Parent learning intelligence dashboard |

### Pet System

| Method | Endpoint | Description |
|---|---|---|
| GET | `/pet` | Student's pet |
| POST | `/pet/adopt` | Adopt/rename pet |
| GET | `/pet/catalog` | Available pets |
| GET | `/pet/insight` | Parent-facing personality insight |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Platform stats |
| GET | `/admin/users` | Paginated user list |
| GET | `/admin/users/:id` | User detail |
| PATCH | `/admin/users/:id` | Update user |

---

## Intelligence Systems

### Learning Brain Engine

Evaluates topic mastery, misconceptions, confidence trends, hint dependency, and behavioral patterns to produce a single next-best-action recommendation.

**Priority framework:** Severe misconception > Confidence recovery > Revision due > Curriculum progression > Challenge opportunity

### Session Adaptation Engine

After every answer submission, evaluates in-session patterns and decides the next step: easier/harder questions, auto-hints, visual explanations, celebration, or positive session ending.

### Dynamic Difficulty

Sessions start with medium-difficulty questions. When the adaptation engine recommends difficulty changes, new questions are generated on-demand from easy/hard pools. Guardrails prevent oscillation (max 2 shifts in 3 questions, no level skipping).

### Visual Explanation Engine

Four-layer pipeline: (1) Heuristic + AI classifier picks the visual type, (2) mathData-driven plan builder creates precise renderer data, (3) Alignment verifier cross-checks explanation/mathData/plan consistency, (4) Deterministic SVG/component renderers display the result.

### Student Learning Memory

Two-layer system: raw learning events (DB) + cached MemorySnapshot (JSON blob, 2hr TTL). Tracks misconception patterns, confidence EWMA, hint dependency per topic, and suggested focus areas.

---

## Testing

```bash
pnpm test:unit          # 149 unit tests across 7 suites
pnpm test:integration   # Integration tests (requires test DB)
pnpm test:e2e           # Playwright e2e tests
```

| Test Suite | Tests | Coverage |
|---|---|---|
| learningBrain | 14 | Decision logic, priority framework, guardrails |
| sessionAdaptation | 13 | In-session patterns, fatigue, recovery |
| questionPoolManager | 25 | Difficulty pools, exhaustion, guardrails |
| visualExplanationEngine | 31 | Classification, plan building, Phase 1 enforcement |
| mathDataPlanBuilder | 19 | Structured math data, fallback, mapping |
| alignmentVerifier | 13 | Explanation-visual consistency, fallback |
| parentInsights | 34 | Learning score, personality, clustering, insights |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | Direct DB URL (for Prisma migrations) |
| `NEXTAUTH_SECRET` | Yes | NextAuth session signing secret |
| `NEXTAUTH_URL` | Yes | Web app URL |
| `AI_PROVIDER` | Yes | `anthropic`, `gateway`, or `mock` |
| `ANTHROPIC_API_KEY` | For anthropic | Anthropic API key |
| `AI_GATEWAY_API_KEY` | For gateway | Vercel AI Gateway key |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Express API base URL |
| `NEXT_PUBLIC_USE_MOCK_DATA` | No | `true` to use mock data layer |

---

## Quick Start

```bash
git clone <repo-url>
cd mathai
npm install
cp .env.example .env           # Fill in required variables
npm run db:migrate              # Run Prisma migrations
npm run dev                     # Start web (3000) + API (3001)
```

---

## License

MIT
