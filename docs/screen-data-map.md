# MathAI Screen-to-Data Map

Definitive reference for which endpoint each screen calls, exact fields consumed, and expected UI states.

---

## Screen 1 — Landing Page (`/`)

**Route:** `apps/web/app/page.tsx`
**Auth:** Unauthenticated only. Redirects to `/dashboard` if session exists.
**API calls:** None.

**Fields from session context only:**
- `session.user` — if truthy, redirect to `/dashboard`

**States:**
- Default: Show hero with CTA button
- Authenticated: Instant redirect (no loading state needed)

---

## Screen 2 — Dashboard (`/dashboard`)

**Route:** `apps/web/app/dashboard/page.tsx`
**Auth:** Required. Redirect to `/` if no session.
**Hook:** `useDashboard(studentId)` → single call, parallel data

**Endpoint:** `GET /api/dashboard/:studentId`

| UI Element | Field Path | Type | Notes |
|---|---|---|---|
| Student name | `student.displayName` | string | In greeting copy |
| Avatar | `student.avatarUrl` | string? | Fallback to default avatar |
| Grade badge | `student.grade` | Grade | Show grade pill |
| XP bar fill | `xp.progressPct` | 0–100 | CSS width % |
| Level label | `xp.levelTitle` | string | e.g. "Number Explorer" |
| XP fraction | `xp.xpInLevel` / `xp.xpToNextLevel` | numbers | "140 / 450 XP" |
| Streak counter | `streak.currentStreak` | number | With fire icon |
| Shield indicator | `streak.shieldActive` | boolean | Shield icon if true |
| Quest cards (×3) | `quests[*]` | DailyQuest[] | Progress bar: currentCount/targetCount |
| Quest XP label | `quests[*].xpReward` | number | "20 XP" chip |
| Quest done state | `quests[*].completedAt` | string? | Green check if non-null |
| "Continue" button | `recommendedLesson.topicId` + `.lessonTitle` | strings | Links to `/practice?topicId=...` |
| Badge shelf | `recentBadges[0..2]` | EarnedBadge[] | Max 3, ordered newest first |

**Loading state:** Skeleton cards for XP bar, quest cards, and topic grid.
**Empty states:**
- `recentBadges` empty → hide badge shelf or show "Earn your first badge!"
- `recommendedLesson` null → show generic "Pick a topic!" CTA

---

## Screen 3 — Curriculum / Topic Grid (`/curriculum`)

**Route:** `apps/web/app/curriculum/page.tsx` *(to be created)*
**Auth:** Required.
**Hook:** `useCurriculum(grade)` where `grade` comes from student profile

**Endpoint:** `GET /api/curriculum?grade=G4`

| UI Element | Field Path | Type | Notes |
|---|---|---|---|
| Topic card name | `topics[*].name` | string | Card title |
| Topic description | `topics[*].description` | string | Subtitle |
| Icon | `topics[*].iconSlug` | string | Map to icon component |
| Mastery ring | `topics[*].masteryLevel` | MasteryLevel | Color-coded ring |
| Lock overlay | `topics[*].isUnlocked` | boolean | Grey + lock icon if false |
| Lesson count | `topics[*].lessonCount` | number | "4 lessons" |
| CTA on click | `topics[*].id` | string | Navigate to `/topic/:id` |

**Mastery → Color mapping:**
```
not_started → gray
emerging    → orange
developing  → blue
mastered    → green
extended    → purple
```

**Loading state:** Grid of 4–6 skeleton cards.
**Empty state:** Shouldn't happen; curriculum is always populated for a grade.

---

## Screen 4 — Topic Detail (`/topic/:topicId`)

**Route:** `apps/web/app/topic/[topicId]/page.tsx` *(to be created)*
**Auth:** Required.
**Hook:** `useTopicDetail(topicId)`

**Endpoint:** `GET /api/curriculum/topic/:topicId`

