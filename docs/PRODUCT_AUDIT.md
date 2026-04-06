# MathAI Product & Technical Capability Audit

**Date:** April 2026
**Scope:** Full codebase inspection — apps/web, api, ai, database, packages
**Method:** Evidence-driven, file-by-file, no assumptions

---

## A. Executive Summary

MathAI is a **genuinely sophisticated adaptive learning system** with a critical configuration gap that masks its real capability.

**What exists today:** A fully wired, database-backed learning engine that tracks every student interaction, detects misconception patterns, adapts question difficulty in real time, computes multi-factor mastery scores, and generates intelligent parent-facing insights. The gamification layer (XP, levels, streaks, badges, quests, pet companion) is real and integrated — not cosmetic. The visual explanation engine has both a deterministic pipeline (7 SVG renderers) and a new Duolingo-style scene animation system with template-first routing. The architecture is modular, well-typed, and production-grade.

**What's broken:** `AI_PROVIDER="mock"` is set in the environment. This single configuration means the AI tutor returns canned text instead of personalized explanations, question generation falls back to static curriculum instead of targeting student weaknesses, and the visual classifier can't refine borderline cases. The entire AI brain infrastructure exists and is wired end-to-end, but the intelligence layer is disconnected.

**What this means:** MathAI is not a homework helper with AI sprinkled on top. The adaptive learning architecture is genuinely advanced. But with mock AI, the student experience degrades to a well-designed static practice app. Flip the provider to real AI and the system becomes what it was built to be.

---

## B. Product Classification

Based on **actual implementation**, not aspiration:

| Category | Strength | Evidence |
|----------|----------|----------|
| **Adaptive practice app** | **STRONGEST** | Real-time difficulty adjustment, misconception detection, session adaptation engine with 10 action types, Learning Brain recommendation scorer |
| **AI explainer** | Strong (architecture), Weak (runtime) | Full prompt pipeline with student memory injection, but mock AI returns generic text |
| **Interactive visual learning app** | Emerging | Scene engine with 7 primitives, 5 templates, ScenePlayer, but not yet integrated into practice flow |
| **Parent-guided learning system** | Moderate | Real insights, learning scores, mastery clusters — but parent management APIs incomplete |
| **Game-based learning app** | Moderate | XP, levels, streaks, badges, quests, pet personality all database-backed and real — but pet is purely decorative |
| **AI-native math tutor** | Architecture-ready, not runtime-active | Everything is built for AI-native behavior, currently running on mock |
| **Homework helper** | **NO** | The system is fundamentally built around adaptive learning loops, not answer lookup |
| **School-ready platform** | Not yet | No teacher role, no classroom features, no assignment system |

**Current classification: Adaptive practice app with dormant AI brain.**
The infrastructure is 2 steps ahead of the user experience.

---

## C. Capability Inventory

