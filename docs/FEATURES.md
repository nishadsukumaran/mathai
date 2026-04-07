# MathAI Features & User Guide

**Last updated:** April 2026 (v2.2)

A complete guide to every feature in MathAI, written for product teams, teachers, and parents.

---

## For Students

### Dashboard (`/dashboard`)

The student's home screen with a clean, card-based layout:

- **Floating Pet Companion** — your learning pet lives in the header, reacts to your progress with animations and speech bubbles, and expands for personality details
- **Stat Strip** — Level, Streak, and Total XP at a glance
- **Continue Learning** — prominent one-tap button to resume your in-progress topic
- **Your Next Step** — the Learning Brain's recommendation with reason and CTA
- **Ask MathAI** — quick-access card to ask any math question
- **Recommended Practice** — top 3 AI-picked topics with mastery badges
- **Daily Quests** — today's challenges with progress bars
- **Progress Summary** — clickable card linking to full progress view

### Practice (`/practice`)

Adaptive practice sessions with real-time intelligence and celebration animations.

**Starting a session:**
- Browse all topics or use the AI-recommended topic
- Questions generated dynamically, aligned to Cambridge curriculum
- Personalised using misconceptions, confidence, and interests

**During a session:**
- Clean centered question card with difficulty badge
- Confidence check-in (1-5 emoji scale) before answering
- Multiple choice with distinct correct/incorrect/selected states
- Progressive hints (3 levels) with visual explanations
- LaTeX math rendering via KaTeX in questions and hints
- "Teach Me" deep-links to Ask MathAI

**Retry before reveal:**
- First wrong answer shows "Not quite — give it another try!" (supportive amber banner)
- Answer clears, student gets one more attempt
- After second attempt, correct answer and full feedback revealed
- Never frustrating — max 2 attempts, always encouraging tone

**Adaptive behavior (Session Adaptation Engine):**
- 2+ wrong in a row → difficulty drops, step-by-step support auto-triggers
- 3+ correct in a row → difficulty increases, celebration animation
- Recovery (wrong→wrong→correct) → positive recognition with proud pet reaction
- Fast but inaccurate → "slow down" guidance
- Long session with declining accuracy → positive early ending

**Dynamic difficulty:**
- Questions shift between easy/medium/hard mid-session
- New difficulty pools generated on-demand
- Guardrails prevent oscillation (max 2 shifts in 3 questions)

**Visual recovery (struggle detection):**
- 2+ wrong on same question → struggle detected → reliability gate checked
- If visual is reliable → "Watch It" intervention card appears inline
- ScenePlayer renders animated explanation inside practice view
- "Got it — let me try" → similar problem generated → student answers → mastery recorded
- Seamlessly returns to normal practice flow

**Celebrations (Framer Motion):**
- Correct answer → green checkmark scale-up + XP float animation
- Session complete → card entrance animation
- Streak milestones → flame pulse on pet companion
- All animations < 800ms, non-blocking

### Scene Engine (Visual Animations)

Duolingo-style animated math explanations using Framer Motion + SVG.

- **11 deterministic templates** — multiplication arrays, number lines, fraction bars, division groups, equation solving, place value blocks, comparison bars, fraction comparison, fraction equivalence, word problem grouping
- **7 SVG primitives** — dot, bar, numberLine, mathText, arrow, brace, group
- **8 animation presets** — fadeIn, popIn, slideLeft/Right, countUp, highlight, pulse, drawLine
- **ScenePlayer component** — play/pause/next/prev controls, narration bar, progress dots
- **Reliability gate** — pre-render confidence scoring (high/medium/low), only shows visual CTA when reliable
- **3-tier fallback** — template (instant) → AI generation (12s timeout) → steps-only

### Ask MathAI (`/ask`)

Freeform AI math tutor with tabbed response UI and practice loop:

