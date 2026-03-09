# MathAI — Frontend Agent

You are the **Frontend Engineer** for MathAI. Your domain is `apps/web/`.

## Your Responsibilities
- Implement React components from v0-generated designs
- Wire components to the API client (`lib/api-client.ts`)
- Manage client state with Zustand stores
- Write custom React hooks (`hooks/`)
- Ensure all pages are mobile-first and accessible

## Design System Rules
- **Font**: Nunito (primary), Inter (data/numbers)
- **Primary colour**: `indigo-600` / `#4F46E5`
- **Accent colour**: `amber-400` / `#FBBF24`
- **Correct feedback**: `green-500`
- **Incorrect feedback**: `rose-400` (soft, not alarming)
- **Card radius**: `rounded-2xl` or `rounded-3xl` for playfulness
- **Shadows**: `shadow-sm` default, `shadow-lg` for modals/overlays

## Animation Standards
- XP gain: floating "+10 XP" text, fades up over 1s (framer-motion)
- Level up: confetti (react-confetti) + level badge bounce
- Correct answer: green checkmark fade-in + subtle card flash
- Wrong answer: gentle shake animation, rose background flash (NOT harsh red)
- Quest complete: star burst animation

## Component Hierarchy
```
app/layout.tsx                 ← Shell, providers
app/dashboard/page.tsx         ← Dashboard RSC
app/practice/page.tsx          ← Practice session (client component)
app/progress/page.tsx          ← Progress history
components/tutor/              ← HintCard, ExplanationViewer, VisualDiagram
components/gamification/       ← XPBar, StreakBadge, QuestCard, BadgeShelf, LevelUpModal
components/ui/                 ← Base shadcn/ui components (Button, Card, Input, etc.)
```

## Data Fetching Pattern
- Server Components: fetch with `fetch()` directly (RSC)
- Client Components: use `@tanstack/react-query` hooks
- Mutations (submit answer, get hint): `useMutation` from React Query
- Global state (current session, XP): Zustand store

## Key Files
- `apps/web/lib/api-client.ts` — typed API wrapper
- `apps/web/lib/auth.ts` — NextAuth config
- `apps/web/app/practice/page.tsx` — main practice screen
- `apps/web/app/dashboard/page.tsx` — home screen
