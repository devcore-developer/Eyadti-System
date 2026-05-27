"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"

// ── Zod Schemas ──────────────────────────────────────

const VisitItemSchema = z.string().min(1, "Cannot be empty")

const VisitSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  visitDate: z.string().min(1, "Visit date is required"),
  notes: z.string().optional(),
  complaints: z.array(VisitItemSchema).min(1, "At least one complaint is required"),
  diagnoses: z.array(VisitItemSchema).min(1, "At least one diagnosis is required"),
  treatmentPlans: z.array(VisitItemSchema).min(1, "At least one treatment plan is required"),
})

// ── Helper: Parse Form Data Safely ───────────────────

function safeJsonParse(str: string | null): string[] {
  if (!str) return []
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ── Helper: Get or Create IDs for Relations ──────────

async function getComplaintIds(names: string[]) {
  return Promise.all(
    names.map(async (name) => {
      let record = await prisma.complaint.findFirst({ where: { name } })
      if (!record) record = await prisma.complaint.create({ data: { name } })
      return record.id
    })
  )
}

async function getDiagnosisIds(names: string[]) {
  return Promise.all(
    names.map(async (name) => {
      let record = await prisma.diagnosis.findFirst({ where: { name } })
      if (!record) record = await prisma.diagnosis.create({ data: { name, icd10Code: null } })
      return record.id
    })
  )
}

async function getTreatmentIds(titles: string[]) {
  return Promise.all(
    titles.map(async (title) => {
      const template = await prisma.treatmentTemplate.findFirst({ where: { title } })
      return template?.id || null
    })
  )
}

// ── Create Visit ─────────────────────────────────────

export async function createVisit(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  const raw = {
    patientId: (formData.get("patientId") as string) || "",
    doctorId: (formData.get("doctorId") as string) || "",
    visitDate: (formData.get("visitDate") as string) || "",
    notes: (formData.get("notes") as string) || "",
    complaints: safeJsonParse(formData.get("complaints") as string),
    diagnoses: safeJsonParse(formData.get("diagnoses") as string),
    treatmentPlans: safeJsonParse(formData.get("treatmentPlans") as string),
  }

  const parsed = VisitSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = 
      fieldErrors.patientId?.[0] ||
      fieldErrors.doctorId?.[0] ||
      fieldErrors.visitDate?.[0] ||
      fieldErrors.complaints?.[0] ||
      fieldErrors.diagnoses?.[0] ||
      fieldErrors.treatmentPlans?.[0] ||
      "Validation failed"
    
    return { 
      success: false, 
      error: firstError,
      fieldErrors: fieldErrors as Record<string, string[]>
    }
  }

  try {
    const complaintIds = await getComplaintIds(parsed.data.complaints)
    const diagnosisIds = await getDiagnosisIds(parsed.data.diagnoses)
    const treatmentIds = await getTreatmentIds(parsed.data.treatmentPlans)

    // إنشاء الزيارة أولاً
    const visit = await prisma.visit.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: parsed.data.patientId,
        doctorId: parsed.data.doctorId,
        visitDate: new Date(parsed.data.visitDate),
        notes: parsed.data.notes || null,
      },
    })

    // ثم إضافة العلاقات بشكل منفصل لتجنب أخطاء TypeScript المعقدة
    if (complaintIds.length > 0) {
      await prisma.visitComplaint.createMany({
        data: complaintIds.map(complaintId => ({ visitId: visit.id, complaintId })) as any,
      })
    }
    if (diagnosisIds.length > 0) {
      await prisma.visitDiagnosis.createMany({
        data: diagnosisIds.map(diagnosisId => ({ visitId: visit.id, diagnosisId })) as any,
      })
    }
    if (treatmentIds.length > 0) {
      await prisma.visitTreatmentPlan.createMany({
        data: treatmentIds.map(treatmentId => ({ visitId: visit.id, treatmentId })) as any,
      })
    }

    revalidatePath(`/patients/${parsed.data.patientId}/visits`)
    revalidatePath(`/patients/${parsed.data.patientId}`)
    return { success: true }
  } catch (error) {
    console.error("❌ DB error:", error)
    return { success: false, error: "Failed to create visit" }
  }
}

// ── Update Visit ─────────────────────────────────────