| Capability | Status | Evidence | User-Visible? | Quality/Risk |
|------------|--------|----------|----------------|--------------|
| **Ask MathAI (text explanation)** | Built | `askMathAIService.answer()` with full student memory injection, prompt building, validation | Yes | Degrades to generic text with mock AI |
| **Worked steps** | Built | `explanation_engine.ts` generates numbered steps with LaTeX formulas | Yes | Template-based, works without AI |
| **Visual explanation (static)** | Built | 7 SVG renderers (NumberLine, FractionBar, Array, BarModel, PlaceValue, EquationSteps, LogicFlow) | Yes | Heuristic classifier works, plans build correctly |
| **Animated walkthrough (scene engine)** | Built | ScenePlayer, 5 templates, Zod schema, validator, dispatcher, telemetry | Yes (on visual branch) | Template path is instant and reliable; AI path untested with real provider |
| **Similar question generation** | Built | `similarProblemService.ts`, POST /tutor/similar-problem route | Yes (on visual branch) | Depends on AI provider being active |
| **Adaptive practice (difficulty)** | Built | `sessionAdaptationService` detects 10 patterns, `questionPoolManager` with guardrails | Yes | Fully wired, real student data, working |
| **Student profile / learning profile** | Built | `StudentProfile` model with grade, pace, interests, explanation style, XP, level | Yes | Editable via /profile page |
| **Mastery tracking** | Built | `TopicProgress` with EWMA scoring (accuracy 60% + speed 20% + consistency 20%), per-topic mastery levels | Yes | Sophisticated multi-factor model |
| **Student memory** | Built | `studentMemoryService` tracks weak topics, misconceptions, confidence trends, hint dependency, interests | Yes (drives AI prompts) | 2-hour cached snapshots, refreshed on session complete |
| **Hint system** | Built | 3-level progressive hints (nudge → clue → next step), misconception-aware, visual plans included | Yes | Template-based, concept-aware for 6 areas |
| **Retry before reveal** | Built | PracticeView gives 1 retry on wrong answer before revealing solution | Yes | Clean UX pattern |
| **Gamification: XP** | Built | `xpEngine` awards per-answer XP, `XPEvent` audit table, `StudentProfile.totalXp` | Yes | Real-time, persisted |
| **Gamification: Levels** | Built | 10 levels ("Math Seedling" → "Math Champion"), computed from XP thresholds | Yes | Denormalized on profile |
| **Gamification: Streaks** | Built | `Streak` table with current/longest/shield, updated on daily login | Yes | Working |
| **Gamification: Badges** | Built | `Badge` catalog, `StudentBadge` join table, 5 categories (accuracy, streak, speed, persistence, exploration) | Yes | Earned on real milestones |
| **Gamification: Quests** | Built | `DailyQuest` templates, `StudentQuestProgress` per student, daily/weekly periods | Yes | Working |
| **Gamification: Pet companion** | Built | `StudentPet` with personality evolution every 50 questions, 12 personality types, `petEngine.ts` with 11 events | Yes | Decorative — does NOT affect learning logic |
| **Progress dashboard** | Built | `/progress` page with topic mastery, XP, level, streak, weak areas | Yes | Real data from DB |
| **Parent dashboard** | Built | Learning score (5 components), confidence signal, mastery clusters, actionable insights | Yes | Real data, rule-based (not AI) |
| **Parent onboarding** | Built | 2-step flow: child profile + goal, username + PIN setup | Yes | UI complete, API wired |
| **Parent child management** | Partial | Can add children, view dashboard. Cannot edit child profile, reset PIN, unlink | Partially | Missing CRUD endpoints |
| **Multi-child support** | Built | Child picker for 2+ children, nav switcher dropdown | Yes | Working |
| **Curriculum mapping** | Built | Cambridge Primary/Lower Secondary, 9 strands, 150+ topics, prerequisites, mastery thresholds | Yes (drives question selection) | Hardcoded in code, not editable at runtime |
| **Theme / personalization** | Partial | Explanation style preference stored, grade-based suggestions | Partially | No dark mode, no visual theme picker |
| **Assignments** | Not found | No assignment model, no teacher flow, no due dates | No | Not implemented |
| **Login modes** | Built | Email+password, Google OAuth, child PIN login (username + bcrypt PIN) | Yes | All three working |
| **Admin controls** | Built | User list, detail, role change, disable/enable, password reset, platform stats | Yes | Complete CRUD |
| **Analytics / telemetry** | Partial | Scene telemetry (console.log only), DB tracks all learning events, no external analytics | Partially | No Posthog, no Sentry, no Vercel Analytics |
| **AI orchestration** | Built | `callAIModel` / `callAIModelJSON` with provider abstraction, retry with exponential backoff, model routing by callSite | Infrastructure only | Mock provider active — no AI actually runs |
| **Content generation** | Built | AI question generator with difficulty + misconception targeting, explanation engine, scene plan generator | Infrastructure only | Falls back to static curriculum with mock |
| **Safety / guardrails** | Built | Cloudflare Turnstile, honeypot, rate limiter (signup/login/PIN), CSP headers, HSTS, helmet | Yes | Production security headers deployed |
| **Caching** | Partial | Memory snapshots (2h TTL), topic counts (5min), React Query (5min staleTime), in-memory session store | Backend only | No Redis — in-memory sessions are scaling risk |
| **Leaderboard** | Partial | UI complete with podium, rankings. Current user data real, competitors hardcoded mock | Yes (with fake rivals) | "Live rankings coming soon" banner |
| **Misconception detection** | Built | `detectMisconception()` heuristics, `TopicMistakePattern` tracking, resolution detection | Yes (drives hints + adaptation) | Pattern-matching, not AI-driven |

---

## D. User Journey Audit

### Journey 1: Student Asking a Question

