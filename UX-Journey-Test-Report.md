# UX Journey Test Report — MathAI

**Tested by:** UX Journey Tester (simulated student, first-time user)
**Date:** 2026-03-11
**Scope:** Full user journey — landing → sign-up → dashboard → practice → progress → profile → ask → leaderboard
**Persona:** 10-year-old student (Grade 5), first login, no prior practice history

---

## Navigation Map

All pages discovered in the application:

| Route | Page | Notes |
|---|---|---|
| `/` | Landing Page | Hero, CTA, feature overview |
| `/auth/signin` | Sign In | Email/password + OAuth |
| `/auth/signup` | Sign Up | Name, email, password, grade picker |
| `/auth/forgot-password` | Forgot Password | **Does not exist — 404** |
| `/dashboard` | Dashboard | XP bar, streak, recommended practice, quests |
| `/practice` | Practice Hub | Topic grid from AI-generated menu |
| `/practice?topicId=:id` | Practice Session | Questions, hints, explanations, session complete |
| `/progress` | Progress | Mastery ring, XP, weak areas, badges, curriculum |
| `/profile` | Profile | Name, grade, pace, explanation style, confidence |
| `/ask` | Ask MathAI | AI tutor chat interface |
| `/leaderboard` | Leaderboard | Top rankings (currently sample/mock data) |

Navigation entry points: AppNav (bottom mobile bar, left sidebar on desktop) with 6 items — Home, Practice, Ask AI, Progress, Leaders, Profile.

---

## Broken or Problematic Interactions

### 1. Dead link — "Forgot password?" (Critical)
The sign-in page has a "Forgot password?" link pointing to `/auth/forgot-password`. That route does not exist. A user who forgets their password clicks the link and hits a 404. There is no recovery path. This is a complete blocker for locked-out users.

**File:** `apps/web/app/auth/signin/SignInContent.tsx`

### 2. Locked topics still render as anchor tags
On the Progress page, locked topics use `pointer-events-none` to block clicks but the underlying element is still a `<Link href="#">`. On some browsers and assistive technologies, this still registers as a link. The `#` href can scroll the page to the top unexpectedly. It also means the element appears in the tab order for keyboard users, who then tab to a "link" that does nothing.

**File:** `apps/web/components/mathai/progress/ProgressView.tsx`

### 3. XP float animation overlaps mobile navigation bar
When XP is awarded mid-session, a floating animation fires at `bottom-24`. The mobile navigation bar is a fixed bottom bar — the XP animation renders behind or overlapping it, making the reward feel broken or clipped rather than celebratory.

**File:** `apps/web/components/mathai/practice/PracticeView.tsx`

### 4. Practice menu grade mismatch — "Counting to 100" bug (Fixed in this session)
The `practiceMenuService` was querying the Prisma `Topic` model using `{ where: { grade } }` but the model field is `gradeBand`. This caused zero rows to return for grade-level, challenge, and confidence sections. The fallback static curriculum tree (Grade 1 content) filled in instead — hence a Grade 5 student seeing "Counting to 100". **Fixed** by updating all three topic queries to use `gradeBand`.

---

## UX Friction Points

### 1. No exit confirmation mid-practice session (High Priority)
The "← Exit" button inside a practice session has no confirmation dialog. One accidental tap on mobile exits immediately and all session progress is lost silently. For a child mid-way through 10 questions, this is demoralising and confusing — they don't know what happened to their work.

### 2. New user lands on empty dashboard with no onboarding
After sign-up, the student is redirected to `/dashboard`. If no practice has been done yet, the page shows an empty XP bar, a zero streak, no quests completed, and a practice menu that may still be generating. There is no onboarding flow, welcome message, or "here's what to do first" guidance. A first-time student has no idea where to start.

### 3. "Focus Areas" hidden from new users on Progress page
The Progress page only renders the "Focus Areas" / weak areas section when `totalXp > 0`. New users see nothing in that section. But new users are exactly the people who most need guidance on where to focus. The page looks half-empty for anyone on day one.