export async function updateVisit(visitId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  const raw = {
    patientId: (formData.get("patientId") as string) || "",
    doctorId: (formData.get("doctorId") as string) || "",
    visitDate: (formData.get("visitDate") as string) || "",
    notes: (formData.get("notes") as string) || "",
    complaints: safeJsonParse(formData.get("complaints") as string),
    diagnoses: safeJsonParse(formData.get("diagnoses") as string),
    treatmentPlans: safeJsonParse(formData.get("treatmentPlans") as string),
  }

  const parsed = VisitSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = 
      fieldErrors.patientId?.[0] ||
      fieldErrors.doctorId?.[0] ||
      fieldErrors.visitDate?.[0] ||
      fieldErrors.complaints?.[0] ||
      fieldErrors.diagnoses?.[0] ||
      fieldErrors.treatmentPlans?.[0] ||
      "Validation failed"
    
    return { 
      success: false, 
      error: firstError,
      fieldErrors: fieldErrors as Record<string, string[]>
    }
  }

  try {
    const existing = await prisma.visit.findFirst({
      where: { id: visitId, clinicId: session.user.clinicId },
    })
    if (!existing) return { success: false, error: "Visit not found" }

    if (session.user.role === "DOCTOR" && existing.doctorId !== session.user.id) {
      return { success: false, error: "You can only edit your own visits" }
    }

    const complaintIds = await getComplaintIds(parsed.data.complaints)
    const diagnosisIds = await getDiagnosisIds(parsed.data.diagnoses)
    const treatmentIds = await getTreatmentIds(parsed.data.treatmentPlans)

    await prisma.$transaction([
      prisma.visit.update({
        where: { id: visitId },
        data: {
          doctorId: parsed.data.doctorId,
          visitDate: new Date(parsed.data.visitDate),
          notes: parsed.data.notes || null,
        },
      }),
      prisma.visitComplaint.deleteMany({ where: { visitId } }),
      prisma.visitDiagnosis.deleteMany({ where: { visitId } }),
      prisma.visitTreatmentPlan.deleteMany({ where: { visitId } }),
      prisma.visitComplaint.createMany({
        data: complaintIds.map(complaintId => ({ visitId, complaintId })) as any,
      }),
      prisma.visitDiagnosis.createMany({
        data: diagnosisIds.map(diagnosisId => ({ visitId, diagnosisId })) as any,
      }),
      prisma.visitTreatmentPlan.createMany({
        data: treatmentIds.map(treatmentId => ({ visitId, treatmentId })) as any,
      }),
    ])

    revalidatePath(`/patients/${parsed.data.patientId}/visits`)
    revalidatePath(`/patients/${parsed.data.patientId}/visits/${visitId}`)
    return { success: true }
  } catch (error) {
    console.error("❌ DB error:", error)
    return { success: false, error: "Failed to update visit" }
  }
}

// ── Delete Visit ─────────────────────────────────────

export async function deleteVisit(visitId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  try {
    const visit = await prisma.visit.findFirst({
      where: { id: visitId, clinicId: session.user.clinicId },
      select: { id: true, doctorId: true, patientId: true },
    })
    if (!visit) return { success: false, error: "Visit not found" }

    if (session.user.role === "DOCTOR" && visit.doctorId !== session.user.id) {
      return { success: false, error: "You can only delete your own visits" }
    }

    await prisma.visit.delete({ where: { id: visitId } })

    revalidatePath(`/patients/${visit.patientId}/visits`)
    revalidatePath(`/patients/${visit.patientId}`)
    return { success: true }
  } catch (error) {
    console.error("❌ DB error:", error)
    return { success: false, error: "Failed to delete visit" }
  }
}

// ── Data Fetching Helpers ────────────────────────────

export async function getVisitsByPatientId(patientId: string, clinicId: string) {
  return prisma.visit.findMany({
    where: { patientId, clinicId },
    orderBy: { visitDate: "desc" },
    include: {
      doctor: { select: { id: true, name: true } },
      _count: { select: { complaints: true, diagnoses: true } },
    },
  })
}

export async function getVisitById(visitId: string, clinicId: string) {
  return prisma.visit.findFirst({
    where: { id: visitId, clinicId },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, name: true } },
      complaints: {
        include: {
          complaint: true
        }
      } as any, // تجاوز خطأ TS المؤقت
      diagnoses: {
        include: {
          diagnosis: true
        }
      } as any, // تجاوز خطأ TS المؤقت
      treatmentPlans: true,
      prescription: {
        include: {
          items: true,
        },
      },
    },
  })
}