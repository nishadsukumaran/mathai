# MathAI — Learning Objectives: How Each One Is Implemented
**Date:** March 12, 2026

---

## Objective: Transform into an AI-Driven Adaptive Learning Platform

> Instead of giving the same questions to every student, the system must analyze performance, track mastery, identify weak topics, adapt difficulty, and choose the next question intelligently.

**Status: Partially achieved.**

The intelligence layer exists — student memory, mastery evaluation, and practice menu are all live. The gap is the last mile: `selectQuestions()` inside `practice_generator/index.ts` still uses a hardcoded array (`STUB_QUESTIONS`) instead of querying a real question bank. So the "next question chosen intelligently" is AI-generated on the fly by Claude Haiku, not pulled from a difficulty-tagged database. Adaptive difficulty routing is designed and coded but cannot fully execute without a structured question bank.

---

## 1. Student Learning Profile

**Spec says:** Track accuracy per topic, time per question, hints used, retry patterns, weak concept clusters.

### Accuracy per Topic
**Implementation:** `TopicProgress.accuracyRate` in the DB. Every time a practice session completes, `practiceService.ts` computes session accuracy and writes it to the `TopicProgress` row for that topic using a weighted blend:

```
newMasteryScore = prevMasteryScore × 0.7 + sessionAccuracy × 0.3
```

This is a rolling update — older performance weighs 70%, new session weighs 30%. Accuracy is also visible per topic in `studentMemoryService.getSnapshot()` under `weakTopics` and `strongTopics`.

**Verdict: ✅ Working in production.**

---

### Time per Question
**Implementation:** `QuestionAttempt.timeSpentSeconds` is recorded per attempt. `MasteryEvaluator.computeMetrics()` calculates `avgTimePerQuestion` from the session's responses. The `StudentProfile` table also has an `averageTimePerQuestion` field. The practice menu shows "Average Time per Question → X seconds" style signals via the memory snapshot.

**Verdict: ✅ Captured and computed.**

---

### Hints Used
**Implementation:** `QuestionAttempt.hintsUsed` (integer count) is stored per attempt. `MasteryEvaluator` computes `avgHintsPerQuestion` from the session. `studentMemoryService` computes `hintDependencyByTopic` — a map of topicId → average hints per question — which feeds into the AI prompt context.

One gap: the spec expects tracking **which hint level** (nudge / partial / full) was used. The DB only stores a count, not the tier. So you know "2 hints were used" but not "hint level 3 (the answer giveaway) was used."

**Verdict: ✅ Count tracked. ⚠️ Hint level per attempt not stored.**

---

### Retry Patterns
**Implementation:** Each `QuestionAttempt` records `attemptCount` (how many tries for that question). `firstAttemptAccuracy` is computed separately in `MasteryEvaluator` by filtering `r.attemptCount === 1`. When a session completes, all attempts are stored to the DB.

The retry-specific adaptive response from the spec ("if repeated retries occur, reduce difficulty, provide hints, offer explanation") is handled in `practiceService.submitAnswer()` — after an incorrect answer, the misconception engine tags the response and hints are surfaced. The difficulty reduction logic is coded in `PracticeGenerator.adaptDifficulty()` (3 correct → bump up, 2 consecutive wrong → drop down) but this is only triggered during the in-memory session, not across sessions.

**Verdict: ✅ Per-attempt retries recorded. ✅ Misconception + hint triggered on wrong answers. ⚠️ Adaptive difficulty cannot truly execute since the question bank is stubbed. ⚠️ Retry state is in-memory — wiped on server restart.**

---

### Weak Concept Clusters
**Implementation:** `studentMemoryService.getSnapshot()` returns a `weakTopics` array with topics where `masteryScore < 0.45` and at least one attempt made. The practice menu's `best_for_you` section surfaces these directly. `activeMistakePatterns` tracks misconception tags (e.g., "negative-multiplication", "unlike-denominators") with frequency counts.

