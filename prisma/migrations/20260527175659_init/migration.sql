/*
  Warnings:

  - You are about to drop the `complaint_masters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `diagnosis_masters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drug_masters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visit_complaints` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visit_diagnoses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visit_treatment_plans` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InvoiceStatus" ADD VALUE 'OVERDUE';
ALTER TYPE "InvoiceStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "visit_complaints" DROP CONSTRAINT "visit_complaints_visitId_fkey";

-- DropForeignKey
ALTER TABLE "visit_diagnoses" DROP CONSTRAINT "visit_diagnoses_visitId_fkey";

-- DropForeignKey
ALTER TABLE "visit_treatment_plans" DROP CONSTRAINT "visit_treatment_plans_visitId_fkey";

-- AlterTable
ALTER TABLE "clinics" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "tax" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "appointmentDuration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "maxDailyAppointments" INTEGER NOT NULL DEFAULT 20;

-- DropTable
DROP TABLE "complaint_masters";

-- DropTable
DROP TABLE "diagnosis_masters";

-- DropTable
DROP TABLE "drug_masters";

-- DropTable
DROP TABLE "visit_complaints";

-- DropTable
DROP TABLE "visit_diagnoses";

-- DropTable
DROP TABLE "visit_treatment_plans";

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitComplaint" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,

    CONSTRAINT "VisitComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitDiagnosis" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "severity" TEXT,
    "notes" TEXT,

    CONSTRAINT "VisitDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitTreatmentPlan" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "treatmentId" TEXT,

    CONSTRAINT "VisitTreatmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "genericName" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icd10Code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_clinicId_idx" ON "payments"("clinicId");

-- CreateIndex
CREATE INDEX "payments_branchId_idx" ON "payments"("branchId");

-- CreateIndex
CREATE INDEX "payments_recordedById_idx" ON "payments"("recordedById");

-- CreateIndex
CREATE INDEX "payments_method_idx" ON "payments"("method");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "VisitComplaint_visitId_idx" ON "VisitComplaint"("visitId");

-- CreateIndex
CREATE INDEX "medications_tradeName_idx" ON "medications"("tradeName");

-- CreateIndex
CREATE INDEX "medications_genericName_idx" ON "medications"("genericName");

-- CreateIndex
CREATE INDEX "Diagnosis_name_idx" ON "Diagnosis"("name");

-- CreateIndex
CREATE INDEX "Complaint_name_idx" ON "Complaint"("name");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitComplaint" ADD CONSTRAINT "VisitComplaint_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitComplaint" ADD CONSTRAINT "VisitComplaint_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitDiagnosis" ADD CONSTRAINT "VisitDiagnosis_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitDiagnosis" ADD CONSTRAINT "VisitDiagnosis_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitTreatmentPlan" ADD CONSTRAINT "VisitTreatmentPlan_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
