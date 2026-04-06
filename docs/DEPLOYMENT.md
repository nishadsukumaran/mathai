# MathAI Deployment Guide

Complete guide to deploying MathAI from scratch — accounts, services, environment variables, and step-by-step instructions.

---

## Architecture Overview

```
                    +------------------+
                    |   mathai.aiops.ae |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+          +--------v--------+
     |    Vercel        |          |    Render        |
     |  (Next.js App)   |  HTTPS   |  (Express API)   |
     |  apps/web/       +--------->+  api/             |
     |  Static + SSR    |          |  REST + AI        |
     +--------+---------+          +--------+---------+
              |                             |
              |                    +--------v--------+
              |                    |   Supabase       |
              +------------------->+  PostgreSQL      |
                   Prisma ORM      |  (Database)      |
                                   +-----------------+
```

| Component | Platform | Purpose |
|-----------|----------|---------|
| **Frontend** | Vercel | Next.js App Router — landing page, auth, dashboard, practice, progress |
| **Backend API** | Render | Express REST API — learning brain, AI tutoring, practice sessions, gamification |
| **Database** | Supabase | PostgreSQL — users, topics, sessions, pets, parent-child links |
| **AI** | Vercel AI Gateway or Anthropic | Claude models for tutoring, explanations, topic generation |
| **Auth** | NextAuth.js | Email/password + Google OAuth + child PIN login |
| **Bot Protection** | Cloudflare Turnstile | Signup/login anti-abuse |
| **Domain** | Any registrar | Custom domain (optional) |

---

## 1. Accounts Required

Create accounts on these services (all have free tiers):

| Service | URL | Free Tier | What You Need |
|---------|-----|-----------|---------------|
| **GitHub** | github.com | Unlimited public repos | Repository hosting, CI triggers |
| **Vercel** | vercel.com | Hobby plan (free) | Frontend hosting, deployments |
| **Render** | render.com | Free web service | Backend API hosting |
| **Supabase** | supabase.com | 2 free projects | PostgreSQL database |
| **Google Cloud** | console.cloud.google.com | Free OAuth | Google sign-in (optional) |
| **Cloudflare** | dash.cloudflare.com | Free Turnstile | Bot protection (optional) |
| **Anthropic** | console.anthropic.com | Pay-as-you-go | AI tutoring (or use Vercel AI Gateway) |

---

## 2. Database Setup (Supabase)

### 2.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose organization, name it `mathai`
4. Set a strong database password (save it!)
5. Select region closest to your users (e.g., `ap-south-1` for India)
6. Click **Create new project**

### 2.2 Get Connection Strings

Go to **Project Settings > Database > Connection string**:

- **URI (pooled)** — this is your `DATABASE_URL`
  ```
  postgresql://postgres.[project-ref]:[password]@aws-1-[region].pooler.supabase.com:5432/postgres
  ```

- **URI (direct)** — this is your `DIRECT_URL` (used for migrations)
  ```
  postgresql://postgres.[project-ref]:[password]@aws-1-[region].pooler.supabase.com:5432/postgres?pgbouncer=true
  ```

### 2.3 Run Migrations

From your local machine:

```bash
# Set env vars
export DATABASE_URL="your-pooled-url"
export DIRECT_URL="your-direct-url"

# Generate Prisma client and run migrations
npx prisma generate --schema=database/schema/schema.prisma
npx prisma migrate deploy --schema=database/schema/schema.prisma
```

Alternatively, run migration SQL directly in Supabase SQL Editor if local port 5432 is blocked.

---

## 3. Backend API Setup (Render)

### 3.1 Create Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New > Web Service**
3. Connect your GitHub repo (`nishadsukumaran/mathai`)
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `mathai-api` |
| **Region** | Oregon (or closest to your DB) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm run render:build` |
| **Start Command** | `npm run render:start` |
| **Plan** | Free (or Starter $7/mo for no cold starts) |
| **Health Check Path** | `/api/health` |

### 3.2 Environment Variables (Render)

Add these in **Render > Service > Environment**:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | `postgresql://...` | Supabase pooled URL |
| `DIRECT_URL` | `postgresql://...?pgbouncer=true` | Supabase direct URL |
| `NEXTAUTH_SECRET` | `<openssl rand -hex 32>` | **Must match Vercel exactly** |
| `CORS_ORIGIN` | `https://your-domain.com` | Your Vercel frontend URL |
| `INTERNAL_SERVICE_SECRET` | `<openssl rand -hex 32>` | **Must match Vercel exactly** |
| `AI_PROVIDER` | `mock` or `anthropic` or `vercel_gateway` | See AI Setup section |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Only if `AI_PROVIDER=anthropic` |
| `AI_GATEWAY_API_KEY` | `vgk_...` | Only if `AI_PROVIDER=vercel_gateway` |

