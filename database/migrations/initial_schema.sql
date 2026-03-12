-- =============================================================================
-- MathAI — Full Initial Schema
-- Run this in Supabase SQL Editor to create all tables from scratch.
-- =============================================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole"        AS ENUM ('student', 'parent', 'teacher', 'admin');
CREATE TYPE "Grade"           AS ENUM ('K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8');
CREATE TYPE "Strand"          AS ENUM ('Numbers', 'Operations', 'Fractions', 'Decimals', 'Geometry', 'Measurement', 'Algebra', 'WordProblems', 'DataAndProbability');
CREATE TYPE "Difficulty"      AS ENUM ('beginner', 'intermediate', 'advanced', 'challenge');
CREATE TYPE "MasteryLevel"    AS ENUM ('not_started', 'emerging', 'developing', 'mastered', 'extended');
CREATE TYPE "PracticeMode"    AS ENUM ('guided', 'practice', 'challenge', 'review');
CREATE TYPE "QuestionType"    AS ENUM ('multiple_choice', 'fill_in_blank', 'true_false', 'word_problem', 'drag_and_drop');
CREATE TYPE "XPReason"        AS ENUM ('correct_answer', 'retry_success', 'daily_login', 'lesson_complete', 'challenge_complete', 'streak_bonus', 'badge_earned', 'quest_complete');
CREATE TYPE "BadgeCategory"   AS ENUM ('accuracy', 'streak', 'speed', 'persistence', 'exploration');
CREATE TYPE "QuestType"       AS ENUM ('daily', 'weekly');
CREATE TYPE "LearningPace"    AS ENUM ('slow', 'standard', 'fast');
CREATE TYPE "QuestStatus"     AS ENUM ('active', 'completed', 'expired');
CREATE TYPE "ExplanationStyle" AS ENUM ('visual', 'step_by_step', 'story', 'analogy', 'direct');

-- ─── Prisma migration history ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                  VARCHAR(36)  NOT NULL PRIMARY KEY,
  "checksum"            VARCHAR(64)  NOT NULL,
  "finished_at"         TIMESTAMPTZ,
  "migration_name"      VARCHAR(255) NOT NULL,
  "logs"                TEXT,
  "rolled_back_at"      TIMESTAMPTZ,
  "started_at"          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER      NOT NULL DEFAULT 0
);

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"             TEXT      NOT NULL,
  "email"          TEXT      NOT NULL,
  "name"           TEXT      NOT NULL,
  "hashedPassword" TEXT,
  "role"           "UserRole" NOT NULL DEFAULT 'student',
  "avatarUrl"      TEXT,
  "emailVerified"  TIMESTAMP(3),
  "gradeLevel"     "Grade",
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key"      ON "users"("email");
CREATE        INDEX "users_role_idx"       ON "users"("role");
CREATE        INDEX "users_gradeLevel_idx" ON "users"("gradeLevel");

-- ─── NextAuth adapter ─────────────────────────────────────────────────────────

