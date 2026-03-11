-- ─────────────────────────────────────────────────────────────────────────────
-- MathAI Wave 5 — Student Learning Memory Migration
-- Apply via: Supabase dashboard → SQL editor → paste and run
--            OR: psql $DATABASE_URL -f supabase-migration-wave5.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Extend student_profiles ──────────────────────────────────────────────

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS interests                TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "totalHintsUsed"         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalQuestionsAttempted" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "avgConfidenceScore"      FLOAT   NOT NULL DEFAULT 50;

-- ─── 2. lesson_progress ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lesson_progress (
  id              TEXT        NOT NULL PRIMARY KEY,
  "userId"        TEXT        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  "lessonId"      TEXT        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  "topicId"       TEXT        NOT NULL,
  "isStarted"     BOOLEAN     NOT NULL DEFAULT TRUE,
  "isCompleted"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "completedAt"   TIMESTAMPTZ,
  "lastScore"     FLOAT       NOT NULL DEFAULT 0,
  "attemptsCount" INTEGER     NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lesson_progress_user_lesson_unique UNIQUE ("userId", "lessonId")
);

CREATE INDEX IF NOT EXISTS lesson_progress_user_topic_idx
  ON lesson_progress ("userId", "topicId");

-- ─── 3. topic_mistake_patterns ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS topic_mistake_patterns (
  id            TEXT        NOT NULL PRIMARY KEY,
  "userId"      TEXT        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  "topicId"     TEXT        NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tag           TEXT        NOT NULL,
  count         INTEGER     NOT NULL DEFAULT 1,
  "isResolved"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "resolvedAt"  TIMESTAMPTZ,
  "lastSeenAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT topic_mistake_patterns_unique UNIQUE ("userId", "topicId", tag)
);

CREATE INDEX IF NOT EXISTS mistake_patterns_user_resolved_idx
  ON topic_mistake_patterns ("userId", "isResolved");

CREATE INDEX IF NOT EXISTS mistake_patterns_topic_tag_idx
  ON topic_mistake_patterns ("topicId", tag);

-- ─── 4. student_memory_snapshots ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_memory_snapshots (
  id            TEXT        NOT NULL PRIMARY KEY,
  "userId"      TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "refreshedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snapshot      JSONB       NOT NULL
);

-- ─── 5. updatedAt trigger helper (re-usable function) ────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_lesson_progress_updated_at'
  ) THEN
    CREATE TRIGGER set_lesson_progress_updated_at
      BEFORE UPDATE ON lesson_progress
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_mistake_patterns_updated_at'
  ) THEN
    CREATE TRIGGER set_mistake_patterns_updated_at
      BEFORE UPDATE ON topic_mistake_patterns
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