### 3.3 Generate Shared Secrets

Run these locally and use the same values on both Vercel and Render:

```bash
# NextAuth session encryption (MUST be identical on both platforms)
openssl rand -hex 32

# Internal service-to-service auth (MUST be identical on both platforms)
openssl rand -hex 32
```

### 3.4 Deploy

Render auto-deploys on push to `main`. To manually deploy:
- Render dashboard > Service > **Manual Deploy > Deploy latest commit**

### 3.5 Verify

```bash
curl https://your-render-url.onrender.com/api/health
# Should return: { "status": "ok", ... }
```

---

## 4. Frontend Setup (Vercel)

### 4.1 Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | (leave default — uses `package.json` script) |
| **Output Directory** | (leave default — `.next`) |
| **Node.js Version** | 20.x |

### 4.2 Environment Variables (Vercel)

Add these in **Vercel > Project > Settings > Environment Variables**:

| Variable | Value | Scope |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview, Dev |
| `DIRECT_URL` | `postgresql://...?pgbouncer=true` | Production, Preview, Dev |
| `NEXTAUTH_SECRET` | Same as Render | Production, Preview, Dev |
| `NEXTAUTH_URL` | `https://your-domain.com` | Production |
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-render-url.onrender.com/api` | Production, Preview, Dev |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production |
| `INTERNAL_SERVICE_SECRET` | Same as Render | Production, Preview, Dev |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | Production, Preview, Dev |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | Production, Preview, Dev |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | From Cloudflare | Production, Preview, Dev |
| `TURNSTILE_SECRET_KEY` | From Cloudflare | Production, Preview, Dev |
| `AI_PROVIDER` | `mock` or `vercel_gateway` | Production, Preview, Dev |

### 4.3 Custom Domain (Optional)

1. Vercel > Project > Settings > Domains
2. Add your domain (e.g., `mathai.aiops.ae`)
3. Update DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` to match

### 4.4 Deploy

Push to `main` triggers auto-deploy. Or use Vercel CLI:

```bash
npm i -g vercel
vercel --prod
```

---

## 5. AI Provider Setup

MathAI supports three AI modes. Choose one:

### Option A: Mock (Development / No AI Cost)

```
AI_PROVIDER=mock
```

Returns canned responses. Good for testing UI without API costs.

### Option B: Vercel AI Gateway (Recommended for Production)

1. Go to **Vercel Dashboard > AI > Gateway**
2. Enable the gateway
3. Add your Anthropic API key as a provider
4. Copy the gateway API key

```
AI_PROVIDER=vercel_gateway
AI_GATEWAY_API_KEY=vgk_...
```

Benefits: unified billing, model fallbacks, observability, zero data retention.

### Option C: Direct Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add credits (pay-as-you-go)

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### AI Models Used

| Purpose | Default Model | Env Override |
|---------|---------------|--------------|
| Fast tasks (hints, questions) | `anthropic/claude-haiku-4.5` | `AI_MODEL_DEFAULT` |
| Rich tasks (explanations) | `anthropic/claude-sonnet-4.5` | `AI_MODEL_EXPLANATION` |

---

## 6. Google OAuth Setup (Optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select existing)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for dev)
7. Copy **Client ID** and **Client Secret**

Set on Vercel:
```
GOOGLE_CLIENT_ID=1040391728437-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

---

## 7. Cloudflare Turnstile Setup (Optional)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) > Turnstile
2. Click **Add site**
3. Enter your domain
4. Widget type: **Managed**
5. Copy **Site Key** (public) and **Secret Key** (server)

Set on Vercel:
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAC...
TURNSTILE_SECRET_KEY=0x4AAAAAAC...
```

---

## 8. Local Development Setup

### 8.1 Prerequisites

- Node.js 20.x
- npm 10+
- Git
- PostgreSQL (or use Supabase remote DB)

### 8.2 Clone and Install

```bash
git clone https://github.com/nishadsukumaran/mathai.git
cd mathai
npm install
```

### 8.3 Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Minimum required for local dev:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="any-random-string-for-dev"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api"
AI_PROVIDER="mock"
```

### 8.4 Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

# (Optional) Seed sample data
npm run db:seed
```

### 8.5 Run

```bash
# Terminal 1 — Express API (port 3001)
npm run dev:api

# Terminal 2 — Next.js frontend (port 3000)
cd apps/web && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 9. Environment Variables Quick Reference

### Critical Secrets (Must Match on Vercel + Render)

| Variable | Generate With |
|----------|---------------|
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` |
| `INTERNAL_SERVICE_SECRET` | `openssl rand -hex 32` |

