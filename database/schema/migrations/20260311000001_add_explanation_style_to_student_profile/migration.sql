-- CreateEnum
CREATE TYPE "ExplanationStyle" AS ENUM ('visual', 'step_by_step', 'story', 'analogy', 'direct');

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN "preferredExplanationStyle" "ExplanationStyle" NOT NULL DEFAULT 'visual';
