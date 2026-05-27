-- CreateTable
CREATE TABLE "complaint_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosis_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosis_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaint_masters_name_key" ON "complaint_masters"("name");

-- CreateIndex
CREATE INDEX "complaint_masters_name_idx" ON "complaint_masters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosis_masters_name_key" ON "diagnosis_masters"("name");

-- CreateIndex
CREATE INDEX "diagnosis_masters_name_idx" ON "diagnosis_masters"("name");