### 4. Practice Hub empty state is indirect
When the practice menu hasn't loaded yet or is empty, the Practice Hub shows "No topics ready yet" with a link to the Profile page. The user must navigate away, update their profile, then navigate back. A better pattern is to show topics inline or give the student a direct action ("Tell us your grade to get started").

### 5. Ask AI suggestion prompts are not personalised
The Ask MathAI page shows generic example prompts like "Explain fractions" and "Help me with geometry." These are not filtered to the student's grade level or recent practice topics. A Grade 2 student asking about geometry is a mismatch; a Grade 9 student seeing "Counting" topics is worse. These prompts should pull from the student's current grade and weak areas.

### 6. Grade picker on sign-up has no context
The sign-up form has a grade picker (G1–G10) that defaults to G4. There is no tooltip or explanation telling the student or parent why this matters — the grade directly determines the curriculum, practice topics, and AI recommendations. The UI treats it as a throwaway field.

---

## Practice Flow Issues

### 1. Session complete screen shows XP but no accuracy or breakdown
When a session finishes, the student sees their XP total but not:
- How many questions they answered correctly
- Which questions they got wrong
- Their accuracy percentage for the session
- A recap of any topics that need more work

XP is a motivator but accuracy is the learning signal. Without it, the session complete screen feels like a slot machine payout rather than a learning moment.

### 2. No question count indicator during practice
Inside a practice session, the student doesn't know which question they're on or how many are left. "Question 3 of 10" is a basic progress signal that reduces anxiety, especially for children who need to know how much longer the session runs.

### 3. Hint limit not communicated
The hint system allows a maximum of 3 hints per question. When hints are exhausted, the button likely becomes disabled. But there is no upfront signal to the student about this limit — they discover it by running out, which is frustrating. Showing "2 hints remaining" from the start sets expectations correctly.

### 4. No session progress recovery on page refresh
If a student refreshes the browser or the tab crashes mid-session, all session state is lost. Practice session data appears to be in-memory only. For a browser-based learning app targeting children (who are prone to accidental refreshes), this is a significant data loss risk.

---

## Missing UI States

| State | Location | Impact |
|---|---|---|
| Practice menu loading skeleton | Practice Hub | Student sees blank space while AI generates |
| Practice menu error + retry | Practice Hub | Silent failure with no recovery option |
| Forgot password page | `/auth/forgot-password` | Complete dead end for locked-out users |
| First-time onboarding flow | Post-signup | No guidance for new students |
| Empty leaderboard (no other students) | Leaderboard | Not tested — currently shows hardcoded sample data |
| Session progress recovery | Practice Session | Refresh wipes all progress |
| Hint count display | Practice Session | Student doesn't know how many hints remain |
| Question X of Y indicator | Practice Session | No progress feedback during session |

---

## Confusing UI Elements

### 1. Mobile nav labels at 9px font size
The bottom navigation bar on mobile uses 9px text labels. The target audience is children aged 6–12. Standard accessible minimum for readable UI text is 12px. At 9px on a phone screen, labels like "Leaders" and "Progress" are practically invisible. This is especially problematic for younger students with developing literacy.

### 2. "Sample data" banner on Leaderboard undermines the feature
The leaderboard shows a prominent badge: "🔮 Sample data — live rankings coming soon." This is honest, but it means the entire Leaderboard page is non-functional for real motivation. A student excited to compete with classmates finds hardcoded fake names. This kills the gamification loop before it starts. Better to hide this page from nav or gate it behind a "coming soon" screen than to show fake data.

### 3. Locked topics look like active links on mobile
Because locked topics use `pointer-events-none` on the wrapper element but still have a `<Link>` inside, tapping them on mobile can have unexpected effects depending on the browser's tap handling. The visual lock icon communicates "locked" but the link affordance communicates "tappable." These conflict.