```
Student types question → POST /tutor/ask → askMathAIService.answer()
  ├─ Loads student memory snapshot (real data)
  ├─ Builds prompt with history, misconceptions, preferences
  ├─ Calls AI model (MOCK → returns canned text)
  ├─ Runs visual classifier (heuristic path works)
  ├─ Builds visual plan (works for matched types)
  └─ Returns response with explanation + visual + steps + example
```

**What works:** Visual plan generation, step display, UI layout (new tabbed design)
**Where it breaks:** AI returns "Mock AI response" text — student sees generic, non-personalized explanation
**UX strength:** New tabbed ResponseCard with Answer hero + Steps/Visual/Watch It tabs
**Helper behavior:** With mock AI, this IS a simple helper tool. With real AI, it becomes a personalized tutor that knows the student's history.

### Journey 2: Student Practicing

```
Student starts session → practiceService.startSession()
  ├─ Loads memory, profile, mastered topics
  ├─ Generates questions (AI or static fallback)
  ├─ Creates session in DB
  └─ Returns first question

Student answers → practiceService.submitAnswer()
  ├─ Checks correctness
  ├─ Detects misconception pattern
  ├─ Records to DB (QuestionAttempt)
  ├─ Awards XP, checks level-up
  ├─ Calls sessionAdaptationService → decides next action
  ├─ Adjusts difficulty (easier/harder/same)
  └─ Returns next question + adaptation result
```

**What works:** Complete loop — real adaptive difficulty, real misconception tracking, real XP, real mastery updates
**Where it breaks:** Questions may be generic (static curriculum) if AI provider is mock
**UX strength:** Retry-before-reveal, confidence pre-answer, celebrations, progressive hints
**This is NOT a helper tool.** Even with mock AI, the practice loop adapts to student behavior in real time.

### Journey 3: Student Getting Stuck

```
Student wrong answer → retry prompt shown
  ├─ Wrong again → explanation revealed
  ├─ Progressive hint system (3 levels)
  ├─ Misconception tagged and tracked
  ├─ Difficulty may decrease for next question
  └─ Memory snapshot updated with weakness
```

**What works:** Hint scaffolding, misconception detection, difficulty adjustment
**Where the loop breaks:** AI-generated hints would be more personalized; template hints are generic but functional
**UX strength:** Never just "shows the answer" — progressive disclosure

### Journey 4: Student Improving After Explanation

```
Student sees explanation → watches animation (scene engine)
  ├─ Template or AI-generated scene plan
  ├─ "Try one like this" generates similar problem
  ├─ Student answers → immediate feedback
  └─ Can loop indefinitely with fresh problems
```

**What works:** Full explain → visualize → try → feedback loop
**Where it breaks:** "Try one like this" depends on AI provider for problem generation
**UX strength:** This is the most Duolingo-like flow in the product

### Journey 5: Parent Checking Progress

```
Parent logs in → child picker (if 2+ children)
  ├─ Dashboard loads real data
  ├─ Learning score (5-component weighted score)
  ├─ Mastery clusters (weak/improving/strong/revision-due)
  ├─ AI insights (rule-based, actionable)
  ├─ Confidence trend
  └─ Recent badges, streak info
```

**What works:** Real data, intelligent insights, non-judgmental tone
**Where it breaks:** Can't edit child profile, reset PIN, or see activity history over time
**UX strength:** Parent insights are genuinely actionable ("Ask your child to explain X to you")

### Journey 6: Admin Using the System

```
Admin logs in → /admin/dashboard
  ├─ Platform stats (total users, active rate, by role)
  ├─ User list with search/filter
  ├─ User detail: view profile, change role, disable/enable
  └─ Password reset
```

**What works:** Complete user management
**What's missing:** No student learning data visible to admin, no audit logs, no bulk operations

---

## E. AI Brain Assessment

This is the critical question: **Is the AI central to the learning loop or just a helper tool?**

| AI Function | Implemented? | Wired? | Active? | Assessment |
|-------------|:-:|:-:|:-:|---|
| AI influences explanation style | Yes | Yes | **No (mock)** | Prompt includes student's preferredExplanationStyle but mock ignores it |
| AI influences next-question selection | Yes | Yes | **No (mock)** | Question generator takes misconception context but mock returns generic questions |
| AI adapts by learner behavior | **Yes** | **Yes** | **Yes** | sessionAdaptationService is **deterministic rules on real data** — works without AI |
| AI influences mastery model | No | N/A | N/A | Mastery is pure math (EWMA on accuracy/speed/consistency) — no AI involved |
| AI influences visual explanation | Partial | Yes | **No (mock)** | Heuristic classifier works (regex), AI refinement path exists but unused |
| AI influences feedback after mistakes | Partial | Yes | **Partial** | Misconception detection is heuristic (works), AI hint generation is mock |
| AI is central to learning loop | **Architecture: Yes** | **Wiring: Yes** | **Runtime: No** | The AI brain is fully plumbed but the faucet is turned off |

