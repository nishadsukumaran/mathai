# Dashboard Performance Analysis — MathAI
**Date:** 2026-03-12  
**Scope:** `GET /dashboard/:userId` + `/curriculum` — triggered on every student dashboard load

---

## TL;DR

The "server taking too long to respond" error has **one dominant cause** (Render free tier cold start killing the 10s timeout) and **five compounding code-level issues** that make the actual query path needlessly slow. Fix the infra first, then clean up the code.

---

## How the Error Is Triggered

`DashboardContainer.tsx` calls two APIs in parallel:

```ts
const [dashboard, curriculum] = await Promise.all([
  apiFetch(`/dashboard/${userId}`),
  apiFetch<unknown[]>("/curriculum").then(d => d ?? []),
]);
if (!dashboard) {
  return <p>The server is taking too long to respond...</p>;
}
```

`apiFetch` in `lib/api.ts` has a hard **10-second AbortController timeout**:

```ts
const timeout = setTimeout(() => controller.abort(), 10_000);
```

When the Express API on Render free tier hasn't received traffic in ~15 minutes, the instance spins down. Cold starts take **30–60 seconds**. The request aborts at 10s, `apiFetch` returns `null`, and the error screen is shown. This is the primary cause — it happens before a single line of application logic runs.

---

## Root Cause #1 — Render Free Tier Cold Starts (PRIMARY)

**Impact:** Causes 100% of "server taking too long" errors for users hitting a cold instance.  
**Frequency:** Any user who visits after ~15 minutes of inactivity.

The 10s timeout is shorter than the Render free tier cold start window (30–60s). The request always loses this race.

### Fix options (pick one):

| Option | Cost | Effort | Effect |
|--------|------|--------|--------|
| Upgrade to Render Starter ($7/mo) | $7/mo | 5 min | Eliminates cold starts entirely |
| Add a keepalive pinger (cron every 10 min hitting `/health`) | $0 | 30 min | Keeps instance warm; not 100% reliable |
| Increase apiFetch timeout to 90s + add a loading skeleton | $0 | 1 hr | Survives cold starts; worse UX during wait |
| Migrate API to Vercel serverless (same infra as Next.js) | $0–$20/mo | 1–2 days | Eliminates the problem architecturally |

**Recommended:** Upgrade Render tier. $7/mo is worth not having users see error screens.

---

## Root Cause #2 — `getStreakForStudent` Called Sequentially After `Promise.all`

**File:** `api/controllers/dashboardController.ts`  
**Impact:** Adds one full DB round-trip (~5–15ms on Supabase) to every dashboard load, in series after the parallel block.

```ts
// Current (broken):
const [student, gamification, quests, progress] = await Promise.all([
  getStudentWithProfile(studentId),
  getGamificationDashboard(studentId),
  getDailyQuests(studentId),
  getProgressSummary(studentId),
]);
const streak = await getStreakForStudent(studentId); // ← sequential, should be inside Promise.all
```

### Fix:
Move `getStreakForStudent` inside the `Promise.all`.

---

## Root Cause #3 — Triple `studentProfile.upsert` (Three Writes on Every Load)

`studentProfile.upsert` is called **3 times per dashboard request** — once in each of these services:

| Service | Line | Query |
|---------|------|-------|
| `studentService.ts` — `getStudentWithProfile` | ~line 12 | `prisma.studentProfile.upsert` |
| `gamificationService.ts` — `getGamificationDashboard` | ~line 8 | `prisma.studentProfile.upsert` (duplicate) |
| `progressService.ts` — `getProgressSummary` | ~line 16 | `prisma.studentProfile.upsert` (duplicate) |

A `upsert` is a read + conditional write. Running it 3 times in parallel means 3 concurrent writes to the same row — wasted work plus potential lock contention.

### Fix:
The profile upsert should live in exactly one place: `studentService.getStudentWithProfile`. The other services should receive the profile as a parameter, or use a plain `findUnique` if they only need to read it.

---

## Root Cause #4 — Triple `streak` Fetch + `topicProgress` Fetch

On a single dashboard load:

| Table | Times fetched | By |
|-------|-------------|-----|
| `streak` | 3× | `getGamificationDashboard`, `getProgressSummary`, `getStreakForStudent` |
| `topicProgress` | 2× in `/dashboard` + 1× in `/curriculum` = 3× total | `getStudentWithProfile`, `getProgressSummary`, `getCurriculumTree` |
| `studentProfile` (upsert) | 3× | see Root Cause #3 |

### Fix:
Fetch `streak` and `topicProgress` once at the controller level, and pass the results down to the services that need them. Or refactor the dashboard service into a single cohesive function that fetches each table exactly once.

---

## Root Cause #5 — Sequential Queries Inside `getProgressSummary`

**File:** `api/services/progressService.ts`

The four queries inside `getProgressSummary` run sequentially (each `await` blocks the next):

```ts
const profile          = await prisma.studentProfile.upsert(...);  // wait
const streak           = await prisma.streak.findUnique(...);       // wait
const topicProgressRows = await prisma.topicProgress.findMany(...); // wait
const totalTopics      = await prisma.topic.count();                // wait
```

