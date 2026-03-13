# MathAI — Learning Objectives Gap Analysis
**Date:** March 12, 2026
**Scope:** Spec vs. actual implementation across all learning intelligence features

---

## Summary Verdict

The foundational layer is solid — DB schema, AI question generation, and the practice menu are production-ready. But the intelligent layer (mastery formula, adaptive selection, weak concept visualization, session persistence) is either partially wired, formula-diverged from spec, or still stubbed. About 60% of the spec is live; 40% is either incomplete, unconnected, or missing entirely.

---

## 1. Student Learning Profile

These are the signals the spec says the system must track per student.

| Signal | Spec Requires | Status |
|--------|--------------|--------|
| Accuracy rate per topic | Yes | ✅ Built — `TopicProgress.accuracyRate`, computed in `MasteryEvaluator` |
| Time per question | Yes | ✅ Built — `QuestionAttempt.timeSpentSeconds`, `StudentProfile.averageTimePerQuestion` |
| Hints used (count + level) | Yes | ✅ Built — `QuestionAttempt.hintsUsed`, `StudentProfile.totalHintsUsed` |
| Retry pattern (correct after wrong) | Yes | ✅ Partially — captured in `QuestionAttempt.isCorrect` sequence; `practiceService.ts` tracks in-memory; not persisted to a dedicated retry model |
| Weak concept clusters | Yes | ✅ Topic-level weak detection is live (`studentMemoryService.getMemorySnapshot()` returns `weakTopics`). Sub-concept clustering (e.g., "Variables → 72, Equations → 48") is **not implemented** |
| Preferred explanation style | Yes | ✅ In `StudentProfile.preferredExplanationStyle` schema field, but **not written/updated anywhere in code** |
| Confidence level (self-reported or inferred) | Yes | ✅ `QuestionAttempt.confidenceBefore/After` fields exist, but neither field is populated from the frontend |
| Interests | Yes | ✅ `StudentProfile.interests` field exists, passed to AI tutor prompt; collection flow **not confirmed on frontend** |

**Profile verdict:** The DB schema is complete. The signals that flow in from actual practice (accuracy, time, hints) are wired. The richer signals (confidence rating, preferred style, retry pattern persistence) are stored in schema but not actively written.

---

## 2. Mastery Score Calculation

### Formula Divergence

**Spec formula:**
```
Mastery Score = (Accuracy × 0.6) + (Speed Score × 0.2) + (Consistency × 0.2)
```

**Built formula (MasteryEvaluator):**
```
confidence = (0.4 × accuracy) + (0.3 × firstAttemptAccuracy) + (0.2 × (1 − hintRate)) + (0.1 × speedScore)
```

These are meaningfully different. The spec weights accuracy at 60% and includes consistency (attempt-over-attempt stability). The built version weights accuracy at only 40%, adds hint penalty as a distinct factor, and drops consistency in favor of first-attempt accuracy.

### Mastery Levels Divergence

| Spec | Built |
|------|-------|
| Weak (0–40) | NotStarted |
| Learning (40–70) | Emerging |
| Good (70–90) | Developing |
| Mastered (90–100) | Mastered |
| *(4 levels)* | Extended *(5 levels)* |

The built system has 5 levels; the spec defines 4. "Extended" (above Mastered) has no spec equivalent.

### Topic Unlock Logic

| Spec Requires | Status |
|--------------|--------|
| Unlock next topic when current is Mastered | ⚠️ Partially — `MasteryEvaluator` returns `unlockedTopicIds` but it's **hardcoded as `[]`** with a TODO comment: *"resolve from topic_tree prerequisites"* |

**Mastery verdict:** Formula is live and producing scores, but it's diverged from spec weights. Unlock logic is entirely stubbed. Mastery levels mismatch spec (5 vs 4). If the spec is the source of truth, this needs a formula reconciliation pass.

---

## 3. Adaptive Question Selection

### Priority Tier Logic

The spec defines 3 priority tiers:
1. Reinforce weak/failed topics
2. Continue current grade-level progression
3. Challenge/advance if mastery is high

| Tier | Spec | Status |
|------|------|--------|
| Tier 1 — Reinforce weak | ✅ Spec | ✅ Built — `practiceMenuService` has `revise_this` and `best_for_you` sections; weak topics get surfaced first |
| Tier 2 — Grade-level progression | ✅ Spec | ✅ Built — `grade_level` section in practice menu |
| Tier 3 — Challenge/advance | ✅ Spec | ✅ Built — `challenge` and `confidence_booster` sections |

Practice menu logic is solid and matches the spec intent.

### The Critical Gap: Question Bank