| UI Element | Field Path | Type | Notes |
|---|---|---|---|
| Topic title | `name` | string | Page heading |
| Topic description | `description` | string | Subheading |
| Mastery badge | `masteryLevel` | MasteryLevel | Same color mapping as topic grid |
| Lesson list | `lessons[*]` | LessonSummary[] | Ordered list |
| Lesson title | `lessons[*].title` | string | |
| Lesson state | `lessons[*].state` | LessonState | See state rendering below |
| Est. time | `lessons[*].estimatedMin` | number | "~10 min" |
| XP reward | `lessons[*].xpReward` | number | "30 XP" chip |
| Start/Continue CTA | `lessons[*].id` + `lessons[*].state` | — | Navigates to `/practice?lessonId=...&topicId=...` |

**Lesson state → UI:**
```
locked      → Greyed out, lock icon, no CTA
unlocked    → White card, "Start" button (green)
in_progress → Highlighted card, "Continue" button (indigo)
completed   → Green checkmark, "Redo" button (ghost)
mastered    → Star icon, "Redo" button (ghost)
```

**Loading state:** Title skeleton + 3–4 lesson row skeletons.
**Error state (`NOT_FOUND`):** "This topic doesn't exist yet. Try another one!"

---

## Screen 5 — Practice Session (`/practice`)

**Route:** `apps/web/app/practice/page.tsx`
**Auth:** Required.
**Hook:** `usePracticeSession()`
**URL params:** `?topicId=g4-fractions-add&mode=topic_practice`

### Sub-state: Starting session
**Endpoint:** `POST /api/practice/start`
- Show spinner while session loads
- On success → render first question

### Sub-state: Active question

| UI Element | Field Path | Type | Notes |
|---|---|---|---|
| Mode label | `session.mode` | PracticeMode | "PRACTICE MODE" pill |
| Topic label | `session.topicId` | string | Resolved to topic name if available |
| Question text | `session.currentQuestion.prompt` | string | Large, bold |
| Answer type | `session.currentQuestion.type` | QuestionType | See input rendering below |
| MC options | `session.currentQuestion.options` | string[]? | Only for `multiple_choice` |
| XP badge | `session.currentQuestion.xpReward` | number | "+10 XP" in corner |
| Progress bar | `session.currentIndex` / `session.totalQuestions` | numbers | "3 of 10" |
| Session XP total | `session.xpEarned` | number | Running total in header |

**Input rendering by `type`:**
```
fill_in_blank  → Text input field
multiple_choice → 4 coloured option buttons
true_false     → Two large YES/NO buttons
```

### Sub-state: After submission

| UI Element | Field Path | Type | Notes |
|---|---|---|---|
| Correct overlay | `lastResult.isCorrect` | boolean | Green checkmark / red X |
| Correct answer | `lastResult.correctAnswer` | string | Show only if wrong |
| XP animation | `lastResult.xpEarned` | number | "+10" float-up animation |
| Encouragement | `lastResult.encouragement` | string | Toast/overlay text |
| Misconception tag | `lastResult.misconceptionTag` | string? | Only show if wrong |
| Hint button state | `lastResult.nextAction === "retry"` | — | Highlight hint button |

### Sub-state: Tutor panel (hint / explanation)

| UI Element | Field Path | Type | Notes |
|---|---|---|---|
| Encouragement | `tutorResponse.encouragement` | string | Friendly intro |
| Content text | `tutorResponse.content.text` | string | Main hint/explanation |
| Steps list | `tutorResponse.content.steps[*]` | TutorStep[]? | Only for explanations |
| Step formula | `steps[*].formula` | string? | Render with KaTeX |
| Visual diagram | `tutorResponse.visualPlan` | VisualPlan? | Render if present |
| Similar example | `tutorResponse.similarExample` | TutorExample? | Collapsible section |

**Visual diagram `diagramType` → React component mapping:**
```
fraction_bar     → <FractionBarDiagram data={...} />
array            → <ArrayDiagram data={...} />
number_line      → <NumberLineDiagram data={...} />
place_value_chart → <PlaceValueChart data={...} />
none             → Render nothing
```

### Sub-state: Session complete