**Verdict:** The system has a **dual-brain architecture**:
1. **Deterministic brain** (ACTIVE): Session adaptation, Learning Brain scorer, mastery EWMA, misconception heuristics, hint templates, visual classifier — all working, all using real student data
2. **AI brain** (DORMANT): Personalized explanations, targeted question generation, visual refinement, concept image generation — all coded, all wired, all returning mock responses

**The deterministic brain alone makes this more than a helper app.** It genuinely adapts. The AI brain, when activated, would elevate it to a truly AI-native tutor.

---

## F. Scene Engine / Visual Learning Assessment

### What's Implemented

| Component | Status | Notes |
|-----------|--------|-------|
| Type system (Zod schemas) | Complete | 7 primitives, 8 animations, 4 palettes, strict validation |
| Animation presets | Complete | Framer Motion resolver with spring physics |
| Templates | Complete | 5 parameterized builders: multiplication, subtraction, fractions, division, equations |
| Validator | Complete | Zod + semantic checks + text-only fallback |
| Dispatcher | Complete | Template-first routing, AI eligibility detection |
| ScenePlayer | Complete | SVG canvas, 7 primitive renderers, playback controls, narration bar |
| Timeline hook | Complete | Play/pause, prev/next, restart, step auto-advance |
| Telemetry | Complete (console) | 6 event types, ready for analytics provider |
| Backend AI generator | Complete | Strict prompt with schema + few-shot example |
| Backend route | Complete | POST /tutor/generate-scene with Zod validation |

### Integration Points

- Ask MathAI: Wired via WatchItView in tabbed ResponseCard
- Practice flow: **NOT yet integrated** — scene engine exists alongside practice but isn't triggered from practice sessions
- Dashboard: Not integrated

### Template Coverage

| Math Type | Template | Instant? | Reliable? |
|-----------|----------|----------|-----------|
| Multiplication | `multiplicationArray(a, b)` — dot grid | Yes | Yes |
| Subtraction | `subtractionNumberLine(a, b)` — hop arrows | Yes | Yes |
| Addition | Reuses number line template | Yes | Yes |
| Division | `divisionGroups(total, divisor)` — grouped dots | Yes | Yes |
| Fraction addition | `fractionBars(n1, d1, n2, d2)` — stacked bars | Yes | Yes |
| Equations | `equationSolving(var, const, total, op)` — whiteboard | Yes | Yes |
| Place value | AI-eligible, no template | No | Depends on AI |
| Word problems | AI-eligible, no template | No | Depends on AI |
| Fraction comparison | AI-eligible, no template | No | Depends on AI |

### Is This a Differentiator?

**Yes, with caveats.**
- The template-first approach is genuinely clever — zero latency, zero AI cost, deterministic quality for the 6 most common question types
- The Zod-validated AI fallback is production-safe
- The 3-act structure (setup → build → payoff) with staggered cascade animations creates real Duolingo energy
- **But:** Only integrated in Ask MathAI, not in practice sessions where students spend most time
- **But:** AI-generated scenes are untested with real AI provider

### Current Limitations

