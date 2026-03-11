# Wave 5 — Student Learning Memory: Design Report

## The Problem

MathAI was acting like a generic chatbot. Every session started fresh — no knowledge of what the student had struggled with last week, what their confidence was like, or which misconceptions kept tripping them up. A real teacher never does this. Wave 5 fixes that.

---

## Memory Model

The student memory is a two-layer system:

**Layer 1 — Raw event storage (Postgres, append-only)**
Every meaningful learning event is recorded as it happens. This is the source of truth.

**Layer 2 — MemorySnapshot (derived, JSON blob, cached)**
A pre-built summary queried from Layer 1, cached per student with a 2-hour TTL. This is what the AI actually reads — it never queries raw event tables at inference time.

---

## DB Fields & Tables

### Existing tables — extended

**`student_profiles`** — 4 new columns:
- `interests TEXT DEFAULT ''` — comma-separated interest keywords (e.g. "football, space, minecraft")
- `total_hints_used INT DEFAULT 0` — lifetime hint counter
- `total_questions_attempted INT DEFAULT 0` — lifetime question counter
- `avg_confidence_score FLOAT DEFAULT 50` — EWMA rolling confidence (α = 0.3), updated per session

### New tables

**`lesson_progress`** — per-lesson tracking per student
```
userId          TEXT  FK → users.id
lessonId        TEXT  FK → lessons.id
topicId         TEXT
isStarted       BOOL  DEFAULT false
isCompleted     BOOL  DEFAULT false
startedAt       TIMESTAMP
completedAt     TIMESTAMP
lastScore       FLOAT                  -- last session accuracy for this lesson
attemptsCount   INT   DEFAULT 0
```

**`topic_mistake_patterns`** — aggregated misconception tracking
```
userId          TEXT  FK → users.id
topicId         TEXT  FK → topics.id
tag             TEXT                   -- e.g. "fraction-comparison", "place-value-tens"
count           INT   DEFAULT 1        -- how many times observed
isResolved      BOOL  DEFAULT false    -- true when ≥80% on ≥3 recent attempts
resolvedAt      TIMESTAMP
lastSeenAt      TIMESTAMP
UNIQUE(userId, topicId, tag)
```

**`student_memory_snapshots`** — cached MemorySnapshot per student
```
userId          TEXT  PK FK → users.id
snapshot        JSONB                  -- full MemorySnapshot JSON
refreshedAt     TIMESTAMP              -- when last rebuilt
```

---

## MemorySnapshot — What It Contains

```typescript
interface MemorySnapshot {
  version:                 1;
  lessonsStarted:          string[];          // lesson IDs
  lessonsCompleted:        string[];          // lesson IDs
  topicsAttempted:         string[];          // topic IDs seen at least once
  strongTopics:            StrongTopic[];     // mastery ≥ 75 — top 5
  weakTopics:              WeakTopic[];       // mastery < 55, attempted — top 5
  activeMistakePatterns:   MistakePattern[];  // unresolved, count ≥ 2 — top 5
  hintDependencyByTopic:   Record<string, number>;  // avg hints per question per topic
  confidenceTrend:         "rising" | "stable" | "falling";
  avgConfidenceScore:      number;            // 0–100, EWMA
  preferredExplanationStyle: string;
  learningPace:            string;
  interests:               string[];
  recentSessions:          RecentSession[];   // last 5 sessions
  suggestedFocusTopics:    string[];          // top 3 — AI's recommendation
  lastRefreshedAt:         string;
}
```

**Snapshot TTL**: 2 hours. Rebuilt on session completion, or force-refreshable via the API.

**`suggestedFocusTopics` scoring** (inside `rebuildSnapshot()`):
```
score = (activeMisconceptions × 2) + (1 − masteryScore) × 3 + stalePracticeBonus(1)
```
Top 3 by score become the suggested focus topics.

**Confidence trend**: compares last-7-day average `confidenceAfter` vs prior-7-day average. Delta > 8 = rising, < -8 = falling, else stable.

---

## Services

### `ai/services/studentMemoryService.ts` (new)

The core. Everything else calls this.

| Method | Purpose |
|--------|---------|
| `getSnapshot(userId)` | Returns cached snapshot if fresh, else rebuilds. Always non-throwing. |
| `refreshSnapshot(userId)` | Force rebuild + persist. Returns new snapshot. |
| `markLessonStarted(userId, lessonId, topicId)` | Upserts `lesson_progress.isStarted = true`. |
| `markLessonProgress(userId, lessonId, score, completed)` | Updates score + completed state. |
| `recordMistake(userId, topicId, tag)` | Upserts `topic_mistake_patterns` (increment count). |
| `checkAndResolvePatterns(userId, topicId)` | Marks patterns resolved if recent 3 attempts ≥ 80%. |
| `updateProfileCounters(userId, sessionData)` | Increments lifetime counters, EWMA confidence. |
| `formatForPrompt(snapshot)` | Renders snapshot as readable text for AI prompt injection. |

