# MathAI — Functional UX Test Report
**Tested by:** Claude (acting as Functional Education Expert)
**Date:** March 12, 2026
**Scope:** Full student-facing application — account creation, authentication, password reset, profile editing, dashboard, practice, AI tutor, progress tracking, leaderboard, navigation
**Method:** End-to-end code review of all user-facing routes and components, tracing data flow, UI state logic, API contracts, and error handling

---

## Executive Summary

MathAI is a well-structured, visually cohesive K-8 math learning platform. The core flows — signup, dashboard, ask-AI, and practice — are functional and thoughtfully designed. The gamification layer (XP, streaks, badges, leaderboard) is in place and adds motivational value. Navigation is clean and responsive across mobile and desktop.

**Two critical bugs were found** related to password validation inconsistency (signup page and profile change-password both still enforce the old 6-character rule while the backend now requires 8 characters + alphanumeric). These must be fixed before the next user-facing release.

The leaderboard currently uses mock data — this is acceptable for an early launch but should be clearly communicated to students.

---

## 1. Account Creation (Signup)

### Steps Performed
1. Navigated to `/auth/signup`
2. Observed form fields: Name, Email, Password, Confirm Password, Grade picker (G1–G8)
3. Reviewed client-side validation logic and form submission flow
4. Traced the `POST /api/auth/signup` call and auto sign-in sequence

### What Works Well
- Clean, welcoming design with the 🧮 branding
- Grade picker is a visual button grid (G1–G8), defaulting to G4 — sensible and kid-friendly
- Password mismatch is caught client-side in real time (red border + inline error message)
- Submit button is disabled while passwords don't match — prevents accidental bad submissions
- After successful signup, the user is automatically signed in and redirected to `/dashboard` — zero friction onboarding
- Error messages from the API surface cleanly in a red banner

### Bug Found — HIGH PRIORITY
**Password validation is inconsistent with the backend.**

The signup form has `minLength={6}` and the placeholder reads "At least 6 characters". There is no complexity check (no requirement for letters + numbers) on the client side at all. The backend (`/api/auth/signup` route) was updated to require **8+ characters with at least one letter and one number**, but the signup UI has not been updated to match.

**Impact:** A student can type a 6 or 7-character numeric-only password, the browser's built-in HTML5 validation passes, the form submits — and then the API rejects it with an error. The student sees a confusing error message with no clear hint on what the actual requirement is.

**Fix required:** Update `minLength` to 8, add complexity validation (letter + number check), update placeholder text, and add a visible hint below the password field.

### Minor Observation
- No "show/hide password" toggle on the signup form. On mobile this makes it easy to mistype. Recommend adding it.

---

## 2. Sign In

### Steps Performed
1. Navigated to `/auth/signin`
2. Reviewed credentials form (email + password) and Google OAuth option
3. Checked "Forgot password?" link and `?reset=success` banner
4. Verified redirect flow post-login

### What Works Well
- Credentials form is clean and straightforward
- Google OAuth login option is present — good for reducing signup friction
- "Forgot password?" link is clearly visible
- After a successful password reset, returning to sign-in shows a green success banner (`?reset=success` param) — excellent UX detail
- Callbackurl support means users landing on a protected page while unauthenticated are correctly returned to it after login

### No Issues Found

---

## 3. Password Reset Flow

### Steps Performed
1. Clicked "Forgot password?" on sign-in page
2. Traced `POST /api/auth/forgot-password` → email dispatch via SendGrid (nodemailer)
3. Followed reset link → `/auth/reset-password?token=...`
4. Reviewed `reset-password/page.tsx` client validation and `POST /api/auth/reset-password` server logic

### What Works Well
- Reset email is sent via SendGrid SMTP with a well-designed HTML email template (MathAI branding, clear CTA button, 1-hour expiry note, safe-ignore footer)
- In development mode, the reset URL is printed to console and returned in the API response — good DX
- Reset form validates password match client-side before submitting
- After a successful reset, user is redirected to sign-in with the `?reset=success` success banner
- Password complexity is properly enforced on the reset page (updated to 8+ chars, letter + number) ✓

### No Issues Found (Reset Page is Correctly Updated)

---

## 4. Admin: Password Reset for Users

### Steps Performed
1. Navigated to `/admin/users` → selected a user → `/admin/users/[id]`
2. Reviewed the password reset section in `AdminUserDetailView`
3. Tested both "Auto-generate" and "Set manually" modes
4. Traced request to `POST /api/admin/users/:id/reset-password`

