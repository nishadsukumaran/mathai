# MathAI Features & User Guide

**Last updated:** April 2026

A complete guide to every feature in MathAI, written for product teams, teachers, and parents.

---

## For Students

### Dashboard (`/dashboard`)

The student's home screen. Shows at a glance:

- **Your Next Step** — the Learning Brain's single best recommendation for what to practice next, with a clear reason and one-tap start
- **Continue Learning** — resume the most recent in-progress topic
- **Ask MathAI** — paste any math question and get an instant AI explanation with visual diagrams
- **Recommended Practice** — top 3 AI-picked topics from the practice menu
- **Daily Mission** — today's quests with XP rewards and streak counter
- **My Pet** — virtual math pet that evolves based on learning behavior
- **Progress Summary** — level, total XP, mastered topics count

### Practice (`/practice`)

Adaptive practice sessions with real-time intelligence.

**Starting a session:**
- Browse all topics or use the AI-recommended topic
- MathAI generates questions dynamically, aligned to the Cambridge curriculum
- Questions are personalised using the student's misconceptions, confidence, and interests

**During a session:**
- Answer questions (fill-in-blank, multiple choice, true/false)
- Rate your confidence before answering (1-5 emoji scale)
- Use progressive hints (3 levels: nudge, partial, full step)
- "Teach Me" button links to Ask MathAI for deep concept explanation
- Visual explanations appear automatically when the AI detects a visual topic

**Adaptive behavior (powered by Session Adaptation Engine):**
- 2+ wrong in a row → difficulty drops, step-by-step support auto-triggers
- 3+ correct in a row → difficulty increases, celebration message
- Recovery after struggle (wrong→wrong→correct) → positive recognition
- Fast but inaccurate → "slow down" guidance
- Heavy hint usage → guided step-by-step mode
- Long session with declining accuracy → positive early ending

**Dynamic difficulty:**
- Questions shift between easy, medium, and hard mid-session
- New difficulty pools generated on-demand (no startup delay)
- Guardrails prevent wild oscillation

### Ask MathAI (`/ask`)

Freeform AI math tutor. Students can ask anything:
- "What is 1/4 + 2/3?"
- "I don't understand long division"
- "Why does multiplying negatives give a positive?"

**Response includes:**
- Clear explanation (2-4 sentences, grade-appropriate)
- Step-by-step breakdown with LaTeX formulas
- Visual diagram (number line, fraction bars, arrays, etc.) when helpful
- Worked example with key insight
- Follow-up suggestion
- Encouragement

**Visual intelligence:**
- AI classifies the best visual type for each problem
- Structured math data drives precise, deterministic diagrams
- Alignment verifier ensures visual matches explanation
- Falls back to text-only when visual doesn't add value

### Progress (`/progress`)

Track learning journey:
- Overall accuracy and mastery percentages
- Per-topic mastery bars with status labels
- Weak areas highlighted with action suggestions
- XP level and badge collection

### Profile (`/profile`)

Customise the learning experience:
- Name and grade
- Learning pace (slow/standard/fast)
- Preferred explanation style (visual/step-by-step/story/analogy/direct)
- Theme and interests (used to personalise questions)

### Gamification

- **XP** — earned for every correct answer, scaled by difficulty
- **Levels** — unlock as XP accumulates, with named titles
- **Streaks** — consecutive daily practice, with shield protection
- **Daily Quests** — 3 rotating challenges with XP rewards
- **Badges** — earned for mastery, streaks, sessions, exploration, challenges, persistence
- **Virtual Pet** — personality evolves based on learning behavior (fast thinker, problem solver, careful learner, etc.)

---

## For Parents

### Parent Portal (`/parent`)

A learning intelligence dashboard — not a report card.

**Summary at a glance:**
- **Learning Score** (0-100) — composite of mastery, consistency, effort, accuracy, improvement
- **Learning Status** — Excellent (85+), On Track (60-84), Needs Attention (<60)
- **Confidence Signal** — Rising, Stable, or Needs Support (with explanation of why)
- **Support Need Level** — Low, Moderate, or High

**Learning Insights** (up to 6, prioritised):
Each insight includes a message and an actionable tip for parents.
- Strengths: "Your child is doing really well in Addition and Multiplication." → TIP: "Celebrate this with them."
- Attention areas: "Fraction division still needs support." → TIP: "Encourage 10 minutes of practice this week."
- Misconception alerts: "A recurring mix-up with fraction inversion." → TIP: "Ask your child to explain it to you."
- Confidence trends: "Confidence has dipped recently." → TIP: "Try saying 'I noticed you're working hard.'"
- Revision reminders: "Decimals mastered but not practised recently." → TIP: "Suggest a 5-minute refresher."
- Insight basis shown: "Based on 120 questions answered, 5 recent sessions, 7-day streak."

**Learning Personality:**
- Visual Learner / Step-by-Step Thinker
- Independent Solver / Support Seeker
- Quick Thinker / Careful Thinker
- Resilient Learner / Consistent Practiser

**Clustered Mastery Map:**
Topics grouped into: Needs Attention, Improving, Strong Areas, Revision Due

**MathAI Recommends Next:**
Shows what the Learning Brain thinks the child should work on and why.

**Recent Milestones:**
Mastered topics, streaks, badges earned.

---

## For Administrators

### Admin Panel (`/admin`)

Platform management tools:

- **Dashboard** — total users, active users, signups today/this week, by role/grade
- **User Management** — search, filter, paginate; view student detail including pet personality
- **User Actions** — update name/email/role/grade, disable/enable accounts, reset passwords

---

## Visual Explanation Types

MathAI renders 6 production visual types (Phase 1):

| Visual | Used For | Renderer |
|---|---|---|
| Number Line | Addition, subtraction, negatives, decimals, rounding | SVG with animated arrows |
| Fraction Bar | Fractions, equivalence, comparison, addition | Stacked colored bars |
| Array Diagram | Multiplication, division, grouping | Grid of circles with groups |
| Bar Model | Word problems, comparison, part-whole | Singapore-style proportional bars |
| Place Value Chart | Place value, regrouping, expanded form | Column blocks (Th, H, T, O) |
| Equation Steps | Algebra, equation solving, long division | Step-by-step cards with Framer Motion |

Phase 2 (built, gated): Logic Flow, Geometry Sketch, Comparison Model

---

## Curriculum Alignment

All content is aligned to the **Cambridge Primary Mathematics Framework** (Stages 1-6) and **Cambridge Lower Secondary Mathematics Framework** (Stages 7-9).

- Topics tagged with Cambridge objective codes
- AI question generator receives the exact Cambridge learning objective
- Grade-level guard ensures questions never exceed the student's Cambridge Stage
- Mastered-topic exclusion prevents the AI from testing already-learned skills as the primary challenge