What's missing is the spec's subconcept breakdown — the example "Algebra → Variables 72, Equations 48, Word Problems 35" implies a drill-down model within a topic. There is no `SubConcept` model in the DB. Weak detection works at the topic level only. The `conceptTags` on `QuestionAttempt` could theoretically support this, but there's no service that aggregates tag-level performance scores.

**Verdict: ✅ Topic-level weak detection is live and feeding the menu. ❌ Subconcept cluster scoring not implemented.**

---

## 2. Mastery Score Calculation

**Spec formula:**
```
Mastery Score = (Accuracy × 0.6) + (Speed Score × 0.2) + (Consistency × 0.2)
```

**What's actually built (`MasteryEvaluator.computeMasteryLevel`):**

The evaluator does not use a weighted numeric formula. It uses a **threshold-based classification**:

```
Extended  → accuracy ≥ 95% AND firstAttemptAccuracy ≥ 90% AND avgHints < 0.3
Mastered  → accuracy ≥ 80% AND firstAttemptAccuracy ≥ 70%
Developing → accuracy ≥ 50%
Emerging   → below 50%
```

At the `TopicProgress` DB level, the rolling `masteryScore` is computed in `practiceService.ts` purely from session accuracy:
```
newMasteryScore = prevMasteryScore × 0.7 + sessionAccuracy × 0.3
```

This is a different formula from the spec on two counts:

1. **The spec weights: Accuracy 60%, Speed 20%, Consistency 20%.** The built version uses accuracy as the only numeric input to the stored score. Speed and consistency are used as gate conditions in the classifier, not as additive weighted components.

2. **Mastery categories diverge.** The spec defines 4 levels: Weak (0–40), Learning (40–70), Good (70–90), Mastered (90–100). The built system has 5 levels: NotStarted, Emerging, Developing, Mastered, Extended. In `practiceMenuService.ts`, these are mapped with slightly different thresholds:

```typescript
function masteryFromScore(score: number): MasteryLevel {
  if (score === 0)  return "not_started";
  if (score < 40)   return "emerging";
  if (score < 70)   return "developing";
  if (score < 90)   return "mastered";
  return "extended";
}
```

The 0–40 / 40–70 / 70–90 thresholds do roughly match the spec, but the naming is different and there's an extra "Extended" level above 90% that the spec doesn't define.

**Verdict: ⚠️ Thresholds are in the right ballpark but the formula is not the spec formula. Speed and consistency are gate conditions, not weighted components. 5 levels vs spec's 4.**

---

## 3. Adaptive Question Selection Logic

**Spec says:**
- Priority 1: mastery < 50 → serve easier scaffolded questions
- Priority 2: mastery 50–70 → normal practice
- Priority 3: mastery > 80 → harder questions or new topics

**What's built (`practiceMenuService.ts`):**

The topic selection logic in the practice menu directly implements this 3-tier logic:

| Spec Priority | Built Section | Logic |
|---|---|---|
| Priority 1 (mastery < 50) | `best_for_you` | Filters `masteryScore > 0 AND masteryScore < 70`, sorted by lowest first |
| Priority 1 (reinforcement) | `revise_this` | Topics not practiced in 3+ days |
| Priority 2 (mastery 50–70) | `grade_level` | All grade topics sorted by mastery ascending |
| Priority 3 (mastery > 80) | `challenge` | Grade+1 topics not yet started |
| Spaced repetition bonus | `confidence_booster` | Mastered topics from prior grade, for retention |

The `suggestedMode` in each menu item is also adapted: topics in `best_for_you` get `"guided"` mode; topics in `challenge` get `"daily_challenge"` mode.

**The gap:** This logic selects *which topic* to practice. The spec's intent for Priority 1 specifically is to serve "easier scaffolded questions" *within* that topic. That requires `selectQuestions()` to pull lower-difficulty questions from a question bank. Since `selectQuestions()` returns `STUB_QUESTIONS.slice(0, count)` — a fixed hardcoded list — difficulty filtering by topic is not happening. When a student is in Priority 1 (weak concept), they're getting AI-generated questions, not specifically easier scaffolded ones from a curated set.