### What Works Well
- Toggle between "Auto-generate" (12-char alphanumeric, guaranteed letters + digits) and "Set manually" modes
- Manual mode shows two password fields with Show/Hide toggle
- Live complexity badges (4 checks: length ≥8, has letter, has number, passwords match) give instant visual feedback
- Server-side validation re-checks complexity regardless of client input — secure
- Auto-generated passwords now properly meet the new complexity rule (2+ letters + 2+ digits guaranteed by the fixed-array + shuffle approach)

### No Issues Found

---

## 5. Profile Edit

### Steps Performed
1. Navigated to `/profile`
2. Reviewed all editable fields: Name, Grade, Learning Pace, Explanation Style, Confidence Level
3. Tested Save Changes flow
4. Reviewed Change Password section (collapsible)
5. Verified Sign Out button

### What Works Well
- Name is editable inline at the top of the page (click-to-edit style) — feels natural
- Grade picker (G1–G8) matches the signup experience — consistent
- Learning Pace (🐢 Slow / 🚶 Balanced / 🚀 Fast Track) is clearly labeled with descriptive subtitles — students will understand the difference
- Explanation Style has 5 options (Visual, Step by Step, Story, Analogy, Direct) with icons and one-line descriptions — excellent for personalisation
- Confidence Level is a 1–5 slider — good for students to self-assess
- Saving profile correctly invalidates the React Query practice menu cache, so the next visit to `/practice` fetches fresh AI-tailored topics — thoughtful cache invalidation
- Profile load failure is handled gracefully (shows an error state with a Retry button instead of rendering an empty form, which could accidentally overwrite real data — very good defensive design)
- Sign Out is clearly placed at the bottom with a confirmation-style loading state

### Bug Found — HIGH PRIORITY
**Change-password section still uses the old 6-character rule.**

`ProfilePageContent.tsx` line 89:
```
if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
```

The backend (`/api/auth/change-password`) now requires 8+ characters, at least one letter, and at least one number. The client-side check still only validates length ≥ 6, with no complexity check. The password field placeholder also still says "At least 6 characters".

**Impact:** A student sets a new password of "abc123" (7 chars, no uppercase), the browser accepts it, but the API rejects it. The error message from the API may also be confusing because it won't match the UI hint.

**Fix required:** Update to `newPw.length < 8`, add `/[a-zA-Z]/.test(newPw) && /[0-9]/.test(newPw)` check, update placeholder to "At least 8 chars, letters + numbers", and update the error message.

---

## 6. Dashboard

### Steps Performed
1. Navigated to `/dashboard` as an authenticated student
2. Reviewed all five dashboard sections one by one
3. Checked avatar → Profile Modal interaction

### Section 1: Header / User Greeting
- Displays student name and avatar (first letter of name, coloured gradient)
- Shows current XP bar and streak counter
- Clicking the avatar opens a Profile Modal — quick access to profile settings without leaving the dashboard

**Assessment:** Clean and motivating. Students are immediately shown their progress.

### Section 2: Continue Learning
- Shows the most recently active or recommended practice topic as a "Continue" card
- Links directly to `/practice?topicId=...`

**Assessment:** Good for returning engagement — students can pick up exactly where they left off.

### Section 3: Ask MathAI (AskCard)
- Inline card with a text input to start a question
- Clicking submits to `/ask` with the query pre-filled
- Also has example suggestion buttons

**Assessment:** Lowers the barrier to using the AI tutor — good placement on the home screen.

### Section 4: Recommended Practice (top 3 topics)
- Pulls the first 3 items from the AI-assigned practice menu
- Shows topic name, reason label (e.g. "revision", "new_topic"), and a Start button

**Assessment:** Solid. AI recommendations surfaced on the home screen makes the product feel personalised on first visit.

### Section 5: Daily Mission / Quests + Streak
- Shows daily quest objectives (e.g. "Complete 2 practice sessions", "Ask MathAI a question")
- Displays current streak with visual fire icon
- Acts as a daily to-do list for students

**Assessment:** This is the strongest engagement mechanic on the platform. Clear, actionable, age-appropriate.

### Overall Dashboard Assessment
The dashboard is well-structured and well-prioritised. The layout guides the student's attention logically: who you are → keep learning → ask for help → today's missions. No clutter. Works on mobile.

**One observation:** There is no visible "last visited" or "today's date" indicator. For younger students (G1–G3), knowing "today's goal" relative to a date might help — consider a lightweight date stamp next to the Daily Mission section.

---

## 7. Practice Feature

### Steps Performed
1. Navigated to `/practice` (PracticeHub)
2. Reviewed topic loading, auto-poll, empty state
3. Tested search/filter functionality
4. Tested "Add custom topic" (request-topic) feature
5. Tested "Refresh topics" (regenerate-topics) button
6. Selected a topic → observed session start → reviewed question/answer/hint/next flow

