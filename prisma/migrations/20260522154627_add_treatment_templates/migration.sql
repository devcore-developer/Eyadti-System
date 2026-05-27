-- CreateTable
CREATE TABLE "treatment_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "specialty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treatment_templates_title_idx" ON "treatment_templates"("title");