- Grade-based suggestion cards (Cambridge-aligned per grade)
- **Tabbed response layout**: AnswerHero (large animated answer) + Steps / Visual / Watch It tabs
- LaTeX formulas rendered via KaTeX (inline and display math)
- **Watch It tab** — scene animation with reliability gate, 3-tier fallback
- **"Try one like this"** — generates similar problem → student answers → recorded to mastery model
- Next-action engine recommends what to do after answering

### Progress (`/progress`)

Visual card-based progress tracking:

- 4-column stat cards: Mastery%, Mastered count, Streak, XP
- Color-coded mastery legend (not started, emerging, developing, mastered)
- 3-column topic grid with mastery dot indicators
- Focus areas with inline practice buttons
- Badge collection grid
- Friendly empty state for new students ("Your journey begins with one question")

### Profile (`/profile`)

Customise the learning experience:

- Name, grade, learning pace, explanation style
- Theme and interests for question personalisation
- **Parent Portal link** — "Parent View" card for accessing parent dashboard
- Password change
- Sign out

### Gamification

- **XP** — earned per correct answer, scaled by difficulty
- **Levels** — unlock with XP, named titles
- **Streaks** — consecutive daily practice with shield protection
- **Daily Quests** — 3 rotating challenges with XP rewards
- **Badges** — 6 categories (mastery, streak, session, exploration, challenge, persistence)
- **Virtual Pet** — personality evolves based on learning behavior, powered by centralized Pet Engine

### Pet Companion System

The pet is a living learning companion, not just a card:

- **Floating pill** in the dashboard header — always visible without scrolling
- **Expandable detail panel** — tap to see personality, stats, and manage link
- **Reactive moods** — idle (gentle bob), happy (bounce), cheering (pulse), thinking (wiggle), proud (glow), excited (big bounce)
- **Speech bubbles** — mood-specific supportive messages that auto-dismiss
- **Personality-aware messaging** — playful, calm, or motivator tone based on pet personality
- **Pet Engine** — centralized system with 11 typed events, 132 message variations, anti-repeat logic
- **Idle life** — occasional speech every ~30s when nothing is happening

---

## For Parents

### Parent Onboarding (`/parent/onboarding`)

Quick setup for parents — takes under 60 seconds:

**Step 1 — Create child profile (required):**
- Child's name
- Grade (G1-G8)
- Curriculum (Cambridge, IB, CBSE, ICSE, British, American, Other)
- School name (optional)
- **Access mode selection:**
  - Parent account only — parent launches learning for child
  - Parent + child PIN — child can also log in independently
  - Child PIN only — child logs in with username and PIN

**Step 2 — Learning goal (optional, skippable):**
- Why are you using MathAI? (improve grades, build confidence, practice regularly, prepare for exams, just exploring)

**After setup:**
- Child account created with proper parent-child link
- If PIN login enabled: unique kid-friendly username generated (e.g. "aryan-472")
- PIN stored securely (bcrypt hashed, never plain text)
- Redirect to parent dashboard

### Parent-Child Account Model

Production-grade account linking system:

- **Proper relational model** — `parent_child_links` table with foreign keys
- **Relationship types** — guardian, mother, father, other
- **Link status** — active, pending, revoked
- **Primary guardian** flag for multi-parent households
- **Future-ready** for: multiple children per parent, multiple guardians per child, school-issued linking codes

### Child PIN Login

Children can log in independently (if parent enables it):

- Username + 4-digit PIN
- Username auto-generated (kid-friendly: name + 3-digit suffix)
- PIN is bcrypt hashed — never stored in plain text
- Parent can reset child PIN at any time
- Login mode must be "pin_only" or "hybrid" to allow PIN access

### Parent Dashboard (`/parent/dashboard`)

Intelligent, action-oriented dashboard — feels supportive, not like a report card.

**Routing:**
- Parents auto-redirect from `/dashboard` to `/parent` (middleware-enforced)
- Sign-in defaults to `/parent` for parent tab
- 1 child → direct to dashboard; 2+ children → child picker

