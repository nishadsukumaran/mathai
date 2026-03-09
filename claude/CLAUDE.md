# MathAI — Claude Development Guide

> This file is the single source of truth for how Claude agents contribute to MathAI.
> Read this before writing a single line of code.

---

## Product Philosophy

MathAI is a gamified, AI-powered math tutoring platform for children. Every decision —
architecture, UX, copy, AI behaviour — must serve one goal:

**Help kids actually learn math. Make it joyful.**

This means:
- Clarity over cleverness
- Encouragement over correction
- Explainability over accuracy at the cost of comprehension
- Incrementally scaffolded help, never just giving answers

---

## Architecture Snapshot

```
types/index.ts          ← Global types. Single source of truth. Never redefine elsewhere.
ai/                     ← AI logic only. No DB calls. No XP. Pure AI orchestration.
curriculum/             ← Curriculum data, lesson sequencing, mastery evaluation.
services/gamification/  ← XP, streaks, badges, quests. No AI calls.
services/analytics/     ← Learning metrics, adaptive recommendations.
api/                    ← Express controllers + routes + validators + services.
                           Services here orchestrate ai/ + curriculum/ + gamification/.
apps/web/               ← Next.js frontend. v0-generated UI lives here.
database/               ← Prisma schema + seed. No business logic.
```

### The Separation Rule

| Layer              | Can call          | Cannot call       |
|--------------------|-------------------|-------------------|
| `ai/`              | `ai_client.ts`    | Prisma, API, gamification |
| `curriculum/`      | `types/`, `ai/`   | Prisma directly   |
| `services/`        | `types/`, `curriculum/`, `ai/` | Prisma directly |
| `api/services/`    | Everything above  | Frontend code     |
| `api/controllers/` | `api/services/` only | Nothing else  |

---

## Code Rules

1. **TypeScript strict mode always.** No `any` unless explicitly justified with a comment.
2. **Zod validates all API inputs.** Never trust `req.body` without parsing through a schema.
3. **One error middleware.** All errors go through `api/middlewares/error.middleware.ts`.
4. **No hardcoded strings.** XP values, thresholds, milestone counts live in their engine files.
5. **No direct DB calls in AI modules.** `ai/` receives data as arguments; it never queries.
6. **Stub before implement.** Mark all unimplemented DB calls with `// TODO:` comments.
7. **Comments explain WHY, not WHAT.** Code explains what. Comments explain reasoning.

---

## AI Tutor Behaviour Rules

1. Never reveal the full answer in a hint. That's `explanation_engine`'s job.
2. Hint level escalates from session state (`hintsUsedSoFar`). Never ask the student.
3. Encouragement must be genuine, not sycophantic. No "Excellent! You're so smart!"
4. Explain with real-world examples. Fractions → pizza, sharing, cutting rope.
5. LaTeX is supported in explanations (`mathExpression` field). Use it for complex expressions.
6. Never shame. "That's close! Try thinking about..." not "That's wrong."
7. Temperature for hints: 0.4. Temperature for explanations: 0.3. Consistency matters.

---

## Gamification Rules

1. XP never decreases.
2. Streak breaks at 2+ missed days (not 24 hours — midnight-based).
3. Badge checks are idempotent — a student earns each badge exactly once.
4. Quest progress is incremental. Update it in real-time, not just on completion.
5. Challenge mode = 2x XP. Never reduce challenge XP below base.
6. Level labels are friendly and aspirational: "Number Ninja", not "Level 8".

---

## Frontend Rules (for v0 generation)

1. Primary font: Nunito (rounded, friendly, readable for kids).
2. Colour palette: indigo primary, amber accent, green for correct, rose for incorrect.
3. All interactive elements must have `min-h-[44px]` (accessible tap targets for kids).
4. Animations are subtle and rewarding — confetti on level-up, floating XP numbers.
5. No scary red error states. Gentle colours. "Try again!" not "WRONG".
6. Progress is always visible: XP bar in header, quest progress on dashboard.
7. Every page must work on mobile (portrait). Desktop is secondary.

---

## File Naming Conventions

```
api/controllers/   → camelCase + Controller suffix (practiceController.ts)
api/services/      → camelCase + Service suffix (practiceService.ts)
ai/tutor/          → snake_case (hint_engine.ts, tutor_service.ts)
curriculum/        → snake_case with descriptive names
services/          → snake_case per engine (xp_engine.ts)
apps/web/          → Next.js conventions (PascalCase pages, camelCase hooks)
tests/             → *.test.ts always
```

---

## PR Checklist

Before any PR is merged, verify:
- [ ] All API inputs validated with Zod
- [ ] New business logic has a unit test in `tests/unit/`
- [ ] XP calculations verified against XP_TABLE in `xp_engine.ts`
- [ ] No `console.log` in production paths (use proper logging)
- [ ] Environment variables documented in `.env.example`
- [ ] Mobile layout tested at 375px viewport width
- [ ] AI prompts reviewed against the Tutor Behaviour Rules above

---

## Questions?

Ask the relevant agent:
- UI/UX → `claude/agents/frontend_agent.md`
- Tutor behaviour → `claude/agents/tutor_agent.md`
- Curriculum structure → `claude/agents/curriculum_agent.md`
- Gamification rules → `claude/agents/gamification_agent.md`
- API design → `claude/agents/backend_agent.md`
- Testing → `claude/agents/qa_agent.md`