1. Not in practice flow (biggest gap)
2. No geometry, no coordinate grids, no graphs
3. 800x500 viewBox means limited complexity per scene
4. No audio narration (text only)
5. No interactive elements (watch only, can't manipulate)

---

## G. Learning Loop Assessment

The ideal loop: **explain → visualize → try → feedback → retry → mastery update → next recommendation**

| Stage | Status | Implementation | Gap |
|-------|--------|----------------|-----|
| **Explain** | Built | Text explanation + worked steps via Ask MathAI | Mock AI → generic explanations |
| **Visualize** | Built | Static diagrams (7 types) + animated scenes (5 templates) | Only in Ask flow, not practice |
| **Try** | Built | "Try one like this" generates similar problem in Ask MathAI; practice sessions are standalone | The two aren't connected — Ask and Practice are separate flows |
| **Feedback** | Built | Correct/incorrect + step reveal + misconception tag | Progressive hints work, retry-before-reveal works |
| **Retry** | Built | 1 retry in practice; "Try another" loop in Ask MathAI | Retry in practice is limited to same question, not fresh variant |
| **Mastery update** | Built | EWMA scoring, per-topic TopicProgress, threshold-based mastery levels | Works after every session |
| **Next recommendation** | Built | Learning Brain scores all topics, recommends next action with difficulty/mode/reason | Dashboard shows recommendation, but auto-routing to recommended topic is not implemented |

**The loop exists but has seams.** Ask MathAI and Practice are two separate experiences. A student who learns via Ask doesn't seamlessly flow into targeted practice, and a student who struggles in Practice doesn't automatically get routed to Ask for explanation. The Learning Brain recommends the next topic, but the student must manually act on it.

---

## H. Adaptivity / Personalization Assessment

| Dimension | Implemented? | Evidence | Real Data? |
|-----------|:-:|---|:-:|
| Adapts by grade | Yes | Question generation, curriculum selection, suggestion pools all grade-filtered | Yes |
| Adapts by topic | Yes | Learning Brain scores each topic independently, recommends weakest | Yes |
| Adapts by student history | Yes | Memory snapshot loaded into every AI prompt and recommendation | Yes |
| Adapts by performance trends | Yes | Confidence trend (rising/stable/falling), mastery EWMA, improvement detection | Yes |
| Adapts by hint usage | Yes | Hint dependency tracked per topic, factored into Learning Brain scoring (+20 points) | Yes |
| Adapts by speed | Partial | Speed tracked in mastery calculation (20% weight), "careless pattern" detected in sessions | Yes |
| Adapts by retries | Yes | Retry success rate tracked, recovery pattern detected ("wrong→wrong→correct") | Yes |
| Adapts by weak concept clustering | Yes | `studentMemoryService` tracks active misconception patterns with frequency counts | Yes |
| Adapts by learning preference | Architecture-ready | Explanation style stored on profile, injected into AI prompt — but mock AI ignores it | No (mock) |

**Verdict:** MathAI adapts across 8 of 9 dimensions with **real student data**. The ninth (learning preference) is wired but dormant because of mock AI. This is not superficial personalization — the adaptation engine makes real decisions that change what the student sees next.

---

## I. Gamification Assessment

| Component | Real? | Integrated? | Strategic? |
|-----------|-------|-------------|-----------|
| **XP system** | Yes — DB-backed, audit trail | Yes — awarded on every answer, level thresholds | Yes — drives level progression |
| **Levels** | Yes — 10 levels with named titles | Yes — shown on dashboard, leaderboard | Yes — unlock conditions for pets |
| **Streaks** | Yes — daily tracking, shield mechanic | Yes — dashboard, leaderboard | Yes — retention mechanic |
| **Badges** | Yes — 5 categories, earned on milestones | Yes — shown on dashboard, profile | Moderate — not deeply integrated into learning goals |
| **Quests** | Yes — daily/weekly, event-tracked | Yes — gamification dashboard | Moderate — generic event counting, not learning-specific |
| **Pet system** | Yes — personality evolves every 50 questions | Yes — dashboard floating companion, showcase page | **Decorative only** — zero impact on learning outcomes |
| **Leaderboard** | Partial — user data real, competitors fake | Yes (with mock data) | Low — hardcoded rivals, "coming soon" banner |
| **Celebrations** | Yes — CorrectBurst, XPFloat, SessionComplete | Yes — practice view | Yes — immediate positive reinforcement |

**Verdict:** Gamification is **real and integrated, not cosmetic**. XP, streaks, and levels create genuine engagement loops. The pet system is well-built but purely decorative — this is actually a good design choice (pets shouldn't affect learning equity). Badges and quests are functional but could be more tightly coupled to learning milestones. The leaderboard is the weakest link.

---

## J. Parent / School Readiness Assessment

### Parent Readiness

| Requirement | Status | Gap |
|-------------|--------|-----|
| View child progress | Ready | Real data, intelligent insights |
| Add/manage children | Partial | Can add, can't edit/unlink/reset PIN |
| Understand learning gaps | Ready | Mastery clusters, misconception insights |
| Actionable recommendations | Ready | "Ask your child to explain X" style hints |
| Multiple children | Ready | Child picker, nav switcher |
| Trust the product | Moderate | Good UI, but mock AI means explanations aren't impressive |

**Parent positioning: Viable for early adopters** who care about progress visibility. Missing child management APIs would frustrate multi-child families.

### School Readiness

| Requirement | Status | Gap |
|-------------|--------|-----|
| Teacher role | Not implemented | Schema reserves "teacher" role, no UI/API |
| Classroom management | Not implemented | No class model, no student grouping |
| Assignment system | Not implemented | No assignment model |
| Curriculum alignment | Ready | Cambridge syllabus mapped, objectives coded |
| Progress reporting | Partial | Per-student mastery tracking exists, no class-level aggregation |
| Bulk student creation | Not implemented | One-by-one parent onboarding only |

**School positioning: Not ready.** The curriculum mapping is strong, but everything else for school adoption is missing.

---

## K. Technical Maturity Assessment

| Dimension | Rating | Evidence |
|-----------|--------|----------|
| **Architecture quality** | 9/10 | Clean separation: ai/, api/, apps/web, packages/shared-types. Provider abstraction, service layer, container/view pattern |
| **Modularity** | 9/10 | Scene engine, visual engine, adaptation engine, learning brain, pet engine — all independent, composable |
| **Type safety** | 8/10 | Zod validation at API boundaries, shared-types package, Prisma-generated types. Raw SQL in studentMemoryService is the exception |
| **Reliability** | 7/10 | Fire-and-forget DB writes in practiceService risk data loss. In-memory session store doesn't survive restarts (mitigated by DB recovery) |
| **Validation / fallbacks** | 9/10 | Scene engine: Zod → semantic check → text fallback. Visual engine: heuristic → AI → worked-steps-only. Practice: AI questions → static curriculum |
| **Route cleanliness** | 9/10 | 13 route groups, all real handlers, Zod validation on all POST bodies |
| **Dead code** | Low | ConceptImage model unused, renderMd function was removed, leaderboard mock data is the main offender |
| **Maintainability** | 8/10 | Well-commented, consistent patterns, clear module boundaries. StudentMemoryService raw SQL is technical debt |
| **Scaling risks** | Medium | In-memory session store is single-process. No Redis. No horizontal scaling plan. Memory snapshots have 2h TTL. |
| **Security** | 7/10 | Turnstile, CSP, HSTS, bcrypt — good. But no rate limit on login attempts, 4-digit PIN brute-forceable, no Sentry/error monitoring |

---

## L. Differentiation Analysis

### What Is Genuinely Different

1. **Dual-brain architecture:** Deterministic rules engine (always works) + AI brain (when available). Most ed-tech products are either fully static or fully AI-dependent. MathAI degrades gracefully.

2. **Misconception-aware adaptation:** Not just "student got it wrong, show easier question." The system detects *what kind of mistake* (e.g., "confuses numerator with denominator") and tracks patterns over time. This is ahead of most competitors.

3. **Scene engine with template-first routing:** Duolingo-style animations for math that are instant (no AI latency) for common operations, with AI fallback for novel cases. Most ed-tech visual explanations are either fully static or fully AI-generated (slow/unreliable).

4. **Parent intelligence, not parent surveillance:** The insights are framed as "here's how to help" not "here's what your child got wrong." Confidence trends, support need levels, and actionable hints ("ask them to explain X to you") are sophisticated.

5. **Student memory that persists across sessions:** Every misconception, confidence shift, and hint dependency is tracked and feeds into the next session. This is not session-isolated — it's a longitudinal learning model.

### What Is Only Claimed, Not Yet Proven

1. **"AI-powered tutoring"** — With mock AI, the tutoring is template-based. The personalization infrastructure exists but isn't active.

2. **"Personalized to each student"** — Adaptation is real, but explanation personalization requires real AI. The system adapts *difficulty* to each student, not yet *teaching style*.

3. **"Visual learning"** — Scene engine is built but only in Ask MathAI, not in the main practice loop where students spend most time.

### Does the Implementation Support a Different Category?

**Yes.** What's emerging is not a homework helper or a static curriculum app. It's an **adaptive learning system with a visual explanation engine** — a category closer to Khan Academy's mastery-based model but with real-time behavioral adaptation and animated visual explanations. The architecture is ahead of the surface experience.

---

## M. Blunt Verdict

### What MathAI Really Is Today

A **well-architected adaptive practice app** with sophisticated learning mechanics (mastery tracking, misconception detection, difficulty adaptation, gamification) that works end-to-end with real student data. The visual explanation engine adds genuine differentiation. The parent portal shows intelligent insights.

However, the AI tutoring — the feature most likely to be the headline differentiator — is currently returning mock responses. A student using MathAI today gets adaptive difficulty and real mastery tracking, but generic explanations and static question generation.

### What It Is Close to Becoming

An **AI-native adaptive math tutor** where every explanation is personalized to the student's learning history, every question targets their specific weaknesses, and animated visual explanations make abstract concepts concrete. The gap between "today" and "that" is literally one environment variable for AI provider + testing + prompt tuning.

### What Is Overstated If Marketed Today

- "AI-powered explanations" — currently mock
- "Personalized to your child's learning style" — adapts difficulty, not teaching style
- "Visual learning" — only in Ask MathAI, not practice
- "Leaderboard" — fake competitors
- "Complete parent control" — can view but limited management

### What Strengths Are Real Enough to Build a Category Around

1. **Adaptive difficulty that actually works** — real-time, behavior-driven, with guardrails
2. **Misconception tracking** — not just right/wrong, but *what kind of wrong*
3. **Scene engine animations** — instant, Duolingo-quality, for common math operations
4. **Parent intelligence** — actionable, non-judgmental, data-backed
5. **Progressive hint scaffolding** — never just dumps the answer

---

## N. Recommended Roadmap (Based on Audit)

### Tier 1: Activate What's Already Built (1-2 days)

These are not new features — they're configuration and wiring.

| Action | Impact | Effort |
|--------|--------|--------|
| Set `AI_PROVIDER=vercel_gateway` in production | Activates personalized explanations, targeted questions, visual refinement | Config change + testing |
| Test AI responses with 20 sample questions across grade levels | Validates prompt quality | 2 hours |
| Tune system prompts if AI responses aren't child-friendly enough | Quality control | 4 hours |

### Tier 2: Close the Learning Loop (1-2 weeks)

These connect existing systems that are currently isolated.

| Action | Impact | Effort |
|--------|--------|--------|
| Wire scene engine into practice flow (show animation after wrong answer explanation) | Visual learning during practice, not just Ask | Medium — dispatcher already exists |
| Auto-route from Learning Brain recommendation to practice session (not just dashboard card) | Closes recommend → practice gap | Small — route + param passing |
| Connect Ask MathAI "Try one like this" completion back to mastery tracking | Practice in Ask updates TopicProgress | Small — call practiceService.recordAttempt |
| Fix leaderboard with real multi-student rankings | Removes fake data | Medium — needs DB query + privacy considerations |

### Tier 3: Strengthen Core Differentiators (2-4 weeks)

| Action | Impact | Effort |
|--------|--------|--------|
| Add 5 more scene templates (place value, comparison, word problem bars, geometry basics, percentage) | Covers 80%+ of K-8 math visually | Medium |
| Integrate scene animations into practice hint flow (not just Ask MathAI) | Visual learning where students spend most time | Medium |
| Real-time difficulty viz for students ("I'm making this easier/harder for you because...") | Transparency builds trust | Small UI addition |
| Parent notification on severe misconception detection | Parent engagement driver | Medium |
| Complete parent child management APIs (edit, unlink, PIN reset) | Unblocks parent adoption | Medium |

### Tier 4: Platform Evolution (1-3 months)

| Action | Impact | Effort |
|--------|--------|--------|
| Teacher role + classroom management | Opens school channel | Large |
| Assignment system (teacher creates, student completes, parent sees) | Core school feature | Large |
| External analytics (Posthog or similar) | Product insights for iteration | Medium |
| Redis for session store + caching | Horizontal scaling readiness | Medium |
| Interactive scene elements (student can drag dots, manipulate number lines) | Transforms watch-only to hands-on | Large |

### Priority Matrix

| Category | Items |
|----------|-------|
| **Built and strong** | Adaptive difficulty, mastery tracking, misconception detection, gamification (XP/streaks/badges), parent insights, auth system, admin console, scene engine templates, progressive hints |
| **Built but weak** | AI explanations (mock), leaderboard (fake), parent management (incomplete), telemetry (console-only) |
| **Partial and promising** | Scene engine integration (only in Ask), learning loop connectivity (seams between Ask and Practice), AI question generation (wired but mock) |
| **Missing but critical** | Real AI provider activation, scene engine in practice flow, learning loop closure, external error monitoring |
| **Pure roadmap** | Teacher role, classroom features, assignments, interactive visuals, audio narration, mobile app |