### 4. "← Exit" affordance during practice is too easy to hit accidentally
"← Exit" is positioned at the top-left — the natural thumb zone on mobile — with no confirmation guard. On a small screen, a child reaching for another element can easily hit Exit. The cost of this accidental tap is losing all session progress.

---

## Recommended Fixes

### Priority 1 — Critical (Ship ASAP)

**Forgot password flow:** Build the `/auth/forgot-password` page or remove the link from sign-in. The simplest acceptable fix is a page with a single email input that says "We'll send you a reset link." Without this, locked-out users have no recovery path.

**Exit confirmation modal:** Before exiting a session, show a modal: "You'll lose your progress. Are you sure?" Two buttons: "Keep going" (primary) and "Exit anyway" (secondary). This single change prevents the most emotionally damaging UX moment in the app.

**Fix XP animation z-index / position:** Move the XP float animation to render above the mobile nav bar or change `bottom-24` to account for the nav height. The reward animation should feel good, not glitched.

### Priority 2 — High Impact

**Session complete screen:** Add accuracy percentage, correct/incorrect counts, and a brief per-question summary. Even just "8/10 correct — great work!" massively improves the learning closure moment.

**Question progress indicator:** Add "Question 3 of 10" below or above the question card. One line of UI, massive reduction in student anxiety.

**Hint count display:** Show remaining hints as "💡 2 hints left" from the start of each question. Remove the surprise of running out.

**Fix locked topic links:** Replace `<Link href="#">` on locked topics with a `<div>` or `<button type="button">` that shows a tooltip: "Complete [prerequisite topic] to unlock." Remove from the tab order entirely.

### Priority 3 — UX Polish

**Post-signup onboarding:** After sign-up, show a 2-3 step welcome flow: confirm grade → pick a topic to try → start first practice. This gives every new student a clear path instead of a blank dashboard.

**Personalise Ask AI prompts:** Pull the student's grade and top 2–3 weak areas from the progress API and surface grade-appropriate example prompts. A Grade 3 student should see "Help me understand place value" not "Explain integration."

**Mobile nav label size:** Increase from 9px to at least 11–12px. Or use icon-only navigation on mobile (like many apps do) with labels only on focus/active state.

**Grade picker explanation on sign-up:** Add a single tooltip or helper text: "This helps us choose topics matched to your school level. You can change it anytime."

**"Focus Areas" for new users:** Instead of hiding the section when XP is zero, show a placeholder: "Start practicing to see your focus areas." Gives new users a reason to begin.

---

## Quick Improvements

These are low-effort, high-signal changes that can ship in a day:

- Forgot password page (even a placeholder with "coming soon" is better than 404)
- Exit confirmation dialog (2-line modal, one component)
- Question X of Y counter (one line of state + one line of JSX)
- Hint remaining counter (already have the `hintsUsed` count — just display `3 - hintsUsed`)
- Accuracy on session complete (already have `correctAnswers` and `totalQuestions` in session state — just render them)
- Remove Leaderboard from the main nav or replace with a "Coming Soon" message until real data is live
- Increase mobile nav label font size from `text-[9px]` to `text-[11px]`

---

## Overall User Experience Score

**6.5 / 10**

**What's working well:** The visual design is clean and age-appropriate. The gamification structure (XP, streaks, badges) is solid and motivating. The AI-driven practice menu concept is genuinely differentiated. The grade-personalised curriculum approach is the right direction. The tutor chat and multi-style explanations are strong features.

**What's holding it back:** The core practice loop has three significant gaps — no exit protection, no session summary, and no question progress indicator — all of which directly affect whether a student feels safe, informed, and rewarded while learning. The Forgot Password dead link is a trust-breaking bug. And the new user experience (landing on a blank dashboard post-signup with no guidance) means a meaningful percentage of first-time students will bounce without ever completing a single session.

Fix Priority 1 items and the score jumps to 8/10. Fix Priority 2 and you're at 9/10 with a genuinely polished student experience.