**Important implementation note**: All new-table operations use `prisma.$queryRaw` and `prisma.$executeRaw` with `ON CONFLICT` upserts because `prisma generate` can't run until the migration is applied. Existing typed models (User, StudentProfile, etc.) still use the regular Prisma client.

### Updated services

**`api/services/practiceService.ts`**
- `startSession()`: parallel memory fetch → passes `activeMisconceptionsForTopic`, `recentMistakes`, `interestKeywords` to question generator
- `submitAnswer()`: `recordMistake()` on wrong answers (fire-and-forget), `checkAndResolvePatterns()` on correct
- `completeSession()`: `markLessonProgress()` + `updateProfileCounters()` + `refreshSnapshot()` via `Promise.allSettled` — all non-blocking

**`ai/services/askMathAIService.ts`**
- Accepts `userId` on the request
- Loads full snapshot before building the prompt
- Injects `STUDENT LEARNING HISTORY` block into every Ask MathAI call
- Adapts tone, style, pace, and examples based on the student's memory

**`ai/services/questionGeneratorService.ts`**
- `studentContext` now includes `activeMisconceptionsForTopic` and `weakTopicNames`
- Prompt explicitly targets known misconceptions: *"KNOWN MISCONCEPTIONS on this topic — target these with questions that expose and correct the error"*

**`ai/services/recommendationService.ts`**
- `enrich()` accepts optional `MemorySnapshot` as third argument
- Builds a `memoryBlock` string from misconceptions, weak/strong topics, confidence trend, interests
- Injected into the AI ranking prompt for genuinely personalised recommendations

**`api/services/practiceMenuService.ts`**
- Fetches snapshot before the AI enrichment step
- Passes memory to `recommendationService.enrich()`

---

## API Endpoints

All require authentication.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/student/memory` | Returns the student's current MemorySnapshot (cached, max 2h old) |
| `POST` | `/api/student/memory/refresh` | Force-rebuilds the snapshot now and returns the new one |
| `PATCH` | `/api/student/interests` | Updates the student's interest keywords (triggers snapshot refresh) |

---

## Affected Frontend Screens

### Dashboard
- **Recommended Topics card**: `suggestedFocusTopics` from the snapshot drives the "Your Focus This Week" section. No more hardcoded "study fractions" — it's genuinely personalised.
- **Confidence indicator**: `confidenceTrend` ("rising" / "stable" / "falling") can drive a visual trend arrow on the student card.

### Practice Menu
- All 5 sections (`best_for_you`, `revise_this`, `grade_level`, `challenge`, `confidence_booster`) now feed through AI enrichment that has access to the full memory snapshot. The `reason` and `encouragement` copy on each topic card is student-specific, not generic.

### Ask MathAI
- The tutor now responds as if it knows the student. A student who keeps confusing equivalent fractions will get explanations that directly address that misconception. A student who loves football gets football-themed examples.
- No UI change required — the personalisation is in the AI response content.

### Practice Session
- Questions are generated with `activeMisconceptionsForTopic` — so a session on fractions for a student who keeps confusing numerator and denominator will have questions specifically designed to surface and correct that error.
- After enough correct answers on a misconception pattern, `checkAndResolvePatterns()` marks it resolved and it stops appearing in AI prompts.

### Progress Screen
- `GET /api/student/memory` can power a "My Learning Profile" expansion panel:
  - Confidence trend with sparkline
  - Strong topics list
  - Active misconceptions being worked on
  - Hint dependency heatmap by topic

---

## What Was Stored vs Derived

| Data | Storage | Why |
|------|---------|-----|
| Lesson started/completed | DB (`lesson_progress`) | Source of truth, needed for unlock logic |
| Misconception patterns | DB (`topic_mistake_patterns`) | Needs persistence, resolution tracking |
| Session accuracy / hints | DB (`practice_sessions`, `question_attempts`) | Already existed |
| Confidence score (EWMA) | DB (`student_profiles.avg_confidence_score`) | Low-write, needs to survive restarts |
| Interests | DB (`student_profiles.interests`) | User-set preference |
| Strong/weak topics | Derived (snapshot) | Computed from `topic_progress.mastery_score` |
| Suggested focus topics | Derived (snapshot) | Scored at rebuild time, not worth storing |
| Hint dependency by topic | Derived (snapshot) | Aggregated from `question_attempts` |
| Confidence trend | Derived (snapshot) | 7-day windowed average, cheap to recompute |
| Full MemorySnapshot | Cached in DB | Avoids 7-table join on every AI call |

---

## Commit

`29cd052` — pushed to `main` on 2026-03-11