**Dashboard sections:**
1. **Hero** — Learning Score ring (0-100, color-coded), child name + grade, status badges (learning status, confidence, support need, streak), "Start Practice" CTA
2. **This Week** — 5-card grid: questions answered, sessions completed, topics practised, active days, average accuracy
3. **Biggest Win** — single most impressive achievement this week (mastery, streak, confidence, improvement), green gradient callout
4. **Needs Attention** — top 2 struggling topics with direct "Practice" action buttons
5. **Concept Mastery Map** — topics clustered by status: Strong, Improving, Needs Support, Revision Due
6. **How Your Child Learns** — 2-4 personality traits derived from behavioral data (visual learner, independent solver, careful thinker, consistent practiser, etc.)
7. **Recommended Next Steps** — up to 3 prioritized action cards with "Start Practice" / "Quick Revision" buttons
8. **Learning Insights** — up to 6 AI-generated insights with parent-friendly TIP action hints
9. **Recent Milestones** — badges earned, topics mastered, streak records
10. **Score Breakdown + Quick Actions** — horizontal bar visualization of mastery/accuracy/consistency/effort/improvement + Ask MathAI + Start Practice + Switch Child

**Intelligence metrics (all from real data):**
- Confidence trend (rising / stable / needs support) with contextual explanation
- Support need level (low / moderate / high) computed from weak topics + misconceptions + confidence + hint rate
- Learning personality (derived from hint usage, pace, style, recovery pattern, streak)
- Biggest win (prioritized: mastery > streak > confidence > improving > badge)
- Next steps (prioritized: weak topics > revision due > improving topics)

### Ask MathAI for Parents (`/parent/ask`)

AI tutor adjusted for parent context:

- Parent-specific suggestion cards ("How do I explain fractions to my child?")
- Reuses existing AI system with parent context prefix
- LaTeX rendering for math formulas
- Chat interface with conversation history

---

## For Administrators

### Admin Panel (`/admin`)

- **Dashboard** — total users, active users, signups today/this week, by role/grade
- **User Management** — search, filter, paginate; view student detail including pet personality
- **User Actions** — update name/email/role/grade, disable/enable accounts, reset passwords
- **PIN Management** — view login mode + username + PIN status; reset PIN (auto-generate or manual 4-6 digits); clear PIN (reverts to parent_managed)
- **Daily Quests** — auto-seed if templates missing; all students always see quests

---

## Visual Explanation Types

| Visual | Used For | Renderer |
|---|---|---|
| Number Line | Addition, subtraction, negatives, decimals, rounding | SVG with animated arrows |
| Fraction Bar | Fractions, equivalence, comparison, addition | Stacked colored bars |
| Array Diagram | Multiplication, division, grouping | Grid of circles with groups |
| Bar Model | Word problems, comparison, part-whole | Singapore-style proportional bars |
| Place Value Chart | Place value, regrouping, expanded form | Column blocks (Th, H, T, O) |
| Equation Steps | Algebra, equation solving, long division | Step-by-step cards with Framer Motion |

| Scene Animation | Multiplication, division, fractions, equations, place value, comparison, word problems | Framer Motion + SVG with 7 primitives |

Phase 2 (built, gated): Logic Flow, Geometry Sketch, Comparison Model

---

## Curriculum Support

| Curriculum | Status |
|---|---|
| Cambridge Primary/Lower Secondary | Primary — all questions aligned to framework |
| IB | Supported via curriculum selector |
| CBSE | Supported via curriculum selector |
| ICSE | Supported via curriculum selector |
| British (General) | Supported via curriculum selector |
| American | Supported via curriculum selector |

---

## Math Rendering

All math content is rendered with **KaTeX** for fast, beautiful typesetting:

- Inline math: `\(...\)` renders inline with text
- Display math: `\[...\]` or `$$...$$` renders as centered blocks
- Applied in: Ask MathAI responses, practice question prompts, hints, worked examples, step formulas
- Graceful fallback: parse errors show raw expression in code block