### Practice Hub

**What Works Well**
- Loading skeletons (4 animated boxes) display while topics are fetching — prevents layout shift
- Auto-poll: when topics list is empty (background generation in progress), the page silently retries every 5 seconds up to 10 times before giving up — student doesn't have to manually refresh
- Empty state has a "Generate my topics →" button AND a fallback "Ask MathAI instead" link — no dead ends
- Search filter is real-time, case-insensitive, and shows a "no match" message with a redirect to add the topic — smart fallback
- "Add custom topic" form lets students type any topic name; API tries to match it and adds it to the top of their list with a success/failure message
- "Refresh topics" button is always visible once the menu loads, allowing students to request a fresh AI assignment at any time
- After topic regeneration, a 4-second auto-dismiss success message confirms the action

**One Observation**
All topic cards have the same 📚 icon regardless of topic type or strand. Using strand-specific icons (e.g., ✖️ for multiplication, 📐 for geometry) would help visual scanning, especially for younger students.

### Practice Session (PracticeContainer + PracticeView)

**What Works Well**
- Session auto-starts immediately on topic selection (no extra "Start" button required)
- 5 questions per session — appropriate length for a child's attention span
- Hint system: students can request a hint mid-question; hints are tracked (hintsUsed count goes up with each request)
- XP animation triggers on correct answers — positive reinforcement
- On session complete, the practice menu cache is invalidated so dashboard recommendations update
- Error handling: 30-second timeout with clear "server warming up" message (acknowledges Render cold start gracefully), plus a "Try Again" button
- Auth guard: redirects to sign-in if session expires mid-practice, with callbackUrl preserving the topic

**Bug Found — LOW PRIORITY**
`timeSpentSeconds` is hardcoded to `30` in every answer submission. This means the server always receives 30 seconds regardless of how long the student actually took. This could distort any future performance analytics or adaptive difficulty logic.

**Fix:** Track actual time using `Date.now()` at question start, compute delta on submit.

---

## 8. Ask MathAI

### Steps Performed
1. Navigated to `/ask`
2. Reviewed suggestion buttons, question submission, and conversation rendering
3. Reviewed ResponseCard structure (explanation, step-by-step, worked example, follow-up, encouragement)
4. Checked error handling for timeout and connection failures
5. Checked "New chat" button

### What Works Well
- Sticky header shows the student's grade (e.g., "Grade 4 · Your personal math tutor") — makes the AI feel personalised
- Six starter suggestion cards make the empty state actionable — especially useful for younger students who may not know what to ask
- The conversation UI matches a familiar chat format (student message right-aligned in indigo, AI response left-aligned in white cards) — very intuitive
- ResponseCard is beautifully structured: visual diagram → explanation → numbered steps → worked example (amber background) → follow-up question (green) → encouragement message. This mirrors good pedagogy.
- Auto-scrolls to the bottom after each response — important for mobile UX
- Textarea auto-resizes as the student types (up to 8 rows) — comfortable for longer questions
- Enter to submit, Shift+Enter for new line — correct keyboard behaviour
- 20-second timeout with distinct messages for timeout vs. connection error — helpful diagnostics
- "New chat ↺" button clears the conversation — useful for starting fresh without page reload

### One Observation
The inline markdown renderer handles **bold** and *italic* but nothing else (no code blocks, no numbered lists from the AI). If the AI response returns markdown lists or headers, they will render as raw `**text**` or `## text`. Given that the AI is prompted to return structured JSON (explanation, steps, example) rather than raw markdown, this is unlikely to be an issue in practice — but worth monitoring as AI prompts evolve.

---

## 9. Progress Tracking

### Steps Performed
1. Navigated to `/progress`
2. Reviewed XP bar, streak counter, stats cards, mastery ring, Focus Areas section, Badges, and full topic grid

### What Works Well
- XP bar shows level number, level title (e.g., "Equation Hunter"), current XP, and XP needed to next level — comprehensive and motivating
- Mastery ring (circular progress) gives a single visual for overall mastery percentage
- Stats row: total topics mastered, XP, and streak in summary cards
- Focus Areas section highlights the student's weakest topics with direct "Practice" links — extremely useful for targeted learning. This is a standout feature.
- Badges section rewards milestones — good for long-term engagement
- Full topic grid shows every assigned topic broken down by strand (Numbers, Geometry, etc.) with lock/unlock status and individual mastery rings

### One Observation
There is no "date joined" or "total practice sessions completed" stat visible on this page. For a student or parent looking at progress over time, these would add valuable context.

---

## 10. Leaderboard

### Steps Performed
1. Navigated to `/leaderboard`
2. Reviewed podium (top 3), full rankings list, current user highlight, stats header