| UI Element | Field Path | Type | Notes |
|---|---|---|---|
| Score | `sessionComplete.correctCount` / `.totalQuestions` | numbers | "8 out of 10" |
| Accuracy | `sessionComplete.accuracyPct` | number | Ring chart |
| XP earned | `sessionComplete.xpEarned` | number | Large celebration number |
| Badges earned | `sessionComplete.badgesEarned` | EarnedBadge[] | Badge reveal animation |
| Mastery update | `sessionComplete.masteryUpdate` | object? | "Level Up: Developing!" banner |
| Level up | `lastResult.levelUp` | object? | Full-screen level-up animation |

**Loading state:** Spinner overlay on question card (not full page, so context stays visible).
**Error (`SESSION_EXPIRED`):** "Your session expired. Start a new one!" with restart button.

---

## Screen 6 — Progress (`/progress`)

**Route:** `apps/web/app/progress/page.tsx` *(to be created)*
**Auth:** Required.
**Hooks:** `useProgress(studentId)` + `useWeakAreas(studentId)` — called in parallel

**Endpoints:** `GET /api/progress/:studentId` · `GET /api/curriculum/weak-areas/:studentId`

| UI Element | Field Path | Source | Notes |
|---|---|---|---|
| Total XP | `xp.totalXP` | progress | |
| Level + title | `xp.level` + `xp.levelTitle` | progress | |
| Streak | `streak.currentStreak` + `.longestStreak` | progress | |
| Topics started | `topicsStarted` | progress | |
| Topics mastered | `topicsMastered` | progress | |
| Total sessions | `totalSessions` | progress | |
| Overall accuracy | `overallAccuracy` | progress | "74% correct" |
| Topic rows | `topicProgress[*]` | progress | Sorted by lastPracticed desc |
| Mastery bar per topic | `topicProgress[*].masteryLevel` + `.accuracyPct` | progress | |
| Weak area cards | `weakAreas[*]` | weak-areas | "Practice this" CTA button |
| Weak area reason | `weakAreas[*].reason` | weak-areas | Explanatory sub-text |

**Loading state:** Side-by-side skeleton: stats panel left + topic list right.
**Empty state for weak areas:** "No weak areas yet! You're doing great everywhere." with encouraging illustration.

---

## Screen 7 — Leaderboard (`/leaderboard`)

**Route:** `apps/web/app/leaderboard/page.tsx` *(to be created)*
**Status:** Not yet implemented in API.

**Planned endpoint:** `GET /api/leaderboard?grade=G4&scope=class`
**Planned fields:** `[{ rank, studentId, displayName, avatarUrl, xp, level }]`

**Note for UI build:** Build with mock data only. Mark screen with "Coming Soon" or seed with hardcoded names + XP values until the endpoint exists.

---

## Global States (all screens)

### Loading
- Use skeleton components that match the layout of real content
- Never use spinner-only states for data-heavy screens (it causes layout shift)
- Minimum 300ms skeleton to avoid flicker on fast connections

### Error
- Network error → "Can't connect to MathAI. Check your internet."
- 401 Unauthorized → Auto-redirect to login
- 404 Not Found → Screen-specific message (see individual screens above)
- 500 Internal → "Something went wrong. We're on it!" + retry button

### Empty
Each screen has specific empty state guidance above. Global rule: never show a completely blank screen — always show encouraging copy and a clear CTA.

---

## Quick Reference: Hook → Endpoint → Screen

| Hook | Endpoint | Screen |
|---|---|---|
| `useDashboard(id)` | `GET /dashboard/:id` | `/dashboard` |
| `useCurriculum(grade)` | `GET /curriculum?grade=G4` | `/curriculum` |
| `useTopicDetail(topicId)` | `GET /curriculum/topic/:id` | `/topic/:id` |
| `useProgress(id)` | `GET /progress/:id` | `/progress` |
| `useWeakAreas(id)` | `GET /curriculum/weak-areas/:id` | `/progress` |
| `useDailyQuests(id)` | `GET /daily-quests/:id` | `/dashboard` |
| `usePracticeSession().startSession()` | `POST /practice/start` | `/practice` |
| `usePracticeSession().submitAnswer()` | `POST /practice/submit` | `/practice` |
| `usePracticeSession().getHint()` | `POST /practice/hint` | `/practice` |
| `usePracticeSession().getExplanation()` | `POST /practice/explanation` | `/practice` |
