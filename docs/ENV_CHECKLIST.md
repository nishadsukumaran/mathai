# MathAI — Runtime Environment Checklist

> Last updated: 2026-03-10
> Covers: Next.js frontend (apps/web), Express API (api/), Prisma ORM (database/)

---

## 1. Variables required by `apps/web` (Next.js frontend)

| Variable | Required | Public | Default | Purpose |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | No | — | Prisma reads this at build time for `prisma generate` |
| `NEXTAUTH_SECRET` | Yes | No | `""` | JWT session encryption key. Must match the API's value exactly |
| `NEXTAUTH_URL` | Yes (local only) | No | — | Canonical URL for NextAuth redirects. Not needed on Vercel (auto-detected) |
| `GOOGLE_CLIENT_ID` | No | No | — | Google OAuth. Omit to disable Google sign-in |
| `GOOGLE_CLIENT_SECRET` | No | No | — | Google OAuth secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Yes | `http://localhost:3000` | Used in next.config.ts and passed to API for CORS |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Yes | `http://localhost:3001/api` | Express API base URL called from browser |
| `NEXT_PUBLIC_USE_MOCK_DATA` | No | Yes | not set | Set `"true"` to bypass API entirely (offline dev) |
| `NODE_ENV` | Auto | No | `development` | Set automatically by Next.js / Vercel |

## 2. Variables required by the Express API

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | Yes | `3001` | Server listen port. Render injects this automatically |
| `NODE_ENV` | Yes | `development` | Controls error detail, Prisma log level, Morgan logging |
| `DATABASE_URL` | Yes | — | Postgres connection string for Prisma |
| `NEXTAUTH_SECRET` | Yes | `""` | Decrypts NextAuth JWE tokens in auth middleware. Must match frontend |
| `CORS_ORIGIN` | Yes (prod) | `""` | Primary allowed origin (your Vercel URL) |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Secondary CORS origin. Redundant if CORS_ORIGIN is set, but used as fallback |
| `AI_PROVIDER` | No | `"mock"` | `"mock"` / `"anthropic"` / `"openai"` |
| `ANTHROPIC_API_KEY` | If anthropic | — | Claude API key |
| `AI_MODEL_DEFAULT` | No | `claude-3-5-haiku-20241022` | Default model for hints, quick responses |
| `AI_MODEL_EXPLANATION` | No | same as default | Model for detailed explanations (can use a richer model) |
| `MOCK_AI_DELAY_MS` | No | `0` | Simulated latency for mock provider (dev/testing only) |

## 3. Variables required by Prisma

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. Format: `postgresql://USER:PASS@HOST:PORT/DB?schema=public` |

Prisma reads `DATABASE_URL` via `env("DATABASE_URL")` in `database/schema/schema.prisma`.
This single variable is needed everywhere Prisma runs: local dev, Vercel build, Render runtime, migrations.

---

## 4. Which are required where

### Local development only

| Variable | Notes |
|---|---|
| `NEXTAUTH_URL` | Must match your local Next.js port (e.g. `http://localhost:3000` or `http://localhost:3002`) |
| `MOCK_AI_DELAY_MS` | Optional, only useful locally |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Optional, for frontend-only dev without backend |

### Vercel only

| Variable | Notes |
|---|---|
| `DATABASE_URL` | For `prisma generate` at build time |
| `NEXTAUTH_SECRET` | Session encryption |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL (e.g. `https://mathai.vercel.app`) |
| `NEXT_PUBLIC_API_BASE_URL` | Your Render API URL (e.g. `https://mathai-api.onrender.com/api`) |
| `GOOGLE_CLIENT_ID` | If Google OAuth is enabled |
| `GOOGLE_CLIENT_SECRET` | If Google OAuth is enabled |

> `NEXTAUTH_URL` is NOT needed on Vercel — it auto-detects from `VERCEL_URL`.

### Render only

| Variable | Notes |
|---|---|
| `NODE_ENV` | Set to `production` in render.yaml |
| `DATABASE_URL` | Postgres connection string (set in Render dashboard) |
| `NEXTAUTH_SECRET` | Must match Vercel's value exactly |
| `CORS_ORIGIN` | Your Vercel URL (e.g. `https://mathai.vercel.app`) |
| `AI_PROVIDER` | `"mock"` for MVP, `"anthropic"` when ready |
| `ANTHROPIC_API_KEY` | Only if `AI_PROVIDER=anthropic` |

> `PORT` is injected by Render automatically. Do not set it manually.

---

## 5. Unused / misleading variables (REMOVE)

These exist in the old `.env.example` but are **not referenced anywhere in code**:

| Variable | Status | Action |
|---|---|---|
| `OPENAI_API_KEY` | Not used — OpenAI provider is a TODO stub | Remove |
| `AI_GATEWAY_URL` | Not used — no Cloudflare AI Gateway integration exists | Remove |
| `ENABLE_VISUAL_EXPLANATIONS` | Not used — no code reads this flag | Remove |
| `ENABLE_ADAPTIVE_ENGINE` | Not used — no code reads this flag | Remove |
| `ENABLE_GAMIFICATION` | Not used — no code reads this flag | Remove |

The old `.env.example` also listed `AI_MODEL_DEFAULT` with the wrong value (`claude-3-5-sonnet`) — code actually defaults to `claude-3-5-haiku-20241022`.

---

## 6. Clean `.env.example` files

See the three files created alongside this checklist:

- **`.env.example`** — Root-level, covers local development (API + Prisma + general)
- **`apps/web/.env.example`** — Next.js frontend variables
- **`render.env.example`** — What to set in the Render dashboard

---

## 7. Security notes

- `NEXTAUTH_SECRET` must be the same value in both Vercel and Render. If they mismatch, the API cannot decrypt frontend session tokens.
- Generate a strong secret: `openssl rand -hex 32`
- `DATABASE_URL` contains credentials — never commit it.
- `GOOGLE_CLIENT_SECRET` is sensitive — Vercel env vars only, never in code.
- The current `apps/web/.env.local` contains real Supabase and Google OAuth credentials. Rotate them if the repo has ever been public.
