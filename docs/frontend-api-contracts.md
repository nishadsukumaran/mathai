# MathAI Frontend API Contracts

**Last updated:** April 2026
**Base URL:** `http://localhost:3001/api` (dev) | Production: via `NEXT_PUBLIC_API_BASE_URL`
**Auth:** Bearer JWT in `Authorization` header (NextAuth session token)

All responses use the envelope:
```json
{ "success": true, "data": { ... }, "meta": { ... } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

---

## 1. Dashboard

**`GET /dashboard/:studentId`**

Returns everything needed for the student home screen.

```typescript
{
  student: {
    id: string;
    name: string;
    grade: string;
    avatarUrl?: string;
    weakAreas: string[];   // top 3 topic IDs
    strongAreas: string[]; // top 3 topic IDs
  };
  gamification: {
    xp: number;
    level: number;
    xpToNextLevel: number;
    xpProgress: { current: number; nextLevelAt: number };
    streak: number;
    longestStreak: number;
    hasStreakShield: boolean;
    recentBadges: EarnedBadge[];
    activeQuests: DailyQuest[];
  };
  progress: {
    masteredTopics: number;
    totalTopics: number;
    level: number;
    levelTitle: string;
    streak: number;
    xpToNextLevel: number;
  };
}
```

---

## 2. Practice

### `POST /practice/start`

Start an adaptive practice session.

**Request:**
```typescript
{
  topicId: string;
  mode: "topic_practice" | "guided" | "review" | "daily_challenge" | "weak_area_booster";
  questionCount?: number;     // default: 5-10
  difficulty?: "beginner" | "intermediate" | "advanced" | "challenge";
  practiceSetId?: string;
  lessonId?: string;
}
```

**Response:**
```typescript
{
  session: {
    id: string;
    topicId: string;
    mode: string;
    questions: PracticeQuestion[];
    currentIndex: number;
    xpEarned: number;
  };
  firstQuestion: PracticeQuestion;
}
```

### `POST /practice/submit`

Submit an answer. Returns result + adaptive next step + next question.

**Request:**
```typescript
{
  sessionId: string;
  questionId: string;
  answer: string;
  timeSpentSeconds: number;
  hintsUsed: number;
  hintMaxLevel?: number;       // 1-3
  confidenceBefore?: number;   // 1-5
}
```

**Response:**
```typescript
{
  isCorrect: boolean;
  correctAnswer: string;
  xpEarned: number;
  encouragement: string;
  misconceptionTag?: string;
  nextAction: "continue" | "hint_available" | "session_complete" | "level_up";
  sessionComplete?: boolean;
  masteryUpdate?: { topicId: string; newLevel: MasteryLevel; levelChanged: boolean };
  levelUp?: { newLevel: number; title: string };
  sessionAdaptation?: SessionNextStep;  // NEW — in-session adaptive guidance
  nextQuestion?: PracticeQuestion;      // NEW — difficulty-adapted question
}
```

**SessionNextStep shape:**
```typescript
{
  action: "next_question" | "easier_question" | "harder_question" | "show_hint"
    | "show_visual_explanation" | "show_step_by_step" | "repeat_concept"
    | "switch_to_revision" | "celebrate_and_continue" | "end_session_positive";
  reason: string;
  encouragement: string;
  difficulty?: "easy" | "medium" | "hard" | "adaptive";
  explanationPreference?: "step_by_step" | "visual" | "concise" | "adaptive";
  sourceSignals: {
    consecutiveWrong?: boolean;
    consecutiveCorrect?: boolean;
    hintDependency?: boolean;
    carelessPattern?: boolean;
    confidenceDrop?: boolean;
    masteryProgressing?: boolean;
    fatigueRisk?: boolean;
    sessionRecovery?: boolean;
  };
}
```

### `POST /practice/hint`

**Request:** `{ sessionId, questionId, questionText, topicId, hintsUsedSoFar }`
**Response:** `{ content: { text: string }, visualPlan?: VisualPlan, encouragement: string }`

### `POST /practice/explanation`

**Request:** `{ sessionId, questionId, questionText, topicId }`
**Response:** Full TutorResponse with steps and visual plan.

### `GET /practice/menu`

AI-enriched personalised practice menu.

**Response:**
```typescript
{
  generatedAt: string;
  aiEnriched?: boolean;
  sections: [{
    type: "best_for_you" | "revise_this" | "grade_level" | "challenge" | "confidence_booster" | "ai_picks";
    title: string;
    subtitle: string;
    items: [{
      topicId: string;
      topicName: string;
      iconSlug: string;
      masteryLevel: MasteryLevel;
      accuracyPct: number;
      suggestedMode: PracticeMode;
      reason: string;
      encouragement?: string;
      isNew?: boolean;
    }];
  }];
}
```

---

## 3. Learning Brain

### `GET /learning/next`

The Learning Brain's next-best-action recommendation.

**Response:**
```typescript
{
  type: "practice" | "revise" | "challenge" | "review_mistake" | "continue_path";
  topicId: string;
  topicName: string;
  difficulty: "easy" | "medium" | "hard" | "adaptive";
  reason: string;
  encouragement: string;
  confidenceTarget?: number;
  sessionMode: "focus" | "revision" | "challenge" | "guided";
  recommendedQuestionCount: number;
  explanationPreference: "step_by_step" | "visual" | "concise" | "adaptive";
  sourceSignals: {
    weakArea?: boolean;
    lowConfidence?: boolean;
    recentErrors?: boolean;
    neglectedTopic?: boolean;
    masteryReady?: boolean;
    revisionDue?: boolean;
    hintDependency?: boolean;
    fastButInaccurate?: boolean;
    slowButAccurate?: boolean;
  };
}
```

---

## 4. Ask MathAI

### `POST /tutor/ask`

**Request:**
```typescript
{
  question: string;          // 1-1000 chars
  grade?: string;            // e.g. "G4"
  context?: string;          // max 500 chars
  studentName?: string;
  profile?: {
    confidenceLevel?: number;
    preferredExplanationStyle?: string;
    learningPace?: string;
  };
}
```

**Response:**
```typescript
{
  question: string;
  explanation: string;
  steps?: [{ stepNumber, instruction, formula?, visualCue? }];
  example: { problem, solution, keyInsight };
  visualPlan?: VisualPlan;
  followUp: string;
  encouragement: string;
  visualStrategy?: "diagram" | "animated_diagram" | "concept_image" | "none";
  mathData?: MathData;       // NEW — structured math understanding
}
```

**MathData shape:**
```typescript
{
  type: "addition" | "subtraction" | "multiplication" | "division"
    | "fraction_addition" | "fraction_subtraction" | "fraction_equivalence"
    | "fraction_comparison" | "place_value" | "word_problem" | "equation" | "comparison";
  values?: number[];
  fractions?: [{ numerator, denominator }];
  result?: number | string;
  steps?: string[];
  structure?: { groups?, itemsPerGroup?, total? };
  equation?: { lhs, rhs, variable?, solution? };
  wordProblem?: { known: [{ label, value }], unknown?: { label }, operation? };
}
```

---

## 5. Student Data

### `GET /progress/:studentId`

```typescript
{
  userId: string;
  totalXp: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  streak: number;
  masteredTopics: number;
  totalTopics: number;
  weakAreas: string[];
}
```

### `GET /profile` / `PATCH /profile`

```typescript
// GET response / PATCH request
{
  id: string;
  name: string;
  grade: Grade;
  avatarUrl?: string;
  preferredTheme: string;
  learningPace: "slow" | "standard" | "fast";
  confidenceLevel: number;
  preferredExplanationStyle: "visual" | "step_by_step" | "story" | "analogy" | "direct";
  totalXp: number;
  currentLevel: number;
}
```

### `GET /student/memory`

Returns the cached MemorySnapshot (2hr TTL).

```typescript
{
  version: 1;
  lessonsStarted: string[];
  lessonsCompleted: string[];
  topicsAttempted: string[];
  strongTopics: [{ topicId, topicName?, masteryScore }];
  weakTopics: [{ topicId, topicName?, masteryScore, daysSinceLastPractice }];
  activeMistakePatterns: [{ topicId, tag, count, lastSeenAt }];
  hintDependencyByTopic: Record<string, number>;
  confidenceTrend: "rising" | "stable" | "falling";
  avgConfidenceScore: number;
  preferredExplanationStyle: string;
  learningPace: string;
  interests: string[];
  recentSessions: [{ sessionId, topicId, accuracyPct, questionsCount, hintsUsed, confidenceAfter, practicedAt }];
  suggestedFocusTopics: string[];
  lastRefreshedAt: string;
}
```

---

## 6. Parent Portal

### `GET /parent/dashboard/:childId`

Requires `parent` or `admin` role.

```typescript
{
  childName: string;
  childGrade: string;
  learningScore: { overall, mastery, consistency, effort, accuracy, improvement };
  learningStatus: "excellent" | "on_track" | "needs_attention";
  confidenceSignal: "rising" | "stable" | "needs_support";
  confidenceExplanation: string;
  supportNeed: "low" | "moderate" | "high";
  currentFocus: { topicName, reason } | null;
  todayActivity: { questionsAnswered, minutesActive, sessionsCompleted };
  streak: { current, longest };
  insights: [{
    id: string;
    type: "strength" | "improvement" | "attention" | "suggestion" | "celebration";
    icon: string;
    message: string;
    actionHint?: string;
    priority: number;
  }];
  insightBasis: string;
  learningPersonality: [{ icon, label, detail }];
  masteryClusters: {
    weakAreas: TopicMasteryItem[];
    improving: TopicMasteryItem[];
    strong: TopicMasteryItem[];
    revisionDue: TopicMasteryItem[];
    notStarted: number;
  };
  masteryMap: TopicMasteryItem[];
  recentHighlights: [{ type, icon, message, date }];
  nextRecommendation: { topicName, reason, actionType } | null;
}
```

---

## 7. Gamification

### `GET /gamification/dashboard`

```typescript
{
  xp: number;
  level: number;
  xpToNextLevel: number;
  xpProgress: { current, nextLevelAt };
  streak: number;
  longestStreak: number;
  hasStreakShield: boolean;
  recentBadges: EarnedBadge[];
  activeQuests: DailyQuest[];
}
```

### `GET /daily-quests/:studentId`

```typescript
[{
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  expiresAt: string;
  completedAt?: string;
}]
```

---

## 8. Pet System

### `GET /pet`
Returns the student's pet with personality effects and catalog.

### `POST /pet/adopt`
Adopt a new pet or rename current: `{ petId?: string, petName?: string }`

---

## 9. Admin

### `GET /admin/dashboard`
Platform stats: total/active/disabled users, new signups, breakdown by role/grade.

### `GET /admin/users`
Paginated user list: `?page=1&limit=20&search=&role=&isActive=`

### `GET /admin/users/:id`
User detail including student profile and pet insight.

### `PATCH /admin/users/:id`
Update user: `{ name?, email?, role?, gradeLevel? }`

---

## Error Codes

```typescript
{
  NOT_FOUND:       "NOT_FOUND",
  UNAUTHORIZED:    "UNAUTHORIZED",
  FORBIDDEN:       "FORBIDDEN",
  VALIDATION:      "VALIDATION_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  NETWORK:         "NETWORK_ERROR",
  UNKNOWN:         "INTERNAL_ERROR",
}
```

---

## Client Libraries

### Server Components (Next.js)
```typescript
import { apiFetch } from "@/lib/api";
const data = await apiFetch<DashboardData>("/dashboard/user-123");
```

### Client Components
```typescript
import { clientGet, clientPost, clientPatch } from "@/lib/clientApi";
const profile = await clientGet<StudentProfileResponse>("/profile");
```

### React Query Hooks
```typescript
import { useDashboard } from "@/hooks/use-dashboard";
import { usePracticeMenu } from "@/hooks/use-practice-menu";
import { useLearningNext } from "@/hooks/use-learning-next";
import { useProfile } from "@/hooks/use-profile";
```

### Mock Mode
Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`. All hooks return mock data with 600ms delay.
