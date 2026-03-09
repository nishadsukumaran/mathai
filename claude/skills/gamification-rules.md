# MathAI Gamification Rules

## XP Table (canonical)
| Action | XP | Reason constant |
|--------|-----|----------------|
| Correct answer (1st attempt) | +10 | XPReason.CorrectAnswer |
| Retry success (2nd+ attempt) | +6 | XPReason.RetrySuccess |
| Daily login | +5 | XPReason.DailyLogin |
| Lesson complete | +15 | XPReason.LessonComplete |
| Challenge complete | +20 | XPReason.ChallengeComplete |
| Streak milestone | +10 | XPReason.StreakBonus |

## Level Progression
Target: a student doing 10 min/day (approx 10 questions) levels up every 5–7 days.
Daily XP estimate: ~5 login + ~100 from 10 questions = ~105 XP/day.
Level 1→2 gap: 100 XP (~1 day). Level 2→3 gap: 183 XP (~2 days). Ramps up.

## Streak Rules
- Breaks if student misses a full calendar day (midnight-based)
- Streak freeze: single-use item earned via quest, protects against one break
- Milestones at: 3, 7, 14, 30, 100 days

## Badge Principles
- Attainable: every student should earn at least 3 badges in their first week
- Progressive: badges for 3-day, 7-day, 30-day streaks (not just 30-day)
- Diverse: accuracy, persistence, exploration — not just "be good at math"

## Quest Rules
- 3 daily quests, resets at midnight
- 2 weekly quests, resets Monday midnight
- Daily quests completable in 15 min
- Weekly quests completable in 3 sessions
- Never stack 3 accuracy quests on the same day
