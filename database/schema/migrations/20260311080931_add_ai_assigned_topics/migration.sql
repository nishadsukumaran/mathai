-- Migration: add_ai_assigned_topics
-- Adds AI-driven topic assignment fields to student_profiles.
--
-- aiAssignedTopics   – JSON array of topicId strings in AI-recommended
--                      practice order. Updated on grade change, session
--                      completion, and first Practice hub load.
-- aiAssignedTopicsAt – Timestamp of the last AI assignment run. NULL
--                      means topics have never been generated for this user.
--
-- NOTE: The raw SQL file at database/migrations/20260311080931_add_ai_assigned_topics/
-- incorrectly referenced "StudentProfile" (the Prisma model name). The actual
-- PostgreSQL table is "student_profiles" per the @@map directive in schema.prisma.

ALTER TABLE "student_profiles"
  ADD COLUMN IF NOT EXISTS "aiAssignedTopics"   JSONB    NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "aiAssignedTopicsAt" TIMESTAMP(3);
