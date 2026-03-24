-- CreateTable: concept_images cache
CREATE TABLE IF NOT EXISTS "concept_images" (
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
CREATE INDEX IF NOT EXISTS "concept_images_conceptKey_idx" ON "concept_images"("conceptKey");

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "concept_images_conceptKey_grade_key" ON "concept_images"("conceptKey", "grade");