| Component | Status |
|-----------|--------|
| `practiceMenuService` — topic selection | ✅ Live |
| `questionGeneratorService` — AI generates questions | ✅ Live |
| `selectQuestions()` in `practice_generator/index.ts` | ❌ **Fully stubbed** — returns `STUB_QUESTIONS.slice(0, count)`, hardcoded array, no Prisma query |
| Difficulty bump (3 correct → harder) | ⚠️ Logic designed but depends on real question bank with difficulty tags |
| Difficulty drop (2 wrong → easier) | ⚠️ Same — designed, not executable without question bank |

**Adaptive selection verdict:** The menu layer (which topics to show) is complete. The question layer (which specific questions within a topic, with difficulty matching) is stubbed. In practice, questions are AI-generated on the fly, which means difficulty adaptation is only as good as what the AI returns — there's no structured question bank with tagged difficulty levels that the adaptive logic can query.

---

## 4. Retry Pattern Tracking

| Spec Requires | Status |
|--------------|--------|
| Track when student retries a failed question | ✅ `QuestionAttempt` records exist per attempt; retry = same question appearing again in session |
| In-session retry detection | ✅ `practiceService.ts` — `ACTIVE_SESSIONS` map tracks current session state including attempts |
| Cross-session retry detection | ⚠️ In-memory sessions are wiped on server restart — retry history doesn't survive deploys |
| Retry success rate as mastery signal | ⚠️ Not explicitly surfaced as a metric; `firstAttemptAccuracy` in `MasteryEvaluator` is the closest proxy |
| Dedicated `RetryAttempt` model in DB | ❌ No — retries are inferred from `QuestionAttempt` records, not modelled separately |

**Retry verdict:** Basic retry data is capturable from the DB, but there's no structured retry model or computed "retry success rate" metric. In-memory sessions mean active session state is fragile across restarts.

---

## 5. Hint Tracking

| Spec Requires | Status |
|--------------|--------|
| 3 hint levels (nudge → partial → full) | ✅ Built — confirmed in `practiceService` and passed to AI tutor |
| Hint usage recorded per attempt | ✅ `QuestionAttempt.hintsUsed` (integer count) |
| Hint level recorded | ⚠️ Count is stored, but **which level** of hint was used is not stored per attempt |
| Mastery penalty for hints | ✅ Built — `hintRate` fed into mastery formula as `(1 − hintRate)` factor |
| Hint dependency detection | ✅ `studentMemoryService` computes `hintDependency` flag |
| Reduce hint availability for review sessions | ❌ Not implemented — hints behave the same in all session types |

**Hint verdict:** Mostly solid. The spec's intent (track + penalize hints) is implemented. The gap is: hint level granularity per attempt is lost (only count is stored), and no "hint restriction" mode for review sessions.

---

## 6. Question Attempt Recording

| Spec Requires | Status |
|--------------|--------|
| Record per attempt: question, answer, correct/wrong | ✅ `QuestionAttempt` model — `isCorrect`, `selectedAnswer`, `correctAnswer` |
| Time spent per question | ✅ `QuestionAttempt.timeSpentSeconds` |
| Hints used count | ✅ `QuestionAttempt.hintsUsed` |
| Concept tags | ✅ `QuestionAttempt.conceptTags` (array) |
| Misconception tag | ✅ `QuestionAttempt.misconceptionTag` |
| Confidence before/after | ⚠️ Fields exist in schema (`confidenceBefore`, `confidenceAfter`) but **frontend does not send these values** |
| Session association | ✅ `QuestionAttempt.sessionId` → `PracticeSession` |

**Attempt recording verdict:** Very strong. The schema is complete and most fields are populated in production. The confidence rating fields are the only genuine gap — they require a UI component (like a quick 1–5 self-rating before/after each question) that hasn't been built.

---

## 7. Weak Concept Detection

| Spec Requires | Status |
|--------------|--------|
| Identify weak topics (accuracy < threshold) | ✅ Built — `studentMemoryService.getMemorySnapshot()` returns `weakTopics` array |
| Detect misconception patterns | ✅ Built — `misconception_engine.ts` identifies 5 pattern types via tag matching |
| Cluster-level breakdown (e.g., "Algebra → Variables 72, Equations 48") | ❌ Not built — no sub-concept model in DB; weak detection is at topic level only |
| Surface weak concepts in student dashboard | ⚠️ `ProgressView.tsx` shows topic-level mastery; sub-concept breakdown UI does not exist |
| Feed weak concepts into question selection | ✅ Connected — `practiceMenuService` reads `weakTopics` and surfaces them in `revise_this` |
| `LearningMetricsService` (`services/analytics/learning_metrics.ts`) | ❌ **Exists but is not imported or called anywhere in `api/` routes** — dead code |

