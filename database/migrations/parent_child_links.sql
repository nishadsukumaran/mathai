-- Migration: parent_child_links
-- Date: 2026-04-02
-- Description: Add parent-child account model with proper linking table and student profile extensions.
--
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/raenvmoefhuitxwnratf/sql

-- ─── 1. Create new enums ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "RelationshipType" AS ENUM ('guardian', 'mother', 'father', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LinkStatus" AS ENUM ('active', 'pending', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LoginMode" AS ENUM ('parent_managed', 'pin_only', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Create parent_child_links table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "parent_child_links" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL DEFAULT 'guardian',
    "status" "LinkStatus" NOT NULL DEFAULT 'active',
    "isPrimaryGuardian" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_child_links_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one active link per parent-child pair
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_parentId_childId_key" UNIQUE ("parentId", "childId");

-- Foreign keys
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_childId_fkey" FOREIGN KEY ("childId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for fast parent and child lookups
CREATE INDEX IF NOT EXISTS "parent_child_links_parentId_status_idx" ON "parent_child_links"("parentId", "status");
CREATE INDEX IF NOT EXISTS "parent_child_links_childId_status_idx" ON "parent_child_links"("childId", "status");

-- ─── 3. Extend student_profiles with new columns ────────────────────────────

-- Display name (child-friendly, may differ from User.name)
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "displayName" TEXT;

-- Curriculum framework (cambridge, ib, cbse, etc.)
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "curriculum" TEXT NOT NULL DEFAULT 'cambridge';

-- School name (optional)
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "schoolName" TEXT;

-- Parent's stated onboarding goal
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "onboardingGoal" TEXT;

-- How the child accesses MathAI
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "preferredLoginMode" "LoginMode" NOT NULL DEFAULT 'parent_managed';

-- Username for child direct login (unique)
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "username" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "student_profiles_username_key" ON "student_profiles"("username");

-- Hashed PIN for child direct login
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "hashedPin" TEXT;
