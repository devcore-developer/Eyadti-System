-- CreateTable
CREATE TABLE "drug_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "category" TEXT,
    "form" TEXT,
    "dosage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drug_masters_name_idx" ON "drug_masters"("name");

-- CreateIndex
CREATE INDEX "drug_masters_genericName_idx" ON "drug_masters"("genericName");

-- CreateIndex
CREATE UNIQUE INDEX "drug_masters_name_dosage_key" ON "drug_masters"("name", "dosage");