### Full Matrix

| Variable | Vercel | Render | Local | Required |
|----------|--------|--------|-------|----------|
| `DATABASE_URL` | Yes | Yes | Yes | Yes |
| `DIRECT_URL` | Yes | Yes | Yes | Yes |
| `NEXTAUTH_SECRET` | Yes | Yes | Yes | Yes |
| `NEXTAUTH_URL` | Yes | - | Yes | Yes |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | - | Yes | Yes |
| `NEXT_PUBLIC_APP_URL` | Yes | - | Opt | No |
| `CORS_ORIGIN` | - | Yes | - | Yes (Render) |
| `INTERNAL_SERVICE_SECRET` | Yes | Yes | Opt | Yes |
| `AI_PROVIDER` | Yes | Yes | Yes | Yes |
| `ANTHROPIC_API_KEY` | - | Opt | Opt | If anthropic |
| `AI_GATEWAY_API_KEY` | - | Opt | - | If gateway |
| `GOOGLE_CLIENT_ID` | Yes | - | Opt | No |
| `GOOGLE_CLIENT_SECRET` | Yes | - | Opt | No |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes | - | Opt | No |
| `TURNSTILE_SECRET_KEY` | Yes | - | Opt | No |
| `NODE_ENV` | Auto | `production` | Auto | No |
| `PORT` | Auto | Auto (10000) | `3001` | No |

---

## 10. Post-Deployment Checklist

- [ ] Supabase database created and migrations applied
- [ ] Render API service running — health check passes
- [ ] Vercel frontend deployed — landing page loads
- [ ] `NEXTAUTH_SECRET` identical on Vercel and Render
- [ ] `INTERNAL_SERVICE_SECRET` identical on Vercel and Render
- [ ] Sign up works (create a test parent account)
- [ ] Sign in works (email/password)
- [ ] Google OAuth works (if configured)
- [ ] Child PIN login works (create child via parent onboarding)
- [ ] Dashboard loads with data from API
- [ ] Practice session starts and submits answers
- [ ] AI tutoring responds (if AI provider configured)
- [ ] Parent dashboard shows child progress
- [ ] Custom domain resolves (if configured)
- [ ] Turnstile challenge appears on signup (if configured)

---

## 11. Troubleshooting

### Render API returns 502 Bad Gateway
- **Free tier sleeping:** Service spins down after 15 min of inactivity. Wait 30-60s or set up a cron ping (UptimeRobot free tier, ping `/api/health` every 14 min).
- **Build failed:** Check Render > Events tab for build errors.
- **Missing env vars:** Check Render > Environment tab — `DATABASE_URL` is most common.

### Vercel build fails with "No Output Directory"
- Root Directory must be set to `apps/web` in Vercel project settings.
- Framework must be `Next.js`.

### Login fails / session errors
- `NEXTAUTH_SECRET` must be **identical** on Vercel and Render.
- `NEXTAUTH_URL` must match your actual domain (including `https://`).

### Dashboard loads but shows no data
- Check browser console for CORS errors.
- Verify `CORS_ORIGIN` on Render includes your Vercel domain.
- Verify `NEXT_PUBLIC_API_BASE_URL` on Vercel points to your Render URL.

### AI tutoring returns errors
- If `AI_PROVIDER=mock`, AI returns canned responses (no API key needed).
- If `AI_PROVIDER=anthropic`, verify `ANTHROPIC_API_KEY` is set on Render and has credits.
- If `AI_PROVIDER=vercel_gateway`, verify `AI_GATEWAY_API_KEY` is set and Anthropic provider is configured in Vercel AI Gateway settings.

---

## 12. Estimated Costs

### Free Tier (Development / Small Scale)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Render | Free | Free (with cold starts) |
| Supabase | Free | Free (500MB DB, 2 projects) |
| Cloudflare Turnstile | Free | Free (unlimited) |
| Google OAuth | Free | Free |
| **AI (mock mode)** | - | **Free** |
| **Total** | | **$0/month** |

### Production (Recommended)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Render | Starter | $7/month |
| Supabase | Pro | $25/month |
| Anthropic Claude | Pay-as-you-go | ~$5-20/month (depends on usage) |
| **Total** | | **~$57-72/month** |

### Budget Production (Minimal Paid)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Render | Starter | $7/month (no cold starts) |
| Supabase | Free | Free |
| Anthropic Claude | Pay-as-you-go | ~$5/month |
| **Total** | | **~$12/month** |
