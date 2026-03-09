# MathAI v0 Prompt Pack
## Student-Facing UI — 6 Ready-to-Use v0 Prompts

> These prompts are designed for [v0.dev](https://v0.dev) (Vercel's AI component generator).
> Paste each prompt verbatim. Tech stack: **Next.js 14 App Router · Tailwind CSS · shadcn/ui**.
> All mock data matches the `@mathai/shared-types` contracts in `packages/shared-types/index.ts`.

---

## PROMPT 0 — Global UI Style Guide

> **Use this first.** Paste into v0 as the design system baseline. Reference it in all subsequent prompts by adding: "Follow the MathAI design system described earlier."

---

```
Design a comprehensive UI style guide and component library for MathAI — a premium, gamified
math learning platform for children aged 6–12. The output should be a single-page React
component (default export) that renders a visual design token reference and reusable component
showcase. Use Next.js 14, Tailwind CSS, and shadcn/ui.

BRAND IDENTITY:
- Name: MathAI
- Feel: "Duolingo meets Khan Academy Kids" — joyful, encouraging, high-polish
- Voice: Warm, playful, never condescending. Uses light humour and celebration.
- This is NOT a generic SaaS dashboard. Every screen should feel like a game.

COLOR PALETTE — define as Tailwind config extensions:
- Primary: Indigo (#6366F1) — main CTA, progress bars, active states
- Success: Emerald (#10B981) — correct answers, completed states, mastered topics
- Warning: Amber (#F59E0B) — streaks, hints, in-progress states
- Danger: Rose (#F43F5E) — wrong answers, retry states
- Locked: Slate (#94A3B8) — locked lessons, disabled states
- XP Gold: #FBBF24 — XP numbers, level badges, coin-style rewards
- Background: #F8FAFF — off-white with a faint blue tint, never pure white
- Card surface: #FFFFFF with shadow-md and rounded-2xl or rounded-3xl

MASTERY LEVEL → COLOR MAPPING (use this consistently across all screens):
- not_started → Slate gray ring
- emerging → Amber/orange ring
- developing → Blue/indigo ring
- mastered → Emerald green ring
- extended → Purple (#8B5CF6) ring

TYPOGRAPHY:
- Headings: font-bold, text-indigo-700 or text-gray-800, 24–36px
- Body: text-gray-600, 16px, leading-relaxed
- Labels / pills: text-xs uppercase tracking-widest font-bold
- Question text: text-2xl font-bold text-gray-800, friendly (not academic)
- XP numbers: text-3xl font-black text-amber-500

SPACING & LAYOUT:
- Max content width: max-w-4xl (dashboard), max-w-2xl (practice), max-w-3xl (curriculum)
- Card padding: p-6 or p-8
- Grid gaps: gap-4 or gap-6
- Always centre content vertically on practice screens

COMPONENT PATTERNS to showcase in the style guide:
1. XP Bar — indigo fill on gray track, level badge on the right, animated fill
2. Streak Counter — fire emoji + number + "day streak" label in amber pill
3. Quest Card — title, progress bar (currentCount/targetCount), XP chip in amber
4. Mastery Ring — circular progress ring in mastery colour around topic icon
5. Answer Button (multiple choice) — large rounded-2xl, colourful options (indigo/teal/rose/amber variants)
6. Hint Button — lightbulb icon, amber border, glows amber when available
7. Badge — circular icon with gradient background, name below, shimmer on hover
8. Lesson Row — title, state icon (lock/checkmark/star), est. time, XP chip, CTA button
9. Feedback Overlay — full-card overlay, green ✓ or rose ✗, large and celebratory
10. Skeleton Loader — matches card shapes, uses animate-pulse, no spinner-only states
11. Topic Card — icon + name + mastery ring + lesson count + lock overlay if locked
12. Session Progress Bar — "3 of 10" label + indigo fill bar at bottom of screen

ANIMATION HINTS (describe behaviour for the engineer, implement as CSS or Framer Motion):
- XP Float: "+10 XP" text floats upward and fades out on correct answer (~800ms)
- Badge Reveal: Scale up from 0 → 1.1 → 1 with a shimmer sweep on earning
- Level Up: Full-screen confetti burst + level badge zoom-in
- Streak Fire: Flame icon pulses gently when streak ≥ 3
- Correct: Card border flashes emerald for 500ms
- Wrong: Card shakes horizontally for 400ms (CSS shake animation)

LOADING / EMPTY / ERROR STATES:
- Loading: Always use skeleton cards that match the real content layout (no full-page spinners)
- Empty: Show an encouraging illustration + friendly message + clear CTA button
- Error: Friendly copy + retry button. Never show raw error messages to children.

ACCESSIBILITY:
- All interactive elements: min 44×44px tap target
- Colour is never the only indicator (always pair with icon or text)
- Focus rings visible and indigo-coloured
- Alt text on all images/badges

Render the style guide as a scrollable single-page showcase with section headings for each
component group. Show each component in its default state, hover state, loading state, and
any variant states (e.g. correct vs. wrong for feedback overlay).
```

---

## PROMPT 1 — Student Dashboard (`/dashboard`)

---

```
Build the Student Dashboard screen for MathAI — a gamified math learning platform for children.

TECH STACK: Next.js 14 App Router, Tailwind CSS, shadcn/ui. Single file output. "use client" directive.
Follow the MathAI design system: indigo primary, emerald success, amber warning, rounded-3xl cards,
#F8FAFF background, never a plain SaaS dashboard. This screen should feel like a game home screen.

SCREEN PURPOSE:
The first screen a student sees after logging in. It should immediately answer three questions:
"How am I doing?", "What should I do today?", and "What did I earn?" — all in one glance.

COMPONENT HIERARCHY:
TopBar → QuestStrip → HeroLesson → TopicGrid → BadgeShelf

MOCK DATA (use exactly these values):
```json
{
  "student": { "displayName": "Aryan", "avatarUrl": "/avatars/rocket.png", "grade": "G4" },
  "xp": {
    "totalXP": 340, "level": 2, "levelTitle": "Number Explorer",
    "xpInLevel": 140, "xpToNextLevel": 450, "progressPct": 31
  },
  "streak": { "currentStreak": 5, "longestStreak": 12, "shieldActive": false },
  "quests": [
    { "title": "Answer 5 Questions Correctly", "currentCount": 3, "targetCount": 5, "xpReward": 20, "completedAt": null },
    { "title": "Daily Practice", "currentCount": 0, "targetCount": 1, "xpReward": 10, "completedAt": null },
    { "title": "Topic Hopper", "currentCount": 1, "targetCount": 2, "xpReward": 15, "completedAt": null }
  ],
  "recommendedLesson": {
    "topicId": "g4-fractions-add", "topicName": "Adding Fractions",
    "lessonTitle": "Unlike Denominators", "reason": "in_progress"
  },
  "recentBadges": [
    { "name": "3-Day Streak!", "iconUrl": "/badges/streak-3.svg", "category": "streak", "xpBonus": 10 },
    { "name": "Topic Conqueror", "iconUrl": "/badges/first-mastery.svg", "category": "mastery", "xpBonus": 25 },
    { "name": "Flying Solo", "iconUrl": "/badges/flying-solo.svg", "category": "session", "xpBonus": 15 }
  ]
}
```

SECTION-BY-SECTION DESIGN:

1. TOP BAR (sticky, white, shadow-sm):
   - Left: Circular avatar (rocket.png, fallback to first letter "A" in indigo circle)
   - Centre: "Welcome back, Aryan! 👋" (text-xl font-bold text-gray-800)
   - Right: XP bar inline — indigo fill, "Level 2 · Number Explorer" label above, "140 / 450 XP" below
   - Below XP bar: fire icon + "5 day streak 🔥" in amber pill

2. QUEST STRIP (3 quest cards, horizontal scroll on mobile, grid on desktop):
   - Section heading: "Today's Quests" (text-xl font-bold text-gray-700)
   - Each quest card: white, rounded-2xl, shadow-sm, p-4
     - Quest title (font-semibold, text-gray-800)
     - Progress bar: currentCount/targetCount, indigo fill, "3/5" label
     - XP chip: amber background, "20 XP" text (text-xs font-bold)
     - If completedAt is not null: green checkmark overlay on card, "Done! ✓"
   - Partially complete quest (3/5): show indigo progress bar at 60%

3. HERO LESSON BUTTON (large, attention-grabbing):
   - Full-width card, indigo-to-purple gradient background, rounded-3xl, p-6
   - Top-left: small pill "IN PROGRESS" (white text, semi-transparent background)
   - Heading: "Continue: Unlike Denominators" (text-2xl font-bold text-white)
   - Subtext: "Adding Fractions · Grade 4" (text-white opacity-80)
   - Right side: large → arrow icon in white circle
   - Hover: slight scale-up transform, cursor-pointer

4. TOPIC GRID ("Keep Learning" section):
   - Section heading: "Keep Learning" (text-xl font-bold text-gray-700)
   - 2×2 grid (4 topic cards):
     - "Adding Fractions" — indigo icon, emerald mastery ring (mastered)
     - "Multiplication" — orange icon, amber ring (developing)
     - "Word Problems" — teal icon, gray ring (not_started)
     - "Geometry" — purple icon, gray ring (not_started) + lock overlay
   - Each card: white, rounded-2xl, p-4, icon + topic name + "4 lessons" text + mastery ring
   - Locked topics: semi-transparent overlay, lock icon, cursor-not-allowed

5. BADGE SHELF:
   - Section heading: "Recent Badges" with "View All →" link
   - 3 badge circles in a horizontal row
   - Each: circular gradient background (category-coloured), badge icon or emoji placeholder,
     name below in text-xs, hover reveals xpBonus tooltip "+10 XP"
   - Streak badge: amber gradient; Mastery badge: emerald gradient; Session badge: indigo gradient

STATES:
- Loading: Skeleton for top bar XP, 3 skeleton quest cards, skeleton hero, skeleton grid
- Empty (no recent badges): Hide shelf, show "Earn your first badge by finishing a session!"
- Error: Friendly card "MathAI can't connect right now. Try again?" with retry button

Props interface:
```typescript
interface DashboardPageProps {
  // All data arrives via useDashboard() hook; component accepts DashboardData
}
```

The dashboard should feel alive and motivating — a student should feel proud and excited to press
"Continue." No grey boring grids. Use colour, icons, and whitespace generously.
```

---

## PROMPT 2 — Curriculum Journey Map (`/curriculum`)

---

```
Build the Curriculum screen for MathAI — a gamified math learning platform for children aged 8–12.

TECH STACK: Next.js 14 App Router, Tailwind CSS, shadcn/ui. Single file output. "use client" directive.
MathAI design system: indigo primary, rounded-3xl cards, #F8FAFF background, game-like feel.
This screen is the student's "map" of all math topics for their grade — like a world map in a game.

SCREEN PURPOSE:
Show the student every topic available for their grade (G4). Let them see their mastery level
at a glance, jump into any unlocked topic, and feel motiviated by their progress across the curriculum.
It should look like a "skill tree" or "world map" — not a boring list.

COMPONENT HIERARCHY:
PageHeader → MasteryLegend → TopicGrid (responsive) → LockedOverlay (per locked card)

MOCK DATA (use exactly these values):
```json
{
  "grade": "G4",
  "topics": [
    {
      "id": "g4-fractions-add", "name": "Adding Fractions", "description": "Add fractions with like and unlike denominators",
      "iconSlug": "fractions", "masteryLevel": "mastered", "isUnlocked": true, "lessonCount": 4
    },
    {
      "id": "g4-multiplication", "name": "Multiplication", "description": "Multi-digit multiplication strategies",
      "iconSlug": "multiplication", "masteryLevel": "developing", "isUnlocked": true, "lessonCount": 5
    },
    {
      "id": "g4-word-problems", "name": "Word Problems", "description": "Real-world maths puzzles",
      "iconSlug": "word-problems", "masteryLevel": "emerging", "isUnlocked": true, "lessonCount": 4
    },
    {
      "id": "g4-geometry", "name": "Geometry", "description": "Shapes, angles, and area",
      "iconSlug": "geometry", "masteryLevel": "not_started", "isUnlocked": true, "lessonCount": 6
    },
    {
      "id": "g4-decimals", "name": "Decimals", "description": "Decimal place value and operations",
      "iconSlug": "decimals", "masteryLevel": "not_started", "isUnlocked": false, "lessonCount": 5
    },
    {
      "id": "g4-division", "name": "Division", "description": "Long division and remainders",
      "iconSlug": "division", "masteryLevel": "not_started", "isUnlocked": false, "lessonCount": 4
    }
  ]
}
```

MASTERY LEVEL → VISUAL MAPPING:
- not_started → Gray ring (border-gray-200), gray icon, "Not Started" label
- emerging → Amber ring (border-amber-400), warm icon, "Emerging" label
- developing → Indigo ring (border-indigo-400), indigo icon, "Developing" label
- mastered → Emerald ring (border-emerald-500) + star badge, "Mastered!" label
- extended → Purple ring (border-purple-500) + crown badge, "Extended" label

DESIGN SPEC:

1. PAGE HEADER:
   - Grade pill: "Grade 4" in indigo rounded-full pill (top left)
   - Heading: "Your Math Journey" (text-3xl font-bold text-indigo-700)
   - Subtext: "Tap any topic to start learning or keep levelling up!"
   - Overall mastery summary: "2 of 6 topics mastered · 74% average accuracy"

2. MASTERY LEGEND (horizontal, compact, below header):
   - 5 small coloured dots with labels: Not Started · Emerging · Developing · Mastered · Extended
   - Helps children understand the colour coding instantly

3. TOPIC GRID:
   - Responsive: 2 columns on mobile, 3 columns on desktop
   - Each topic card: white background, rounded-3xl, shadow-md, p-6, min-h-[180px]
   - Layout within card (top to bottom):
     a. Mastery ring: circular ring (w-16 h-16) around topic icon emoji or SVG placeholder
        Ring: 4px border in mastery colour, animated spin-once on mount for unlocked topics
     b. Topic name: text-lg font-bold text-gray-800 (mt-3)
     c. Description: text-sm text-gray-500 (1 line, truncated)
     d. Bottom row: "X lessons" pill (gray) + mastery label chip (coloured)
   - Unlocked + mastered: Show small star or checkmark badge overlaid on ring (top-right of ring)
   - Hover on unlocked: scale-105 transform, indigo shadow, cursor-pointer
   - Click navigates to `/topic/:id`

4. LOCKED TOPIC OVERLAY:
   - Semi-transparent white overlay (bg-white/70) over the full card
   - Centred lock icon (gray-400) with "Complete earlier topics to unlock" text
   - Card is still visible but clearly dimmed
   - cursor-not-allowed

5. SECTION HEADER FOR LOCKED:
   - After the unlocked cards, a divider with "🔒 Coming Up Next" heading
   - Locked cards below the divider in a slightly different visual zone

STATES:
- Loading: Grid of 6 skeleton cards (same size as real cards, animate-pulse)
- Empty: Should never happen, but if topics array is empty: "Curriculum loading... check back soon!"
- Error: "Can't load your topics right now." + retry button

Make the grid feel like a visual world map of knowledge. Unlocked topics should glow slightly.
Mastered topics should feel rewarded — star badges, brighter colours. Locked topics should feel
tantalisingly close, not punishing.
```

---

## PROMPT 3 — Topic Details Page (`/topic/:topicId`)

---

```
Build the Topic Detail screen for MathAI — a gamified math learning platform for children.

TECH STACK: Next.js 14 App Router, Tailwind CSS, shadcn/ui. Single file output. "use client" directive.
MathAI design system: indigo primary, emerald success, amber warning, rounded-2xl/3xl cards,
#F8FAFF background. Game-like — this screen is the student's "mission briefing" before they play.

SCREEN PURPOSE:
The student arrives here after tapping a topic card from the Curriculum screen. They see:
- What this topic is about
- Their overall mastery level for this topic
- A list of lessons in order (with their individual states)
- Clear CTAs to start or continue each lesson

COMPONENT HIERARCHY:
TopicHero → MasteryBadge → LessonList (ordered) → StartPracticeButton (sticky bottom)

MOCK DATA (use exactly these values):
```json
{
  "id": "g4-fractions-add",
  "name": "Adding Fractions",
  "description": "Learn to add fractions with like and unlike denominators. Master this and unlock Multiplication next!",
  "masteryLevel": "developing",
  "lessons": [
    {
      "id": "lesson-fractions-like", "title": "Like Denominators",
      "state": "mastered", "estimatedMin": 8, "xpReward": 30
    },
    {
      "id": "lesson-fractions-unlike", "title": "Unlike Denominators",
      "state": "in_progress", "estimatedMin": 12, "xpReward": 40
    },
    {
      "id": "lesson-fractions-mixed", "title": "Mixed Numbers",
      "state": "locked", "estimatedMin": 10, "xpReward": 35
    },
    {
      "id": "lesson-fractions-word", "title": "Word Problems with Fractions",
      "state": "locked", "estimatedMin": 15, "xpReward": 50
    }
  ]
}
```

LESSON STATE → UI MAPPING:
```
mastered    → Green check icon (✓), green-tinted row, "Redo" ghost button, "★ Mastered" chip
in_progress → Indigo highlighted row (indigo-50 background), "Continue →" indigo button, "In Progress" amber chip
unlocked    → White row, "Start →" emerald button, no state chip
locked      → Gray row, lock icon (🔒), no button, "Complete earlier lessons first" tooltip
```

DESIGN SPEC:

1. TOPIC HERO (top of page):
   - Back arrow linking to /curriculum
   - Large topic icon placeholder (use a fraction emoji: ½) in indigo circle, 64×64
   - Topic name: text-3xl font-bold text-indigo-700
   - Description: text-gray-600 max-w-lg (wrap naturally)
   - Mastery badge: "Developing" chip in indigo with ring graphic
     Show as: coloured pill with a small circular progress ring (50% filled for "developing")

2. STATS ROW (below hero, horizontal):
   - "4 Lessons" card
   - "105 XP Total" card  (sum of all lesson xpReward values)
   - "~45 min" card (sum of estimatedMin values)
   - Each: small white rounded-xl card, icon + number + label, compact

3. LESSON LIST (main content):
   - Vertical ordered list — each lesson is a full-width card (rounded-2xl, p-4, shadow-sm)
   - Left side: Lesson number (1, 2, 3, 4) in coloured circle, then title + estimated time + state chip
   - Right side: XP chip (amber, e.g. "+40 XP") + CTA button
   - Connector line between lesson cards (like a learning path / roadmap visual)
   - Mastered lesson: entire row has a faint emerald-50 background
   - In-progress lesson: faint indigo-50 background, slightly elevated (shadow-md)
   - Locked lesson: faint gray, opacity-60, lock icon overlaid

4. STICKY BOTTOM CTA:
   - Fixed bottom bar on mobile: "Continue: Unlike Denominators →" indigo button (full width)
   - Shows the in_progress lesson as the primary action
   - If all mastered: "Practice Again" ghost button

5. PROGRESS VISUALIZATION (optional but ideal):
   - Small horizontal stepper above the lesson list showing 1 mastered, 1 in_progress, 2 locked
   - Use coloured segments: green → indigo (pulsing) → gray → gray

STATES:
- Loading: Hero skeleton + 4 lesson row skeletons
- Error (NOT_FOUND): "This topic doesn't exist yet. Explore other topics!" with back button
- All lessons mastered: Show celebration banner "You've mastered this topic! 🎉" above lesson list

The screen should feel like a quest menu in an RPG. The student is a hero, these are their missions.
Locked lessons should feel achievable, not blocked. Mastered lessons should make them feel proud.
```

---

## PROMPT 4 — Practice Session Screen (`/practice`)

---

```
Build the Practice Session screen for MathAI — a gamified math learning platform for children.

TECH STACK: Next.js 14 App Router, Tailwind CSS, shadcn/ui. Single file output. "use client" directive.
MathAI design system: indigo primary, emerald correct, rose wrong, amber hints, rounded-3xl cards.
#F8FAFF background. This is the CORE GAMEPLAY screen — it must be immersive, encouraging, and fun.

SCREEN PURPOSE:
The student answers math questions one at a time. After each answer they get immediate feedback.
They can request hints or a full explanation from the AI tutor. At the end they see their score
and celebrate their XP earnings and any new badges.

This screen has 5 sub-states managed by a state machine. Build all 5:
1. LOADING — session starting
2. ACTIVE QUESTION — student sees question and answers it
3. AFTER SUBMISSION — feedback overlay (correct or wrong)
4. TUTOR PANEL — hint or step-by-step explanation
5. SESSION COMPLETE — score, XP, badges celebration

COMPONENT HIERARCHY:
SessionHeader → QuestionCard → AnswerSection → ActionRow → FeedbackOverlay → TutorPanel → SessionComplete

MOCK DATA (use all of these, switching between them to demonstrate each sub-state):

Session start (sub-state 2):
```json
{
  "session": {
    "sessionId": "sess-abc123",
    "topicId": "g4-fractions-add",
    "mode": "topic_practice",
    "totalQuestions": 10,
    "currentIndex": 2,
    "xpEarned": 20,
    "currentQuestion": {
      "id": "q-frac-add-003",
      "prompt": "What is 1/4 + 2/4?",
      "type": "fill_in_blank",
      "xpReward": 10,
      "options": null
    }
  }
}
```

After correct answer (sub-state 3 — correct):
```json
{
  "lastResult": {
    "isCorrect": true, "correctAnswer": "3/4",
    "xpEarned": 10, "encouragement": "Excellent! You're on fire! 🔥",
    "misconceptionTag": null, "nextAction": "next_question"
  }
}
```

After wrong answer (sub-state 3 — wrong):
```json
{
  "lastResult": {
    "isCorrect": false, "correctAnswer": "3/4",
    "xpEarned": 0, "encouragement": "Not quite — give the hint a try!",
    "misconceptionTag": "fraction_misunderstanding", "nextAction": "retry"
  }
}
```

Tutor hint (sub-state 4):
```json
{
  "tutorResponse": {
    "helpMode": "Hint1",
    "encouragement": "You've got this! Let's think step by step.",
    "content": {
      "text": "When the denominators (bottom numbers) are the same, just add the top numbers (numerators). The denominator stays the same!",
      "steps": null
    },
    "visualPlan": {
      "diagramType": "fraction_bar",
      "description": "Two fraction bars side by side showing 1/4 and 2/4, then combined into 3/4",
      "labels": ["1/4", "2/4", "= 3/4"]
    }
  }
}
```

Session complete (sub-state 5):
```json
{
  "sessionComplete": {
    "correctCount": 8, "totalQuestions": 10, "accuracyPct": 80,
    "xpEarned": 80,
    "masteryUpdate": { "topicId": "g4-fractions-add", "newLevel": "developing" },
    "badgesEarned": [
      { "name": "3-Day Streak!", "iconUrl": "/badges/streak-3.svg", "xpBonus": 10 }
    ]
  }
}
```

DESIGN SPEC FOR EACH SUB-STATE:

SUB-STATE 1 — LOADING:
- Centred spinner (indigo) with text "Getting your questions ready..."
- Session header still visible above (topic + mode info)

SUB-STATE 2 — ACTIVE QUESTION:
- SESSION HEADER (top, sticky):
  - Left: Mode pill "PRACTICE MODE" (indigo, text-xs uppercase)
  - Centre: Topic name "Adding Fractions"
  - Right: "20 XP" badge in amber (running total)
- QUESTION CARD (centred, max-w-2xl, white, rounded-3xl, shadow-lg, p-8):
  - Question number: "Question 3 of 10" (text-xs text-indigo-400 uppercase tracking-widest)
  - Question text: "What is 1/4 + 2/4?" (text-2xl font-bold text-gray-800, large and clear)
  - ANSWER INPUT SECTION (type-dependent):
    - fill_in_blank: Large text input (border-2 border-indigo-200, rounded-xl, text-lg, py-3 px-4)
                    Focus state: border-indigo-500, ring-2 ring-indigo-200
    - multiple_choice: 4 large buttons in 2×2 grid, each rounded-2xl, border-2, p-4 text-lg
                      Options cycle through: indigo / teal / amber / rose background on hover
    - true_false: Two huge buttons side by side "YES ✓" (emerald) and "NO ✗" (rose)
- ACTION ROW (below card):
  - "Check Answer ✓" — indigo, full width, large, disabled until input is non-empty
  - "💡 Hint" — amber border, text-amber-600, glows when hints are available
- PROGRESS BAR (bottom of screen):
  - "3 of 10" label + indigo fill bar (30% width), rounded-full

SUB-STATE 3 — AFTER SUBMISSION (overlay on question card):
- CORRECT: Question card border glows emerald, overlay text "+10 XP" floats upward (animation),
  large ✓ checkmark in emerald circle, "Excellent! You're on fire! 🔥" in large text
  Button: "Next Question →" in emerald
- WRONG: Card shakes (horizontal CSS animation), rose border flash, large ✗ in rose circle,
  "Not quite — give the hint a try!" text, show correct answer: "The answer was 3/4"
  If misconceptionTag exists: small amber pill "Tip: Remember fraction addition rules"
  Buttons: "Try Again" (rose outline) + "💡 Get a Hint" (amber, highlighted)

SUB-STATE 4 — TUTOR PANEL (slides up from bottom, or replaces card):
- Encouragement header: "You've got this! Let's think step by step." (indigo, font-semibold)
- AI Avatar: Small robot/owl mascot icon in indigo circle (placeholder SVG is fine)
- Content text: readable 16px, text-gray-700, line-height-relaxed
- VISUAL DIAGRAM AREA (if visualPlan present):
  - Render a labelled visual for "fraction_bar": two coloured rectangles (1/4 and 2/4) + arrow → 3/4
  - Use SVG or div-based fraction bar representation (no external charting library needed)
  - Labels below each bar matching the labels array
- Steps list (if steps present): Numbered indigo circles + step text, formula rendered in
  monospace with math formatting (use a <code> block or KaTeX placeholder div)
- Close button: "← Back to Question" at top of panel
- "Try Again with Hint" button (indigo, bottom of panel)

SUB-STATE 5 — SESSION COMPLETE (full screen celebration):
- Large confetti animation (CSS keyframes, coloured squares floating down)
- Central card (white, rounded-3xl, shadow-xl, p-8, max-w-md, centred):
  - "Session Complete! 🎉" (text-3xl font-bold text-indigo-700)
  - Score: "8 out of 10" (text-5xl font-black text-gray-800)
  - Accuracy ring: Circular progress ring showing 80% (emerald stroke)
  - XP Earned: "+80 XP" in massive amber text (text-4xl font-black)
  - Mastery update: "Developing → Mastered!" banner if masteryUpdate present
  - Badges earned: each badge icon + name, scale-in animation on reveal
  - Buttons: "Play Again" (indigo, full width) + "Back to Dashboard" (ghost)

STATES:
- Loading (initial): Spinner overlay
- Error (SESSION_EXPIRED): "Your session timed out. Start a new one!" + restart button
- Empty (no questions): Shouldn't happen — show restart prompt if it does

The practice screen is the heart of the product. It must feel alive: animations on correct answers,
encouragement everywhere, never clinical or cold. A child should smile when they get a question right.
```

---

## PROMPT 5 — Rewards and Progress Screen (`/progress`)

---

```
Build the Progress and Rewards screen for MathAI — a gamified math learning platform for children.

TECH STACK: Next.js 14 App Router, Tailwind CSS, shadcn/ui. Single file output. "use client" directive.
MathAI design system: indigo primary, emerald success, amber rewards, rounded-2xl/3xl cards, #F8FAFF bg.
This screen is the student's "trophy room" — they should feel proud and motivated when they visit.

SCREEN PURPOSE:
Shows the student their overall progress, stats, badges earned, and where they have weak areas
they should focus on. Two data sources: /api/progress/:id and /api/curriculum/weak-areas/:id.
These load in parallel.

COMPONENT HIERARCHY:
PageHeader → StatsRow → LevelCard → TopicProgressList → WeakAreaCards → BadgeCollection

MOCK DATA (use exactly these values):

Progress data:
```json
{
  "student": { "displayName": "Aryan", "grade": "G4" },
  "xp": { "totalXP": 340, "level": 2, "levelTitle": "Number Explorer", "xpInLevel": 140, "xpToNextLevel": 450, "progressPct": 31 },
  "streak": { "currentStreak": 5, "longestStreak": 12 },
  "totalSessions": 18,
  "topicsStarted": 3,
  "topicsMastered": 1,
  "overallAccuracy": 74,
  "topicProgress": [
    { "topicId": "g4-fractions-add", "topicName": "Adding Fractions", "masteryLevel": "developing", "accuracyPct": 78, "sessionsCount": 8, "lastPracticed": "2026-03-08" },
    { "topicId": "g4-multiplication", "topicName": "Multiplication", "masteryLevel": "emerging", "accuracyPct": 65, "sessionsCount": 6, "lastPracticed": "2026-03-07" },
    { "topicId": "g4-word-problems", "topicName": "Word Problems", "masteryLevel": "emerging", "accuracyPct": 72, "sessionsCount": 4, "lastPracticed": "2026-03-05" }
  ]
}
```

Weak areas:
```json
[
  {
    "topicId": "g4-word-problems", "topicName": "Word Problems",
    "masteryLevel": "emerging", "accuracyPct": 55,
    "reason": "Accuracy below 60% — a focused session will help!"
  },
  {
    "topicId": "g4-fractions-add", "topicName": "Adding Fractions",
    "masteryLevel": "developing", "accuracyPct": 68,
    "reason": "You're close to mastery — just a little more practice needed."
  }
]
```

DESIGN SPEC:

1. PAGE HEADER:
   - "Aryan's Progress" (text-3xl font-bold text-indigo-700)
   - Grade pill: "Grade 4"
   - Subtext: "Keep climbing — you're doing amazing!"

2. STATS ROW (4 stat cards in a horizontal row, or 2×2 grid on mobile):
   Each stat card: white, rounded-2xl, p-4, shadow-sm, centred content
   - "340 XP" — amber number + "Total XP" label + star icon
   - "5 Days 🔥" — amber/rose number + "Current Streak" label + flame icon
   - "74%" — colour-coded (emerald if ≥70, amber if 60–69, rose if <60) + "Accuracy" label
   - "18 Sessions" — indigo number + "Sessions Played" label + play icon
   Stat numbers: text-3xl font-black; labels: text-xs text-gray-500 uppercase tracking-wide

3. LEVEL CARD (featured card, full width):
   - Indigo-to-purple gradient background, rounded-3xl, p-6
   - Left: "Level 2" in huge white text (text-5xl font-black) + "Number Explorer" subtitle
   - Right: XP bar (white semi-transparent track, white fill), "140 / 450 XP to Level 3"
   - Progress pct: 31% fill
   - Below bar: small text "Complete more sessions to reach Level 3!"

4. TOPIC PROGRESS LIST:
   Section heading: "Topic Progress" (text-xl font-bold)
   For each topic in topicProgress, render a card (white, rounded-2xl, p-4, shadow-sm):
   - Left: Topic icon/emoji + topic name (font-semibold) + "X sessions" in gray
   - Centre: Accuracy % (colour-coded, large) + "accuracy" label
   - Right: Mastery level chip (colour-matched to mastery colour mapping)
   - Full-width progress bar below: fill = accuracyPct, colour = mastery colour
   - Bottom row: "Last practiced: Mar 8" (text-xs text-gray-400) + "Practice →" ghost button
   Sort by lastPracticed descending (most recent first)

5. WEAK AREAS (if any):
   Section heading: "Focus Here 🎯" with amber colour
   Intro text: "MathAI thinks a bit of extra practice here will help you level up fast!"
   Each weak area card: amber-50 background, amber border, rounded-2xl, p-4
   - Topic name (font-bold) + accuracy % in rose (e.g. "55% accuracy")
   - Reason text in gray (italic)
   - "Practice Now →" button (amber background, white text)
   Empty state: "No weak areas! You're doing great everywhere. 🎉" — emerald tinted card

6. BADGE COLLECTION (bottom of page):
   Section heading: "Your Badges" + badge count chip (e.g. "3 earned")
   Grid of badge circles (3 per row):
   - Earned badges: full colour with icon, name below, date earned on hover
   - Use the 3 badges from dashboard mock data
   - Locked badge placeholders: gray circles with "?" — "Keep practising to unlock!"
   Show 3 real + 3 locked placeholder slots minimum
   "View All Badges →" link at bottom

STATES:
- Loading: Skeleton for stats row + level card + 3 topic rows (side-by-side skeleton layout)
- Error on progress: "Can't load your stats right now. Try again?" + retry
- Error on weak areas: Silently hide the section (don't break the page)
- Empty topicProgress: "Start your first practice session to see progress here!"

The progress screen is the student's trophy room. Every stat should feel like an achievement.
Use large numbers, bold colours, and plenty of positive framing. Accuracy below 60% should still
feel like encouragement ("You're improving!"), not failure.
```

---

## Usage Notes

### How to use these prompts

1. Go to [v0.dev](https://v0.dev)
2. Start a new project
3. Paste **Prompt 0 (Style Guide)** first — this sets the design system baseline
4. For each subsequent prompt, begin with: "Using the MathAI design system you designed above, build the following screen:"
5. Then paste the screen prompt

### After generating

Each v0 output will be a single React component. Copy it into the correct file:

| Prompt | Target file |
|---|---|
| Style Guide | `apps/web/components/ui/design-system.tsx` (reference only) |
| Dashboard | `apps/web/app/dashboard/page.tsx` |
| Curriculum | `apps/web/app/curriculum/page.tsx` |
| Topic Detail | `apps/web/app/topic/[topicId]/page.tsx` |
| Practice | `apps/web/app/practice/page.tsx` |
| Progress | `apps/web/app/progress/page.tsx` |

### Wiring to real data

Once v0 has generated the visual, wire the mock data to the real API hooks:

```typescript
// Replace hardcoded mock with:
import { useDashboard } from "@/lib/api-hooks";
const { data, loading, error } = useDashboard(session.user.id);
```

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local` to keep mock mode active during UI polish.

### Iteration tips

- If v0 output is too generic/SaaS-looking, add: "Make it look more like a children's game, not a dashboard"
- If colours are off, specify: "Use exactly this colour for X: #6366F1"
- If layout needs adjusting, follow up: "Move the badge shelf to the bottom and make the quest cards horizontal scroll on mobile"