**Verdict: ✅ Topic-level 3-tier priority selection is fully implemented. ❌ Difficulty-filtered question selection within each tier is stubbed.**

---

## 4. Retry Pattern Tracking

**Spec says:** Track attempts per question. After repeated retries: reduce difficulty, provide hints, offer explanation.

**What's built:**

Each `QuestionAttempt` has an `attemptCount` field. When `submitAnswer()` is called in `practiceService.ts`, if the answer is wrong:

1. The misconception engine tags the response (`misconceptionTag` written to DB)
2. A hint is made available for the next attempt
3. `studentMemoryService.recordMistake(userId, topicId, tag)` is called to increment the pattern counter

The explanation is always returned in `SubmissionResult.explanation` — whether right or wrong.

The adaptive difficulty piece: `PracticeGenerator.adaptDifficulty()` is implemented with the exact spec logic:
```typescript
if (recentCorrect >= 3 && idx < order.length - 1)  → bump up
if (recentIncorrect >= 2 && idx > 0)               → drop down
```

However, this method exists but is **not called anywhere in `practiceService.ts`**. The service does not invoke `adaptDifficulty()` mid-session. So the retry response (hints, explanation) works, but the automatic difficulty reduction on repeated failure does not execute.

**Verdict: ✅ Retries recorded. ✅ Hints + explanation on wrong answers. ❌ `adaptDifficulty()` is coded but not called — difficulty does not actually change mid-session.**

---

## 5. Hint Tracking

**Spec says:** 3 hint levels (nudge → partial → full answer). Many hints used → reduce mastery score slightly.

**Three hint levels — implemented:**

The practice session supports 3 progressive hint levels, passed to the AI tutor (`questionGeneratorService`) which calibrates its response based on the hint level requested. Level 1 is a nudge, Level 2 is a partial solution, Level 3 is the full answer walkthrough.

**Mastery penalty — implemented (but differently from spec):**

The spec says "reduce mastery score slightly." The built system incorporates hints into the mastery classification as a gate condition:

```typescript
// Extended level requires avgHintsPerQuestion < 0.3
if (accuracy >= 0.95 && firstAttemptAccuracy >= 0.9 && avgHintsPerQuestion < 0.3)
  return MasteryLevel.Extended;
```

So heavy hint usage blocks reaching `Extended` and factors into `hintDependencyByTopic` in the memory snapshot. It's a ceiling effect rather than a direct score subtraction, but the outcome is the same — hints suppress the mastery ceiling.

**Gap:** The DB stores `hintsUsed` as an integer count per attempt. It does not store which hint level was requested. So if a student jumped straight to hint level 3 (full answer), that registers the same as using hint level 1 (gentle nudge). The severity of hint usage is lost.

**Verdict: ✅ 3 levels work. ✅ Hint usage suppresses mastery ceiling. ⚠️ Hint level granularity not stored per attempt.**

---

## 6. Question Attempt Recording

**Spec says:** Record Student ID, Question ID, Topic, Difficulty, Correct/Wrong, Time Taken, Hints Used, Attempts.

**What's built (`QuestionAttempt` model in `schema.prisma`):**

| Spec Field | DB Field | Status |
|---|---|---|
| Student ID | `userId` | ✅ |
| Question ID | `questionId` | ✅ |
| Topic | `topicId` | ✅ |
| Difficulty | `difficulty` | ✅ |
| Correct | `isCorrect` | ✅ |
| Time Taken | `timeSpentSeconds` | ✅ |
| Hints Used | `hintsUsed` | ✅ |
| Attempts | `attemptCount` | ✅ |
| Concept Tags | `conceptTags` | ✅ (bonus field) |
| Misconception Tag | `misconceptionTag` | ✅ (bonus field) |
| Confidence Before/After | `confidenceBefore`, `confidenceAfter` | ⚠️ Fields exist in schema but are never populated — no frontend UI to collect this |

