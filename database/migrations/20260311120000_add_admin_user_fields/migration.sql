-- Migration: add_admin_user_fields
-- Adds soft-disable support and last-login tracking to the users table.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "isActive"       BOOLEAN   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "disabledAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "disabledReason" TEXT,
  ADD COLUMN IF NOT EXISTS "lastLoginAt"    TIMESTAMP(3);

-- Index for fast admin queries filtering by active status
CREATE INDEX IF NOT EXISTS "users_isActive_idx" ON "users"("isActive");