CREATE TABLE "accounts" (
  "id"                TEXT    NOT NULL,
  "userId"            TEXT    NOT NULL,
  "type"              TEXT    NOT NULL,
  "provider"          TEXT    NOT NULL,
  "providerAccountId" TEXT    NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  CONSTRAINT "accounts_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

CREATE TABLE "sessions" (
  "id"           TEXT         NOT NULL,
  "sessionToken" TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "expires"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sessions_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

CREATE TABLE "verification_tokens" (
  "identifier" TEXT         NOT NULL,
  "token"      TEXT         NOT NULL,
  "expires"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "verification_tokens_identifier_token_key" UNIQUE ("identifier", "token")
);
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- ─── Student profile ──────────────────────────────────────────────────────────

CREATE TABLE "student_profiles" (
  "id"                       TEXT             NOT NULL,
  "userId"                   TEXT             NOT NULL,
  "learningPace"             "LearningPace"   NOT NULL DEFAULT 'standard',
  "confidenceLevel"          INTEGER          NOT NULL DEFAULT 50,
  "currentLevel"             INTEGER          NOT NULL DEFAULT 1,
  "totalXp"                  INTEGER          NOT NULL DEFAULT 0,
  "streakCount"              INTEGER          NOT NULL DEFAULT 0,
  "preferredTheme"           TEXT             NOT NULL DEFAULT 'space',
  "preferredExplanationStyle" "ExplanationStyle" NOT NULL DEFAULT 'visual',
  "interests"                TEXT             NOT NULL DEFAULT '',
  "totalHintsUsed"           INTEGER          NOT NULL DEFAULT 0,
  "totalQuestionsAttempted"  INTEGER          NOT NULL DEFAULT 0,
  "avgConfidenceScore"       DOUBLE PRECISION NOT NULL DEFAULT 50,
  "aiAssignedTopics"         JSONB            NOT NULL DEFAULT '[]',
  "aiAssignedTopicsAt"       TIMESTAMP(3),
  "updatedAt"                TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_profiles_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- ─── Streaks ──────────────────────────────────────────────────────────────────

CREATE TABLE "streaks" (
  "id"             TEXT         NOT NULL,
  "userId"         TEXT         NOT NULL,
  "currentStreak"  INTEGER      NOT NULL DEFAULT 0,
  "longestStreak"  INTEGER      NOT NULL DEFAULT 0,
  "lastActiveDate" TIMESTAMP(3),
  "hasShield"      BOOLEAN      NOT NULL DEFAULT false,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "streaks_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "streaks_userId_key" ON "streaks"("userId");

-- ─── Curriculum ───────────────────────────────────────────────────────────────

CREATE TABLE "curriculum_strands" (
  "id"          TEXT    NOT NULL,
  "slug"        TEXT    NOT NULL,
  "name"        TEXT    NOT NULL,
  "description" TEXT    NOT NULL,
  "iconEmoji"   TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "curriculum_strands_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "curriculum_strands_slug_key"      ON "curriculum_strands"("slug");
CREATE        INDEX "curriculum_strands_sortOrder_idx" ON "curriculum_strands"("sortOrder");

CREATE TABLE "topics" (
  "id"               TEXT             NOT NULL,
  "strandId"         TEXT             NOT NULL,
  "slug"             TEXT             NOT NULL,
  "name"             TEXT             NOT NULL,
  "description"      TEXT             NOT NULL,
  "gradeBand"        "Grade"          NOT NULL,
  "difficulty"       "Difficulty"     NOT NULL DEFAULT 'beginner',
  "prerequisites"    TEXT[]           NOT NULL DEFAULT '{}',
  "masteryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  "estimatedMinutes" INTEGER          NOT NULL DEFAULT 30,
  "iconEmoji"        TEXT,
  "sortOrder"        INTEGER          NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "topics_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "topics_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "curriculum_strands"("id")
);
CREATE UNIQUE INDEX "topics_slug_key"                ON "topics"("slug");
CREATE        INDEX "topics_strandId_idx"            ON "topics"("strandId");
CREATE        INDEX "topics_gradeBand_difficulty_idx" ON "topics"("gradeBand", "difficulty");

CREATE TABLE "lessons" (
  "id"             TEXT         NOT NULL,
  "topicId"        TEXT         NOT NULL,
  "title"          TEXT         NOT NULL,
  "objective"      TEXT         NOT NULL,
  "contentSummary" TEXT         NOT NULL,
  "orderIndex"     INTEGER      NOT NULL DEFAULT 1,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lessons_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "lessons_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE
);
CREATE INDEX "lessons_topicId_orderIndex_idx" ON "lessons"("topicId", "orderIndex");

CREATE TABLE "practice_sets" (
  "id"            TEXT          NOT NULL,
  "topicId"       TEXT          NOT NULL,
  "lessonId"      TEXT,
  "title"         TEXT          NOT NULL,
  "mode"          "PracticeMode" NOT NULL DEFAULT 'practice',
  "difficulty"    "Difficulty"  NOT NULL DEFAULT 'intermediate',
  "questionCount" INTEGER       NOT NULL DEFAULT 10,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "practice_sets_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "practice_sets_topicId_fkey"  FOREIGN KEY ("topicId")  REFERENCES "topics"("id"),
  CONSTRAINT "practice_sets_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id")
);
CREATE INDEX "practice_sets_topicId_idx"  ON "practice_sets"("topicId");
CREATE INDEX "practice_sets_lessonId_idx" ON "practice_sets"("lessonId");

-- ─── Sessions & attempts ──────────────────────────────────────────────────────

CREATE TABLE "practice_sessions" (
  "id"              TEXT             NOT NULL,
  "userId"          TEXT             NOT NULL,
  "practiceSetId"   TEXT             NOT NULL,
  "lessonId"        TEXT,
  "mode"            "PracticeMode"   NOT NULL,
  "startedAt"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"     TIMESTAMP(3),
  "xpEarned"        INTEGER          NOT NULL DEFAULT 0,
  "accuracyPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "questionsCount"  INTEGER          NOT NULL DEFAULT 0,
  CONSTRAINT "practice_sessions_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "practice_sessions_userId_fkey"       FOREIGN KEY ("userId")        REFERENCES "users"("id")         ON DELETE CASCADE,
  CONSTRAINT "practice_sessions_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "practice_sets"("id"),
  CONSTRAINT "practice_sessions_lessonId_fkey"    FOREIGN KEY ("lessonId")      REFERENCES "lessons"("id")
);
CREATE INDEX "practice_sessions_userId_completedAt_idx" ON "practice_sessions"("userId", "completedAt");
CREATE INDEX "practice_sessions_practiceSetId_idx"      ON "practice_sessions"("practiceSetId");

CREATE TABLE "question_attempts" (
  "id"               TEXT         NOT NULL,
  "sessionId"        TEXT         NOT NULL,
  "userId"           TEXT         NOT NULL,
  "topicId"          TEXT         NOT NULL,
  "practiceSetId"    TEXT         NOT NULL,
  "questionText"     TEXT         NOT NULL,
  "studentAnswer"    TEXT         NOT NULL,
  "correctAnswer"    TEXT         NOT NULL,
  "isCorrect"        BOOLEAN      NOT NULL,
  "hintsUsed"        INTEGER      NOT NULL DEFAULT 0,
  "explanationUsed"  BOOLEAN      NOT NULL DEFAULT false,
  "confidenceBefore" INTEGER,
  "confidenceAfter"  INTEGER,
  "timeSpentSeconds" INTEGER      NOT NULL,
  "misconceptionTag" TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_attempts_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "question_attempts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "practice_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "question_attempts_userId_fkey"   FOREIGN KEY ("userId")    REFERENCES "users"("id")             ON DELETE CASCADE,
  CONSTRAINT "question_attempts_topicId_fkey"  FOREIGN KEY ("topicId")   REFERENCES "topics"("id")
);
CREATE INDEX "question_attempts_sessionId_idx"          ON "question_attempts"("sessionId");
CREATE INDEX "question_attempts_userId_topicId_idx"     ON "question_attempts"("userId", "topicId");
CREATE INDEX "question_attempts_topicId_isCorrect_idx"  ON "question_attempts"("topicId", "isCorrect");
CREATE INDEX "question_attempts_misconceptionTag_idx"   ON "question_attempts"("misconceptionTag");

-- ─── Progress & mastery ───────────────────────────────────────────────────────

CREATE TABLE "topic_progress" (
  "id"                TEXT             NOT NULL,
  "userId"            TEXT             NOT NULL,
  "topicId"           TEXT             NOT NULL,
  "masteryScore"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "accuracyRate"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "completionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isUnlocked"        BOOLEAN          NOT NULL DEFAULT false,
  "isMastered"        BOOLEAN          NOT NULL DEFAULT false,
  "lastPracticedAt"   TIMESTAMP(3),
  "updatedAt"         TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "topic_progress_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "topic_progress_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "users"("id")  ON DELETE CASCADE,
  CONSTRAINT "topic_progress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id")
);
CREATE UNIQUE INDEX "topic_progress_userId_topicId_key"          ON "topic_progress"("userId", "topicId");
CREATE        INDEX "topic_progress_userId_isMastered_idx"       ON "topic_progress"("userId", "isMastered");
CREATE        INDEX "topic_progress_userId_lastPracticedAt_idx"  ON "topic_progress"("userId", "lastPracticedAt");

CREATE TABLE "lesson_progress" (
  "id"            TEXT             NOT NULL,
  "userId"        TEXT             NOT NULL,
  "lessonId"      TEXT             NOT NULL,
  "topicId"       TEXT             NOT NULL,
  "isStarted"     BOOLEAN          NOT NULL DEFAULT true,
  "isCompleted"   BOOLEAN          NOT NULL DEFAULT false,
  "completedAt"   TIMESTAMP(3),
  "lastScore"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "attemptsCount" INTEGER          NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lesson_progress_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "lesson_progress_userId_fkey"  FOREIGN KEY ("userId")   REFERENCES "users"("id")    ON DELETE CASCADE,
  CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");
CREATE        INDEX "lesson_progress_userId_topicId_idx"  ON "lesson_progress"("userId", "topicId");

-- ─── Learning memory ──────────────────────────────────────────────────────────

CREATE TABLE "topic_mistake_patterns" (
  "id"         TEXT         NOT NULL,
  "userId"     TEXT         NOT NULL,
  "topicId"    TEXT         NOT NULL,
  "tag"        TEXT         NOT NULL,
  "count"      INTEGER      NOT NULL DEFAULT 1,
  "isResolved" BOOLEAN      NOT NULL DEFAULT false,
  "resolvedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "topic_mistake_patterns_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "topic_mistake_patterns_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "users"("id")  ON DELETE CASCADE,
  CONSTRAINT "topic_mistake_patterns_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "topic_mistake_patterns_userId_topicId_tag_key" ON "topic_mistake_patterns"("userId", "topicId", "tag");
CREATE        INDEX "topic_mistake_patterns_userId_isResolved_idx"  ON "topic_mistake_patterns"("userId", "isResolved");
CREATE        INDEX "topic_mistake_patterns_topicId_tag_idx"        ON "topic_mistake_patterns"("topicId", "tag");

CREATE TABLE "student_memory_snapshots" (
  "id"          TEXT         NOT NULL,
  "userId"      TEXT         NOT NULL,
  "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "snapshot"    JSONB        NOT NULL,
  CONSTRAINT "student_memory_snapshots_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "student_memory_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "student_memory_snapshots_userId_key" ON "student_memory_snapshots"("userId");

-- ─── Gamification ─────────────────────────────────────────────────────────────

CREATE TABLE "xp_events" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "amount"    INTEGER      NOT NULL,
  "reason"    "XPReason"   NOT NULL,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "xp_events_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "xp_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "xp_events_userId_createdAt_idx" ON "xp_events"("userId", "createdAt");

CREATE TABLE "badges" (
  "id"          TEXT            NOT NULL,
  "code"        TEXT            NOT NULL,
  "title"       TEXT            NOT NULL,
  "description" TEXT            NOT NULL,
  "iconUrl"     TEXT,
  "category"    "BadgeCategory" NOT NULL,
  "xpReward"    INTEGER         NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "badges_code_key"     ON "badges"("code");
CREATE        INDEX "badges_category_idx" ON "badges"("category");

CREATE TABLE "student_badges" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "badgeId"   TEXT         NOT NULL,
  "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_badges_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "student_badges_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "users"("id")   ON DELETE CASCADE,
  CONSTRAINT "student_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id")
);
CREATE UNIQUE INDEX "student_badges_userId_badgeId_key" ON "student_badges"("userId", "badgeId");
CREATE        INDEX "student_badges_userId_idx"          ON "student_badges"("userId");

CREATE TABLE "daily_quests" (
  "id"          TEXT          NOT NULL,
  "title"       TEXT          NOT NULL,
  "description" TEXT          NOT NULL,
  "xpReward"    INTEGER       NOT NULL,
  "questType"   "QuestType"   NOT NULL DEFAULT 'daily',
  "difficulty"  "Difficulty"  NOT NULL DEFAULT 'intermediate',
  "targetValue" INTEGER       NOT NULL DEFAULT 1,
  "trackingKey" TEXT          NOT NULL,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_quests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "daily_quests_questType_difficulty_idx" ON "daily_quests"("questType", "difficulty");

CREATE TABLE "student_quest_progress" (
  "id"            TEXT          NOT NULL,
  "userId"        TEXT          NOT NULL,
  "questId"       TEXT          NOT NULL,
  "status"        "QuestStatus" NOT NULL DEFAULT 'active',
  "progressValue" INTEGER       NOT NULL DEFAULT 0,
  "completedAt"   TIMESTAMP(3),
  "expiresAt"     TIMESTAMP(3)  NOT NULL,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_quest_progress_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "student_quest_progress_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "users"("id")        ON DELETE CASCADE,
  CONSTRAINT "student_quest_progress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "daily_quests"("id")
);
CREATE UNIQUE INDEX "student_quest_progress_userId_questId_expiresAt_key" ON "student_quest_progress"("userId", "questId", "expiresAt");
CREATE        INDEX "student_quest_progress_userId_status_idx"             ON "student_quest_progress"("userId", "status");
CREATE        INDEX "student_quest_progress_expiresAt_idx"                 ON "student_quest_progress"("expiresAt");