### What Works Well
- The user's own XP bar and streak are prominently displayed at the top — the leaderboard doubles as a personal stats page
- Podium view for top 3 with gold/silver/bronze medals is visually engaging
- Current user's row is highlighted with an indigo ring and "(You)" label — easy to find your position
- Level and streak info per entry adds context beyond just raw XP
- The "Live rankings coming soon" notice at the bottom is transparent and sets expectations correctly

### Known Limitation
All other leaderboard entries (except the current user) are hardcoded mock data (`Alice, Marcus, Priya, Leo, Zoe`). The current user is merged into this list and ranked by XP. This is fine for a launch preview but should be replaced with a real `/leaderboard` API endpoint once more students are on the platform.

**Recommendation:** When transitioning to real data, add a weekly/all-time tab toggle and a "your personal best" highlight.

---

## 11. Navigation

### Steps Performed
1. Verified mobile layout (bottom tab bar + top header)
2. Verified desktop layout (left sidebar)
3. Checked active state highlighting and admin link for admin users

### What Works Well
- Navigation is hidden on `/auth/*` routes and `/admin/*` routes — clean separation
- Mobile bottom bar: Home, Practice, Ask AI, Progress, Leaders, Profile — 6 items with icons + labels, active dot indicator
- Desktop sidebar: icons (compact, ≤xl) + labels (xl+ breakpoint) — scales well from tablet to large monitor
- Admin users get an additional "⚙️ Admin" link styled in amber to visually distinguish it
- Sign-out is easily accessible on both mobile (top-right header) and desktop (bottom of sidebar)
- No issues with active state detection — `/practice` correctly stays active when on `/practice?topicId=...`

### One Observation
On mobile, with 6 nav items + the admin link (7 items for admins), the bottom bar becomes quite tight. The 9px label text is already very small. If admin users are ever expected to use the student interface on mobile (unlikely but possible), the admin link might need to move to a different location (e.g., only visible in the sidebar profile section).

---

## 12. Admin Panel

### Steps Performed
1. Navigated to `/admin/dashboard` and `/admin/users`
2. Reviewed user list (search, role filter, active filter, pagination)
3. Reviewed user detail page (name/email/role/grade edit, disable/enable, password reset)

### What Works Well
- All admin routes are protected by both `authMiddleware` + `requireAdmin` — no bypass possible from the student interface
- Paginated user list with search, role filter, and active/inactive toggle — good admin tooling
- Disable/enable user actions with confirmation
- Password reset now has dual-mode (auto-generate / manual) with live complexity feedback — as reviewed earlier

### No Additional Issues Found

---

## Bug Summary

| # | Severity | Location | Description | Status |
|---|----------|----------|-------------|--------|
| 1 | HIGH | `apps/web/app/auth/signup/page.tsx` | `minLength={6}`, placeholder "At least 6 characters", no complexity validation — inconsistent with backend rule (8+ chars, letter + number) | **Needs Fix** |
| 2 | HIGH | `apps/web/app/profile/ProfilePageContent.tsx` line 89 | Change-password: checks `newPw.length < 6` — inconsistent with backend rule (8+ chars, letter + number) | **Needs Fix** |
| 3 | LOW | `apps/web/containers/PracticeContainer.tsx` | `timeSpentSeconds` hardcoded to `30` — affects future analytics accuracy | **Backlog** |

---

## Recommendations Summary

| Priority | Recommendation |
|----------|---------------|
| Immediate | Fix signup + profile password validation to match the 8-char + alphanumeric backend rule |
| Near-term | Add "show/hide password" toggle to signup form |
| Near-term | Replace mock leaderboard data with a real `/api/leaderboard` endpoint |
| Near-term | Track actual `timeSpentSeconds` per question in practice sessions |
| Nice to have | Use topic/strand-specific icons in the Practice Hub topic cards |
| Nice to have | Add total sessions completed and join date to the Progress page |
| Nice to have | Add a date label next to the Daily Mission section on the dashboard |

---

## Overall Assessment

MathAI is production-ready for a soft launch with the caveat that **the two password validation bugs must be patched first**. The product delivers a coherent, gamified, AI-powered learning experience. The AI tutor response structure (explanation → steps → worked example → follow-up) is pedagogically sound. The practice loop (topic selection → 5 questions → hint system → XP rewards → topic cache invalidation) is well-engineered. The adaptive personalisation (grade, pace, explanation style, confidence level feeding into AI topic assignment) is a genuine differentiator.

The biggest short-term risk is the leaderboard being mock data — students who compare notes will notice quickly. Prioritise the real leaderboard endpoint after the password fix.

---

*End of Report*
