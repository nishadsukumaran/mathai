# MathAI Frontend API Contracts

**Version:** 0.1 — Mock data layer complete, live backend ready for wiring.
**Base URL:** `http://localhost:3001/api` (dev) · `https://api.mathaiapp.com/api` (prod)
**Auth:** Bearer token in `Authorization` header (NextAuth session → access token)

All responses use the envelope:
```json
{ "success": true, "data": { ... }, "meta": { "count": 5 } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

---

## 1. Dashboard

**`GET /dashboard/:studentId`**

Returns everything needed to render the student's home screen in a single request.

**Hook:** `useDashboard(studentId)`

**Response (`data`):**
```json
{
  "student": {
    "id": "student-001",
    "displayName": "Aryan",
    "avatarUrl": "/avatars/rocket.png",
    "grade": "G4"
  },
  "xp": {
    "totalXP": 340,
    "level": 2,
    "levelTitle": "Number Explorer",
    "xpInLevel": 140,
    "xpToNextLevel": 450,
    "progressPct": 31
  },
  "streak": {
    "currentStreak": 5,
    "longestStreak": 12,
    "lastActiveDate": "2026-03-08",
    "shieldActive": false
  },
  "recentBadges": [
    {
      "id": "badge-streak-3",
      "name": "3-Day Streak!",
      "description": "Practiced 3 days in a row.",
      "iconUrl": "/badges/streak-3.svg",
      "category": "streak",
      "xpBonus": 10,
      "earnedAt": "2026-03-07T14:32:00Z"
    }
  ],
  "quests": [
    {
      "id": "dq-correct-5-...",
      "title": "Answer 5 Questions Correctly",
      "description": "Get 5 right today!",
      "targetCount": 5,
      "currentCount": 3,
      "xpReward": 20,
      "expiresAt": "2026-03-09T23:59:59Z"
    }
  ],
  "recommendedLesson": {
    "topicId": "g4-fractions-add",
    "topicName": "Adding Fractions",
    "lessonTitle": "Unlike Denominators",
    "reason": "in_progress"
  }
}
```

**Empty state:** `recommendedLesson` may be `null` if no lessons are started. `recentBadges` may be empty `[]`.

---

## 2. Curriculum (Topic Grid)

**`GET /curriculum?grade=G4&strand=fractions`** (`strand` optional)

Returns the topic grid for the student's grade.

**Hook:** `useCurriculum(grade, strand?)`

**Response (`data`):**
```json
{
  "grade": "G4",
  "topics": [
    {
      "id": "g4-fractions-add",
      "name": "Adding Fractions",
      "description": "Add fractions with like and unlike denominators.",
      "grade": "G4",
      "strand": "Number & Operations — Fractions",
      "masteryLevel": "developing",
      "isUnlocked": true,
      "lessonCount": 4,
      "iconSlug": "fractions"
    }
  ]
}
```

**`masteryLevel` values:** `"not_started"` · `"emerging"` · `"developing"` · `"mastered"` · `"extended"`

**`isUnlocked`:** `false` topics render with a lock icon. Clicking them shows a "Complete prerequisites first" message.

---

## 3. Topic Detail

**`GET /curriculum/topic/:topicId`**

Fetches full topic info with lesson list and states.

**Hook:** `useTopicDetail(topicId)`

**Response (`data`):**
```json
{
  "id": "g4-fractions-add",
  "name": "Adding Fractions",
  "description": "Add fractions with like and unlike denominators...",
  "grade": "G4",
  "strand": "Number & Operations — Fractions",
  "masteryLevel": "developing",
  "isUnlocked": true,
  "lessons": [
    {
      "id": "lesson-fractions-add-intro",
      "title": "Adding with the Same Bottom Number",
      "description": "When denominators match, just add the tops!",
      "state": "mastered",
      "estimatedMin": 10,
      "xpReward": 30
    },
    {
      "id": "lesson-fractions-add-unlike",
      "title": "Finding the Common Denominator",
      "description": "Learn to find the LCD...",
      "state": "in_progress",
      "estimatedMin": 15,
      "xpReward": 40
    }
  ]
}
```

**`state` values:** `"locked"` · `"unlocked"` · `"in_progress"` · `"completed"` · `"mastered"`

---

## 4. Progress

**`GET /progress/:studentId`**

Full progress summary for the /progress screen.

**Hook:** `useProgress(studentId)`

**Response (`data`):**
```json
{
  "student": { ... },
  "xp": { ... },
  "streak": { ... },
  "topicsStarted": 4,
  "topicsMastered": 1,
  "totalSessions": 18,
  "totalQuestions": 142,
  "overallAccuracy": 74,
  "topicProgress": [
    {
      "topicId": "g4-multiplication",
      "topicName": "Multi-Digit Multiplication",
      "masteryLevel": "mastered",
      "accuracyPct": 92,
      "questionsTotal": 65,
      "lastPracticed": "2026-03-05"
    }
  ]
}
```

---

## 5. Weak Areas

**`GET /curriculum/weak-areas/:studentId`**

Returns top 5 topics where the student is struggling. Used in the progress screen's recommendation panel.

**Hook:** `useWeakAreas(studentId)`

**Response (`data`):** `WeakArea[]`
```json
[
  {
    "topicId": "g4-place-value",
    "topicName": "Place Value to Millions",
    "masteryLevel": "emerging",
    "accuracyPct": 55,
    "reason": "Accuracy below 60% across 4 sessions",
    "actionLabel": "Practice Place Value"
  }
]
```

**Empty state:** Returns `[]`. Show "No weak areas yet — keep practising!" message.

---

## 6. Daily Quests

**`GET /daily-quests/:studentId`**

Returns today's 3 active quests. Resets at midnight.

**Hook:** `useDailyQuests(studentId)`

**Response (`data`):** `DailyQuest[]` (always exactly 3 items)
```json
[
  {
    "id": "dq-correct-5-...",
    "title": "Answer 5 Questions Correctly",
    "description": "Get 5 right today!",
    "targetCount": 5,
    "currentCount": 3,
    "xpReward": 20,
    "expiresAt": "2026-03-09T23:59:59Z",
    "completedAt": null
  }
]
```

**Completed quest:** `completedAt` is an ISO timestamp string. Show a green checkmark + strikethrough title.

---

## 7. Practice — Start Session

**`POST /practice/start`**

Creates a new practice session. Returns session metadata and the first question.

**Hook:** `usePracticeSession().startSession(request)`

**Request body:**
```json
{
  "topicId":       "g4-fractions-add",
  "mode":          "topic_practice",
  "grade":         "G4",
  "difficulty":    "beginner",
  "questionCount": 10
}
```

**`mode` values:** `"topic_practice"` · `"daily_challenge"` · `"weak_area_booster"` · `"guided"` · `"review"`

**Response (`data`):**
```json
{
  "sessionId":      "session-1741478400000-abc123",
  "topicId":        "g4-fractions-add",
  "mode":           "topic_practice",
  "totalQuestions": 10,
  "currentIndex":   0,
  "xpEarned":       0,
  "currentQuestion": {
    "id":         "q-fa-01",
    "type":       "fill_in_blank",
    "prompt":     "What is 1/4 + 2/4?",
    "difficulty": "beginner",
    "xpReward":   10
  }
}
```

**Note:** `correctAnswer` is intentionally omitted from the question. It only appears in `SubmissionResult`.

---

## 8. Practice — Submit Answer

**`POST /practice/submit`**

Submits the student's answer. Returns feedback, XP, and the next question (if any).

**Hook:** `usePracticeSession().submitAnswer(request)`

**Request body:**
```json
{
  "sessionId":        "session-1741478400000-abc123",
  "questionId":       "q-fa-01",
  "studentAnswer":    "3/4",
  "timeSpentSeconds": 14
}
```

**Response (`data`) — Correct, not last question:**
```json
{
  "isCorrect":     true,
  "correctAnswer": "3/4",
  "xpEarned":      10,
  "encouragement": "Brilliant! You nailed it first try!",
  "nextAction":    "next_question",
  "nextQuestion": {
    "id":      "q-fa-02",
    "type":    "multiple_choice",
    "prompt":  "What is 2/5 + 2/5?",
    "options": ["4/10", "4/5", "4/25", "2/5"],
    "difficulty": "beginner",
    "xpReward": 10
  }
}
```

**Response (`data`) — Wrong answer:**
```json
{
  "isCorrect":        false,
  "correctAnswer":    "5/6",
  "xpEarned":         0,
  "encouragement":    "Great try! Here's a clue.",
  "misconceptionTag": "fraction_misunderstanding",
  "nextAction":       "retry"
}
```

**Response (`data`) — Session complete:**
```json
{
  "isCorrect":    true,
  "correctAnswer": "7/8",
  "xpEarned":     10,
  "encouragement": "You're on fire!",
  "nextAction":   "session_complete",
  "levelUp":      { "newLevel": 3, "newTitle": "Fraction Fighter" },
  "masteryUpdate": { "topicId": "g4-fractions-add", "newLevel": "developing" },
  "questUpdate":   { "questId": "dq-correct-5-...", "completed": true, "newCount": 5 },
  "sessionComplete": {
    "sessionId":      "session-...",
    "totalQuestions": 10,
    "correctCount":   8,
    "accuracyPct":    80,
    "xpEarned":       80,
    "badgesEarned": [ { ... } ]
  }
}
```

**`nextAction` values:**
- `"next_question"` → Advance to `nextQuestion`
- `"retry"` → Let student try again (show encouragement + hint option)
- `"session_complete"` → Show session summary screen

---

## 9. Hint

**`POST /practice/hint`**

Gets a progressive hint for the current question. Call with increasing `hintsUsed` to get deeper hints.

**Hook:** `usePracticeSession().getHint(request)`

**Request body:**
```json
{
  "sessionId":  "session-...",
  "questionId": "q-fa-03",
  "hintsUsed":  0
}
```

**`hintsUsed`:** `0` → Hint 1 (gentle nudge) · `1` → Hint 2 (bigger clue) · `2+` → Next Step (nearly gives it away)

**Response (`data`):**
```json
{
  "helpMode":      "hint_2",
  "encouragement": "Still working through it — that's the spirit!",
  "content": {
    "text": "Before you add fractions, both fractions need the same size piece. What's the smallest number both denominators divide into evenly?"
  },
  "visualPlan": {
    "diagramType": "fraction_bar",
    "data": {
      "fractions": ["1/3", "1/2"],
      "targetDenominator": 6
    }
  }
}
```

**`visualPlan`:** Optional. When present, render the corresponding diagram component. `diagramType` maps to a React component.

---

## 10. Explanation

**`POST /practice/explanation`**

Gets a full step-by-step explanation or a similar worked example.

**Hook:** `usePracticeSession().getExplanation(request)`

**Request body:**
```json
{
  "sessionId":  "session-...",
  "questionId": "q-fa-03"
}
```

**Response (`data`):**
```json
{
  "helpMode":      "explain_fully",
  "encouragement": "Let me walk you through this step by step!",
  "content": {
    "text": "Adding fractions with different denominators needs a common denominator first.",
    "steps": [
      {
        "stepNumber":  1,
        "instruction": "Find the LCD of 3 and 2.",
        "formula":     "\\text{LCD}(3, 2) = 6",
        "visualCue":   "Think: what's the first number both 3 and 2 count up to?"
      },
      {
        "stepNumber":  2,
        "instruction": "Convert 1/3 to have denominator 6.",
        "formula":     "\\frac{1}{3} = \\frac{2}{6}"
      }
    ]
  },
  "visualPlan": {
    "diagramType": "fraction_bar",
    "data": { "fractions": ["1/3", "1/2"], "equivalent": ["2/6", "3/6"], "result": "5/6" }
  }
}
```

**`formula` fields:** LaTeX strings. Render with KaTeX (`dangerouslySetInnerHTML` or `react-katex`).

---

## Error Codes

| Code | HTTP | When |
|------|------|------|
| `NOT_FOUND` | 404 | Student, session, or topic doesn't exist |
| `VALIDATION_ERROR` | 400 | Missing/invalid request body field |
| `UNAUTHORIZED` | 401 | Missing or expired auth token |
| `SESSION_EXPIRED` | 404 | Practice session no longer in memory |
| `INTERNAL_ERROR` | 500 | Unexpected server failure |
| `NETWORK_ERROR` | — | Client-side, no response received |

All error responses have this shape:
```json
{
  "success": false,
  "error": {
    "code":    "SESSION_EXPIRED",
    "message": "Practice session not found. It may have expired. Please start a new session.",
    "details": {}
  }
}
```
