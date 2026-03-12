-- Migration: session_persistence_hint_level
-- 2026-03-13
--
-- Changes:
--   1. practice_sessions.practiceSetId → nullable
--      The app creates sessions on-the-fly (AI-generated questions) without
--      a pre-existing PracticeSet FK. Making this optional lets us write real
--      DB rows on session start and stop losing state on server restart.
--
--   2. practice_sessions.questionsJson  — stores the AI-generated question list
--      so the session can be reconstructed from DB if the in-memory map is lost
--      (e.g. after a Render deploy).
--
--   3. practice_sessions.topicId        — denormalised slug for fast per-topic
--      queries without joining through practice_sets.
--
--   4. practice_sessions.currentIndex   — tracks question position for recovery.
--
--   5. question_attempts.hintMaxLevel   — highest hint tier used (1 = nudge,
--      2 = partial, 3 = full step). Was previously only captured as a count;
--      now the tier itself is stored so mastery can weight hint severity.

-- 1. Make practiceSetId nullable
ALTER TABLE "practice_sessions"
  ALTER COLUMN "practiceSetId" DROP NOT NULL;

-- 2–4. Add session recovery columns
ALTER TABLE "practice_sessions"
  ADD COLUMN IF NOT EXISTS "questionsJson" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "topicId"       TEXT,
  ADD COLUMN IF NOT EXISTS "currentIndex"  INTEGER NOT NULL DEFAULT 0;

-- 5. Add hint tier column to attempts
ALTER TABLE "question_attempts"
  ADD COLUMN IF NOT EXISTS "hintMaxLevel" INTEGER;