Every field in the spec is captured. The attempt record is created in `practiceService.submitAnswer()` and persisted to the DB via Prisma. The spec requirement is fully met, with one bonus gap: confidence self-rating (not in spec, but added to the schema) has no data flowing into it.

**Verdict: ✅ All spec fields captured. ⚠️ Confidence before/after fields added beyond spec but not wired.**

---

## 7. Weak Concept Detection

**Spec says:** Detect clusters of weak performance. Example: "Algebra → Variables 72, Equations 48, Word Problems 35." Engine should prioritize word problems first.

**What's built:**

Topic-level weak detection is fully working:
- `studentMemoryService.getSnapshot()` computes `weakTopics` as any topic where `masteryScore < 0.45` and at least one attempt exists
- `activeMistakePatterns` lists misconception tags with frequency (e.g., "negative-multiplication × 4, unlike-denominators × 2")
- `practiceMenuService` reads `weakTopics` from the memory snapshot and surfaces them in `best_for_you`, sorted by lowest mastery first — which matches the spec's intent of prioritizing the weakest subconcept

**The subconcept gap:**

The spec's example explicitly shows a subconcept breakdown within a topic: "Algebra → Variables 72, Equations 48, Word Problems 35." This requires a `SubConcept` or `ConceptTag` model where each subconcept has its own mastery score. That model does not exist.

What exists instead: `QuestionAttempt.conceptTags` is an array of strings (e.g., `["unlike-denominators", "word-problem"]`). These tags could theoretically be aggregated to produce subconcept scores. But there is no service that reads these tags and computes a per-tag accuracy score. The `LearningMetricsService` in `services/analytics/learning_metrics.ts` appears to have been built for exactly this purpose, but it is not imported anywhere in the API routes — it is dead code.

**Verdict: ✅ Topic-level weak detection fully live and feeding the practice menu. ❌ Subconcept cluster scoring not implemented. ❌ `LearningMetricsService` which could power this is unconnected.**

---

## Summary Table

| Learning Objective | Status | Notes |
|---|---|---|
| Accuracy per topic tracked | ✅ Live | `TopicProgress.accuracyRate`, rolling weighted update |
| Time per question tracked | ✅ Live | `QuestionAttempt.timeSpentSeconds`, averaged in mastery eval |
| Hints used tracked | ✅ Live | Count stored per attempt; suppresses mastery ceiling |
| Hint level (which tier) tracked | ⚠️ Partial | Count stored, not tier level |
| Retry pattern tracking | ✅ Live | `attemptCount` per attempt, misconception tagged on failure |
| Weak concept detection (topic level) | ✅ Live | Memory snapshot, feeds practice menu |
| Weak concept detection (subconcept level) | ❌ Missing | No subconcept model or tag-level aggregation |
| Mastery score calculated | ✅ Live | Threshold-based classifier, not spec's weighted formula |
| Mastery formula matches spec | ⚠️ Diverged | Built: threshold gates. Spec: Accuracy 60% + Speed 20% + Consistency 20% |
| Mastery categories match spec | ⚠️ Diverged | Built: 5 levels (Extended added). Spec: 4 levels |
| Adaptive topic selection (3 priorities) | ✅ Live | `practiceMenuService` implements all 3 tiers |
| Difficulty-filtered question selection | ❌ Stubbed | `selectQuestions()` returns hardcoded array, not DB query |
| Adaptive difficulty mid-session | ❌ Not called | `adaptDifficulty()` coded but never invoked in `practiceService` |
| Hints + explanation on failed attempt | ✅ Live | Triggered in `submitAnswer()` on wrong answer |
| Question attempt recording (all spec fields) | ✅ Live | All 8 spec fields stored per attempt |
| Mastery updated after attempt | ✅ Live | `TopicProgress` updated on session completion |

---

*Report based on code review of: `curriculum/mastery_evaluator/index.ts`, `curriculum/practice_generator/index.ts`, `api/services/practiceService.ts`, `api/services/practiceMenuService.ts`, `ai/services/studentMemoryService.ts`, `services/analytics/learning_metrics.ts`, `database/schema/schema.prisma`*
