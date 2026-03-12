-- Migration: add_ai_assigned_topics
-- Adds AI-driven topic assignment fields to StudentProfile.
--
-- aiAssignedTopics   – JSON array of topicId strings in AI-recommended
--                      practice order. Updated on grade change, session
--                      completion, and first Practice hub load.
-- aiAssignedTopicsAt – Timestamp of the last AI assignment run. NULL
--                      means topics have never been generated for this user.

ALTER TABLE "StudentProfile"
  ADD COLUMN IF NOT EXISTS "aiAssignedTopics"   JSONB    NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "aiAssignedTopicsAt" TIMESTAMP(3);
