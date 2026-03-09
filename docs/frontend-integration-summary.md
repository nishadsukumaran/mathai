# Frontend Integration Summary

**Date:** March 2026
**Status:** Backend complete (mock layer). Frontend-ready contracts in place.

---

## What's Stable (build UI against these now)

These contracts are final. Response shapes will not change when switching from mock to live.

### Stable contracts

| Contract | Confidence | Notes |
|---|---|---|
| Dashboard response shape | ✅ Stable | All fields confirmed. `recommendedLesson` is optional. |
| `XPStatus` shape | ✅ Stable | `progressPct` pre-computed — no frontend math needed. |
| `StreakStatus` shape | ✅ Stable | `shieldActive` ready for UI |
| `DailyQuest` shape | ✅ Stable | `completedAt` is null-able — check for null, not falsy |
| `EarnedBadge` shape | ✅ Stable | `iconUrl` is always a valid path |
| `PracticeQuestion` shape | ✅ Stable | `correctAnswer` intentionally withheld from question object |
| `SubmissionResult` | ✅ Stable | `nextAction` enum drives all branch logic |
| `TutorResponse` shape | ✅ Stable | `visualPlan` and `similarExample` are optional |
| `TutorStep.formula` (LaTeX) | ✅ Stable | Use KaTeX to render |
| Error envelope | ✅ Stable | `{ success: false, error: { code, message } }` |
| HTTP status codes | ✅ Stable | 200 success, 400/401/403/404/500 errors |

### Stable field values (safe to hardcode mapping logic)

| Field | Values | Change risk |
|---|---|---|
| `masteryLevel` | `not_started`, `emerging`, `developing`, `mastered`, `extended` | None |
| `lessonState` | `locked`, `unlocked`, `in_progress`, `completed`, `mastered` | None |
| `nextAction` | `next_question`, `retry`, `session_complete` | None |
| `helpMode` | `hint_1`, `hint_2`, `next_step`, `explain_fully`, `teach_concept`, `similar_example` | None |
| `diagramType` | `fraction_bar`, `array`, `number_line`, `place_value_chart`, `coordinate_grid`, `none` | None |
| `questionType` | `fill_in_blank`, `multiple_choice`, `true_false` | None |
| `practiceMode` | `topic_practice`, `daily_challenge`, `weak_area_booster`, `guided`, `review` | None |

---

## What Will Change When Backend Goes Live

These are the fields or shapes likely to evolve during live integration.

| Item | Expected Change | Impact |
|---|---|---|
| `student.avatarUrl` | Path will be an S3 CDN URL, not `/avatars/...` | Image `src` just needs to accept absolute URLs — low effort |
| `badges[*].iconUrl` | Same as above — CDN path | Same fix |
| `DailyQuest.id` suffix | Will use DB uuid instead of `timestamp` suffix | No impact — treat as opaque string |
| `sessionId` format | Will be a nanoid/uuid, not `session-{timestamp}` | No impact — opaque string |
| `recommendedLesson` | May gain `remainingMinutes` or `progressPct` field | Just ignore unknown fields |
| `VisualPlan.data` shape | Will be typed per `diagramType` as diagrams are built | Build diagram components to safely ignore unknown keys |
| `topicProgress[*].lastPracticed` | Currently a date string, may become `null` if never played | Already typed as optional — no change |
| `streak.lastActiveDate` | Will be UTC ISO datetime, currently date-only | Parse with `new Date()` safely either way |
| Leaderboard | Entire endpoint doesn't exist yet | Build screen with mock only |

---

## Recommended UI Build Order

Build in this order to match backend readiness and maximise what can be demoed early.

### Phase 1 — Build with mock data (start today)

These screens only need the mock layer. No backend interaction required.

1. **`/dashboard`** — Highest impact demo screen. All data already mocked.
   - XP bar, streak counter, quest cards, recommended lesson CTA, badge shelf
   - Use `useDashboard()` hook in mock mode

2. **`/practice`** — Core product flow. Complete mock data for start → submit → hint → explain → complete.
   - Full question card, answer input, hint panel, explanation panel, session summary
   - Use `usePracticeSession()` hook in mock mode

3. **`/curriculum`** — Topic grid with mastery states and lock/unlock.
   - Use `useCurriculum()` hook in mock mode

### Phase 2 — Build with mock, wire live on completion

4. **`/progress`** — Needs two parallel hooks (`useProgress` + `useWeakAreas`).
   - Charts/rings for accuracy, mastery bars per topic, weak area action cards

5. **`/topic/:topicId`** — Topic detail with lesson states.
   - Uses `useTopicDetail()`. Static data makes this easy.

### Phase 3 — Wire live backend

Once Phase 1–2 screens are built and working with mock data:

6. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` in production env.
7. Add real auth: wire NextAuth session → `studentId` extraction.
8. Test each hook against live backend. The API contracts are stable — no component changes should be needed.
9. Add error boundaries around each screen for graceful degradation.

### Phase 4 — Future screens

10. **`/leaderboard`** — Build UI shell with mock. Backend endpoint not yet built.
11. **`/badges`** — Badge collection screen. Data comes from `progress.recentBadges` extended to full list.
12. **`/settings`** — Profile, grade selector, notification preferences.

---

## File Map for Frontend Engineers

```
apps/web/
  lib/
    api-client.ts       ← Axios instance with auth headers + error unwrapping
    api-hooks.ts        ← All React hooks (useDashboard, usePracticeSession, etc.)
    mock-data/
      index.ts          ← Re-exports + withMockDelay() utility
      dashboard.mock.ts ← MOCK_DASHBOARD
      curriculum.mock.ts← MOCK_CURRICULUM, MOCK_TOPIC_DETAIL
      progress.mock.ts  ← MOCK_PROGRESS, MOCK_WEAK_AREAS, MOCK_DAILY_QUESTS
      practice.mock.ts  ← MOCK_SESSION_START, MOCK_SUBMIT_*, MOCK_HINT_*, MOCK_EXPLANATION_*

packages/
  shared-types/
    index.ts            ← All frontend-facing TypeScript types (import from "@mathai/shared-types")

docs/
  frontend-api-contracts.md   ← Full API reference with sample JSON for all 10 endpoints
  screen-data-map.md          ← Screen-by-screen field mapping with loading/empty/error states
  frontend-integration-summary.md ← This file
```

---

## Enabling Mock Mode

Add to `apps/web/.env.local`:
```
NEXT_PUBLIC_USE_MOCK_DATA=true
```

All `useXxx()` hooks will return mock data with a 600ms simulated delay.
No backend, no auth, no environment config needed — just `npm run dev`.

---

## Adding Shared Types to `apps/web`

In `apps/web/tsconfig.json`, add the path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@mathai/shared-types": ["../../packages/shared-types/index.ts"]
    }
  }
}
```

Or update `turbo.json` to add `@mathai/shared-types` as a workspace dependency:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

And in `apps/web/package.json`:
```json
{
  "dependencies": {
    "@mathai/shared-types": "workspace:*"
  }
}
```
