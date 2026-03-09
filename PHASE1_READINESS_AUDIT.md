# MathAI — Phase 1 Runtime Readiness Audit
**Date:** 2026-03-09  
**Auditor:** Claude (Cowork)  
**Verdict: NOT RUNNABLE end-to-end.**  
The codebase is well-architected with real logic in many layers, but critical wiring is missing across auth, database, API server startup, and every frontend screen.

---

## Architecture Overview

This is a monorepo with 6 distinct layers:

| Layer | Location | Tech |
|-------|----------|------|
| Frontend | `apps/web/` | Next.js 16 + Turbopack |
| API Server | `api/` | Express.js (separate process, port 3001) |
| AI Layer | `ai/` | Anthropic / Mock provider |
| Curriculum Engine | `curriculum/` | Practice generator, mastery evaluator |
| Gamification | `services/gamification/` | XP engine, badge engine |
| Database | `database/schema/schema.prisma` | PostgreSQL via Prisma v5 |

**Critical architecture gap:** The Next.js app and the Express API are two separate processes. `npm run dev` only starts Next.js. The Express API needs to be started manually. The frontend cannot reach any `/api/*` endpoint without it.

---

## 1. DATABASE READINESS — ❌ BLOCKED

| Item | Status | Notes |
|------|--------|-------|
| Prisma schema design | ✅ Complete | Well-structured, 15+ models, proper indexes |
| Tables exist in Supabase | ❌ None | `db push` keeps failing |
| NextAuth tables (User, Account, Session, VerificationToken) | ❌ Missing | Auth will 500 on first login |
| Curriculum seed data | ❓ Unknown | `database/seed/` exists, not verified |
| All API services | ⚠️ 100% mock | Every service reads from `api/mock/data.ts` in-memory |
| `@prisma/engines` version | ❌ v5.8.0 | CLI is v5.22.0 — schema engine binary incompatible |

**Root cause of db push failure:** `@prisma/engines@5.8.0` schema-engine binary uses old JSON-RPC protocol. `prisma@5.22.0` CLI sends multi-file schema format (`{files: [...]}`), the old binary rejects it with `"Invalid params: invalid type: map, expected a string"`. CDN to download the correct binary is blocked by the VM proxy.

**Workaround (actionable):** Generate the SQL manually and run it in Supabase SQL editor:
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel database/schema/schema.prisma --script
```
This outputs plain SQL you can paste into the Supabase SQL editor to create all tables.

---

## 2. ENVIRONMENT READINESS — ⚠️ PARTIAL

| Variable | Current `.env.local` | Required For | Status |
|----------|---------------------|--------------|--------|
| `DATABASE_URL` | ✅ Set (Supabase) | Prisma, NextAuth | ✅ |
| `NEXTAUTH_SECRET` | ✅ Set | NextAuth | ✅ |
| `NEXTAUTH_URL` | ⚠️ `localhost:3001` | NextAuth — wrong port | ⚠️ Fix to `:3000` |
| `NEXT_PUBLIC_APP_URL` | ⚠️ `localhost:3001` | Frontend self-links | ⚠️ Fix to `:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | ❌ NOT SET | Every API call from frontend | ❌ |
| `EMAIL_SERVER` | ❌ NOT SET | NextAuth email/magic link | ❌ |
| `EMAIL_FROM` | ❌ NOT SET | NextAuth email/magic link | ❌ |
| `GOOGLE_CLIENT_ID` | ❌ NOT SET | Google OAuth sign-in | ❌ |
| `GOOGLE_CLIENT_SECRET` | ❌ NOT SET | Google OAuth sign-in | ❌ |
| `ANTHROPIC_API_KEY` | ❌ NOT SET | Real AI tutor | ❌ |
| `AI_PROVIDER` | ❌ NOT SET | AI layer (defaults to "mock") | ⚠️ Explicitly set |
| `NODE_ENV` | ❌ NOT SET | Express logging, error handling | ⚠️ Explicitly set |

**Both auth providers (email + Google) are missing credentials — login is completely broken.**

---

## 3. AUTH READINESS — ❌ BROKEN (Two systems, neither wired)

