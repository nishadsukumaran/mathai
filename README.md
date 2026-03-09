# MathAI — Gamified AI-Powered Math Learning Platform

MathAI is a full-stack TypeScript monorepo that combines adaptive AI tutoring with a gamification engine to help primary-school students build genuine math mastery.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Zustand, React Query |
| Backend API | Node.js + Express (REST), Zod validation |
| AI Tutor | Anthropic Claude via Vercel AI SDK |
| Auth | NextAuth.js (Email + Google OAuth) |
| Database | PostgreSQL + Prisma ORM |
| Monorepo | Turborepo |
| Testing | Jest (unit + integration) · Playwright (e2e) |
| Deploy | Vercel (web) · Railway / Render (API + DB) |

---

## Monorepo Structure

```
MathAI/
├── apps/web/          # Next.js frontend
├── api/               # Express REST API
├── ai/                # AI tutor orchestration pipeline
├── curriculum/        # Curriculum engine (topics, lessons, mastery)
├── services/          # Gamification, analytics
├── database/          # Prisma schema + seed
├── types/             # Shared TypeScript types
├── claude/            # Claude agent instructions & skill guides
└── tests/             # Unit, integration, e2e
```

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9  (`npm install -g pnpm`)
- **PostgreSQL** ≥ 15 (local or Docker)
- **Anthropic API key** (Claude Sonnet or above)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/mathai.git
cd mathai
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/mathai_dev
ANTHROPIC_API_KEY=sk-ant-...
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

### 3. Set up the database

```bash
# Run migrations
pnpm prisma migrate dev --name init

# Seed with curriculum data and a dev student
pnpm prisma db seed
```

### 4. Start development servers

```bash
# Both web (port 3000) and API (port 3001) via Turborepo
pnpm dev
```

Or run individually:

```bash
# API only
pnpm --filter api dev

# Web only
pnpm --filter web dev
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all services in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | ESLint across all packages |
| `pnpm typecheck` | TypeScript type-check across all packages |
| `pnpm test` | Run all Jest tests |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:integration` | Integration tests (requires test DB) |
| `pnpm test:e2e` | Playwright e2e tests (requires running dev server) |
| `pnpm prisma studio` | Open Prisma Studio to browse the DB |
| `pnpm prisma migrate dev` | Create and apply a new migration |

---

## API Overview

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/practice/start` | Start a practice session |
| POST | `/practice/submit` | Submit an answer |
| POST | `/practice/hint` | Get a progressive hint |
| POST | `/practice/explanation` | Get a step-by-step explanation |
| GET | `/curriculum` | Full curriculum tree |
| GET | `/curriculum/topic/:topicId` | Single topic detail |
| GET | `/curriculum/weak-areas` | Student weak areas |
| GET | `/progress` | Student progress summary |
| GET | `/progress/daily-quests` | Active daily quests |
| GET | `/gamification/dashboard` | Gamification dashboard |

All endpoints except `/health` require a valid NextAuth session token.

---

## Environment Variables Reference

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for the AI tutor |
| `NEXTAUTH_SECRET` | Yes | Random secret for NextAuth session signing |
| `NEXTAUTH_URL` | Yes | Full URL of the web app (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

---

## Testing

```bash
# Unit tests
pnpm test:unit

# Integration tests (requires DATABASE_URL_TEST in .env.test)
pnpm test:integration

# E2e tests (requires pnpm dev running)
pnpm test:e2e
```

Coverage report is generated in `coverage/` after `pnpm test --coverage`.

---

## Contributing

See `claude/CLAUDE.md` for architecture principles, agent instructions, and the PR checklist that applies to every contribution.

---

## License

MIT