**Weak concept verdict:** Topic-level detection is end-to-end wired. Sub-concept granularity is missing entirely (no model, no computation, no UI). `LearningMetricsService` — which appears purpose-built for analytics — is orphaned and needs to be wired into the API layer.

---

## 8. Features Not in Spec But Built

These are things the team built that go beyond the spec — worth knowing because they're assets:

| Feature | Where |
|---------|-------|
| AI-enriched topic recommendations | `recommendationService.ts` — Claude adds narrative reasons to menu items |
| `confidence_booster` practice section | `practiceMenuService` — re-exposes recently mastered topics to prevent forgetting |
| Student memory snapshot (2-hour cache) | `studentMemoryService` — "teacher's notebook" with interests, recent sessions, trend |
| Misconception pattern recognition | `misconception_engine.ts` — 5 named patterns via tag matching, no AI call needed |
| Grade-aware curriculum tree | `curriculum/topic_tree/index.ts` — just fixed to include G2, G5, G6, G7 |

---

## 9. Critical Gaps Summary

These are the items that need to be addressed, ranked roughly by impact:

**P0 — Breaks spec correctness:**
- `selectQuestions()` stub — adaptive difficulty is impossible without a real question bank or structured AI-generated question difficulty metadata
- `unlockedTopicIds` always returns `[]` — topic unlock/prerequisite logic is completely non-functional

**P1 — Formula and data divergence:**
- Mastery formula doesn't match spec (weights differ, 5 levels vs 4)
- `confidenceBefore/After` fields never populated — confidence tracking is schema-only
- Hint level per attempt not stored — only count

**P2 — Unconnected services:**
- `LearningMetricsService` is dead code — needs to be wired into API routes
- `preferredExplanationStyle` field never written — personalization signal lost
- In-memory `ACTIVE_SESSIONS` — session state lost on every deploy/restart

**P3 — Missing features:**
- Sub-concept cluster breakdown (spec calls for drill-down within a topic)
- Confidence self-rating UI (before/after each question)
- Hint restriction mode for review sessions
- Parent/teacher dashboard (no spec section for this either, but a common expectation)

---

## Checklist View

### Student Learning Profile
- [x] Accuracy rate tracked
- [x] Time per question tracked
- [x] Hint count tracked
- [ ] Hint level (which tier) tracked
- [ ] Confidence before/after (fields exist, not populated)
- [ ] Preferred explanation style (field exists, not written)
- [x] Interests stored and passed to AI
- [x] Weak topics identified

### Mastery Score Calculation
- [x] Multi-signal mastery formula implemented
- [ ] Formula matches spec weights (built: 40/30/20/10 vs spec: 60/20/20)
- [ ] Mastery levels match spec (built: 5 levels vs spec: 4)
- [ ] Topic unlock via prerequisite resolution (hardcoded as `[]`)

### Adaptive Question Selection
- [x] Weak topic prioritization (Tier 1)
- [x] Grade-level progression (Tier 2)
- [x] Challenge/advance for high mastery (Tier 3)
- [ ] Real question bank with difficulty tags
- [ ] Difficulty bump after 3 consecutive correct
- [ ] Difficulty drop after 2 consecutive wrong

### Retry Pattern Tracking
- [x] Attempts recorded per question
- [x] First-attempt accuracy computed
- [ ] Retry success rate as explicit metric
- [ ] Cross-session retry persistence (in-memory only)

### Hint Tracking
- [x] 3-level progressive hints
- [x] Hint count per attempt recorded
- [x] Hint penalty in mastery formula
- [x] Hint dependency flag in memory service
- [ ] Hint level per attempt stored
- [ ] Hint restriction in review sessions

### Question Attempt Recording
- [x] isCorrect, selectedAnswer, correctAnswer
- [x] timeSpentSeconds
- [x] hintsUsed
- [x] conceptTags
- [x] misconceptionTag
- [x] sessionId linkage
- [ ] confidenceBefore / confidenceAfter (UI not built)

### Weak Concept Detection
- [x] Topic-level weak detection
- [x] Misconception pattern identification (5 types)
- [x] Weak topics surfaced in practice menu
- [ ] Sub-concept cluster breakdown
- [ ] Sub-concept UI in dashboard
- [ ] LearningMetricsService wired to API routes

---

*Report generated March 12, 2026. Based on codebase review of: `curriculum/mastery_evaluator/`, `curriculum/practice_generator/`, `api/services/practiceMenuService.ts`, `api/services/practiceService.ts`, `ai/services/studentMemoryService.ts`, `ai/services/recommendationService.ts`, `ai/tutor/misconception_engine.ts`, `services/analytics/learning_metrics.ts`, `database/schema/schema.prisma`.*