### NextAuth (Frontend — `apps/web/lib/auth.ts`)
- PrismaAdapter configured — requires DB tables (which don't exist)
- EmailProvider configured — requires `EMAIL_SERVER` env var (not set)
- GoogleProvider configured — requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (not set)
- **Result:** Any attempt to sign in throws a 500 error

### Express API Auth Middleware (`api/middlewares/auth.middleware.ts`)
- Middleware has a **hardcoded stub** — ignores the Bearer token entirely
- Always returns `{ id: "student-stub-001", grade: "4", roles: ["student"] }`
- Comment says `// TODO: Replace stub with real JWT verification`
- **There is zero token validation code**

### JWT Bridge (Frontend → API)
- `api-client.ts` sends `Authorization: Bearer <token>` with NextAuth session token
- Express middleware receives it and throws it away, returning the stub
- **No JWT verification implementation exists anywhere**

---

## 4. AI PROVIDER READINESS — ⚠️ MOCK ONLY

| Item | Status |
|------|--------|
| Mock provider (`AI_PROVIDER=mock`) | ✅ Fully functional — returns canned tutor responses |
| Anthropic provider | ❌ SDK not installed (`ai`, `@ai-sdk/anthropic` not in package.json) |
| `AnthropicProvider.generate()` | ❌ Throws "SDK not yet activated" — ALL real calls fail |
| Retry wrapper | ✅ Built, correct exponential backoff logic |
| Provider factory / config | ✅ Clean — env-driven, easy to swap |

**Good news:** Default is mock. The entire tutor pipeline (hints, explanations, misconception detection) runs fine with mock data. Won't give real AI responses but won't crash either.

**To activate real AI (2 steps):**
1. `npm install ai @ai-sdk/anthropic` (in root)
2. Uncomment the 3 marked blocks in `ai/providers/anthropic.ts`
3. Set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY=sk-ant-...` in `.env`

---

## 5. API READINESS — ⚠️ LOGIC EXISTS, SERVER NOT RUNNING

**The Express API is NOT started by `npm run dev`. It is a separate process.** There is no `concurrently` or `turbo` configuration to start it alongside Next.js.

| Endpoint | Controller | Logic | Data Source | Runnable? |
|----------|-----------|-------|-------------|-----------|
| `GET /api/health` | ✅ | ✅ | none | ✅ (if started) |
| `GET /api/dashboard/:id` | ✅ | ✅ | Mock in-memory | ⚠️ Mock |
| `GET /api/curriculum` | ✅ | ✅ | Mock in-memory | ⚠️ Mock |
| `GET /api/progress/:id` | ✅ | ✅ | Mock in-memory | ⚠️ Mock |
| `GET /api/daily-quests/:id` | ✅ | ✅ | Mock in-memory | ⚠️ Mock |
| `GET /api/gamification/dashboard` | ✅ | ✅ | Mock in-memory | ⚠️ Mock |
| `POST /api/practice/start` | ✅ | ✅ Real logic | Mock + real gen | ⚠️ Partial |
| `POST /api/practice/submit` | ✅ | ✅ Real checking | In-memory session | ⚠️ Partial |
| `POST /api/practice/hint` | ✅ | ✅ Real pipeline | Mock AI | ⚠️ Mock AI |
| `POST /api/practice/explanation` | ✅ | ✅ Real pipeline | Mock AI | ⚠️ Mock AI |

**Port conflict:** Next.js runs on 3000 (default), Express defaults to 3001. `.env.local` currently sets `NEXTAUTH_URL=localhost:3001` which causes confusion. Fix: Next.js = 3000, Express = 3001.

---

## 6. FRONTEND READINESS — ❌ SHELLS ONLY

| Screen | File | Auth Guard | Data Wired | UI State |
|--------|------|-----------|-----------|---------|
| Landing (`/`) | `app/page.tsx` | ✅ | N/A | ⚠️ Placeholder |
| Dashboard (`/dashboard`) | `app/dashboard/page.tsx` | ✅ | ❌ All commented out | ❌ Hardcoded HTML |
| Practice (`/practice`) | `app/practice/page.tsx` | ❌ No guard | ❌ Hardcoded question | ❌ Static shell |
| Progress (`/progress`) | `app/progress/` | — | — | ❌ Directory empty, no page.tsx |
| Leaderboard (`/leaderboard`) | `app/leaderboard/` | — | — | ❌ Directory empty, no page.tsx |

The hooks in `hooks/` (React Query v5) and `lib/api-hooks.ts` are implemented but **none are used by any page**. `NEXT_PUBLIC_API_BASE_URL` is not set so `api-client.ts` falls back to `localhost:3001/api` by default — but that URL currently returns Next.js responses, not Express API responses.

---

## 7. RUN READINESS — ❌ NOT RUNNABLE END-TO-END

**What works right now:**
- ✅ Next.js dev server starts, serves `GET / 200`
- ✅ Landing page renders
- ✅ Prisma client is generated and importable
- ✅ Mock data layer is complete and consistent
- ✅ AI mock provider works

**What doesn't work:**
- ❌ Login (no auth provider credentials + no DB tables)
- ❌ Dashboard (data commented out + no auth to reach it)
- ❌ Practice session (no API server running + static UI)
- ❌ Progress page (file doesn't exist)
- ❌ Leaderboard page (file doesn't exist)
- ❌ Any API call from frontend (Express not running)
- ❌ Database writes (tables don't exist in Supabase)

---

## Gap List (Priority Order)

### P0 — Blocking everything
1. **Create DB tables in Supabase** — Use `prisma migrate diff --from-empty` → copy SQL → paste in Supabase editor
2. **Add Google OAuth credentials** (or configure email SMTP) — without at least one auth provider, nobody can log in

### P1 — Can't run the full stack without these
3. **Start Express API** — create a bat/script to run it, fix port setup so Next.js = 3000 and Express = 3001
4. **Set `NEXT_PUBLIC_API_BASE_URL`** in `.env.local` — without this, frontend API calls hit the wrong server
5. **Fix `NEXTAUTH_URL`** from `localhost:3001` to `localhost:3000`

### P2 — Core features non-functional without these
6. **Wire dashboard page** — connect React Query hooks to actual API calls
7. **Wire practice page** — connect `usePracticeSession` hook, remove hardcoded question
8. **Create progress page** (`app/progress/page.tsx`)
9. **Wire Express auth middleware** — replace student-stub with real JWT verification

### P3 — Can defer but needed before any real users
10. **Activate Anthropic SDK** — install `ai @ai-sdk/anthropic`, uncomment provider code
11. **Seed curriculum data** — topics, lessons, practice sets need to be in the DB
12. **Create leaderboard page**
13. **Persistent session storage** — practiceService uses in-memory Map (wipes on server restart)

---

## Immediate Low-Hanging Fixes Applied (see below)
- ✅ Fixed `.env.local`: corrected ports, added missing vars with sensible defaults
- ✅ Created `run-api.bat` to start the Express API on port 3001
- ✅ Created `run-both.bat` to start both servers together
- ✅ Generated Supabase SQL migration file for manual table creation