Even though `getProgressSummary` is called inside a `Promise.all` alongside other services, its internal queries are still sequential. This adds ~3–4 sequential DB round-trips to the critical path inside what looks like a parallel call.

### Fix:
These four queries are independent — wrap them in their own `Promise.all`:

```ts
const [profile, streak, topicProgressRows, totalTopics] = await Promise.all([
  prisma.studentProfile.upsert(...),
  prisma.streak.findUnique(...),
  prisma.topicProgress.findMany(...),
  prisma.topic.count(),
]);
```

(After deduplication from Root Cause #3 and #4, only `topic.count()` and the streak fetch remain here — the others should be passed in from the controller.)

---

## Root Cause #6 — N+1 Query in `getWeakAreas` (Bonus Find)

**File:** `api/services/curriculumService.ts`, `getWeakAreas`

This function loops over a student's topic progress rows and fires a separate `prisma.topic.findUnique` per topic:

```ts
for (const [topicId, progress] of Object.entries(progressMap)) {
  const dbTopic = await prisma.topic.findUnique({ where: { id: topicId } }).catch(() => null); // N queries!
```

A student with 20 topics in progress triggers 20 sequential DB queries. This function isn't called on the dashboard page, but if it ever is — or gets called frequently on other pages — it will be very slow.

### Fix:
Replace the loop with a single `prisma.topic.findMany({ where: { id: { in: topicIds } } })`.

---

## Total DB Query Count (Current vs Ideal)

### Current — per dashboard page load (after cold start is resolved)

| Source | Queries | Notes |
|--------|---------|-------|
| `getStudentWithProfile` | 3 sequential | user + profile upsert + topicProgress |
| `getGamificationDashboard` | 3+ sequential | profile upsert (dup) + streak (dup) + badges |
| `getDailyQuests` | 1 (or 5 on first load of day) | quest progress + optional: templates + 3 creates |
| `getProgressSummary` | 4 sequential | profile upsert (dup) + streak (dup) + topicProgress (dup) + topic count |
| `getStreakForStudent` | 1 sequential (after Promise.all!) | streak (dup ×3) |
| `/curriculum` HTTP call | 2+ | topicProgress (dup) + curriculumStrand |
| **Total** | **~14–20** | 3 writes, many duplicates |

### After fixes — per dashboard page load

| Source | Queries | Notes |
|--------|---------|-------|
| Controller-level fetch | 4 parallel | user + topicProgress + streak + badges |
| `studentProfile.upsert` (once, lazy) | 1 | only if profile doesn't exist yet |
| `getDailyQuests` | 1 (or 5 on first load of day) | unchanged |
| `topic.count()` | 1 | for progress summary |
| `/curriculum` HTTP call | 1 | curriculumStrand (topicProgress passed via shared fetch) |
| **Total** | **~7–9** | 0–1 writes, no duplicates |

---

## Schema Indexes — No Issues Found

The Prisma schema has appropriate indexes on all hot query paths:

- `topicProgress`: `@@unique([userId, topicId])`, `@@index([userId, isMastered])`, `@@index([userId, lastPracticedAt])`
- `studentQuestProgress`: `@@unique([userId, questId, expiresAt])`, `@@index([userId, status])`
- `studentBadge`: `@@unique([userId, badgeId])`, `@@index([userId])`
- `streak`: unique per userId via the one-to-one relation

No missing indexes to add. The query slowness is architectural, not index-related.

---

## Prioritised Fix List

| Priority | Fix | Effort | Expected Gain |
|----------|-----|--------|---------------|
| 🔴 P0 | Upgrade Render to paid tier (or add keepalive) | 5–30 min | Eliminates cold-start errors entirely |
| 🟠 P1 | Move `getStreakForStudent` inside `Promise.all` | 5 min | Removes 1 sequential DB round-trip from every load |
| 🟠 P1 | Deduplicate `studentProfile.upsert` — call once, pass result down | 1–2 hrs | Removes 2 redundant writes per load |
| 🟡 P2 | Deduplicate `streak` and `topicProgress` fetches at controller level | 2–3 hrs | Removes 4–6 redundant DB queries per load |
| 🟡 P2 | Parallelize queries inside `getProgressSummary` | 30 min | Removes 3 sequential DB waits inside the parallel block |
| 🟢 P3 | Fix N+1 in `getWeakAreas` (batch topic lookup) | 30 min | Prevents future perf issues on weak-areas endpoints |
| 🟢 P3 | Cache `/curriculum` response (it's mostly static) | 1–2 hrs | Eliminates the second HTTP roundtrip on every dashboard load |

---

## Quick Win You Can Ship Today

If you can't upgrade Render right now, the fastest stopgap is a keepalive cron. Add a scheduled job (GitHub Actions, cron-job.org, or the Render cron feature) that hits `GET /health` every 10 minutes. This keeps the instance warm and eliminates most cold starts at zero cost.
