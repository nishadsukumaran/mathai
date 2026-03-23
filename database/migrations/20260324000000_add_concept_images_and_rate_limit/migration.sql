-- AlterTable: add image generation rate limit fields to student_profiles
ALTER TABLE "student_profiles" ADD COLUMN "imageGensToday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "student_profiles" ADD COLUMN "imageGenDate" TIMESTAMP(3);

-- CreateTable: concept_images cache
CREATE TABLE "concept_images" (
    "id" TEXT NOT NULL,
    "conceptKey" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "concept_images_conceptKey_idx" ON "concept_images"("conceptKey");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "concept_images_conceptKey_grade_key" ON "concept_images"("conceptKey", "grade");
