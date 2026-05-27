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

  console.log("📝 Visit form data:", {
    patientId: raw.patientId ? "✅" : "❌",
    doctorId: raw.doctorId ? "✅" : "❌",
    visitDate: raw.visitDate ? "✅" : "❌",
    complaints: raw.complaints.length,
    diagnoses: raw.diagnoses.length,
    treatmentPlans: raw.treatmentPlans.length,
  })

  const parsed = VisitSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    console.error("❌ Validation errors:", JSON.stringify(fieldErrors, null, 2))
    
    // بنجيب أول خطأ واضح
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
    await prisma.visit.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: parsed.data.patientId,
        doctorId: parsed.data.doctorId,
        visitDate: new Date(parsed.data.visitDate),
        notes: parsed.data.notes || null,
        complaints: {
          create: parsed.data.complaints.map(c => ({ complaint: c })),
        },
        diagnoses: {
          create: parsed.data.diagnoses.map(d => ({ diagnosis: d })),
        },
        treatmentPlans: {
          create: parsed.data.treatmentPlans.map(t => ({ treatment: t })),
        },
      },
    })

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
        data: parsed.data.complaints.map(c => ({ visitId, complaint: c })),
      }),
      prisma.visitDiagnosis.createMany({
        data: parsed.data.diagnoses.map(d => ({ visitId, diagnosis: d })),
      }),
      prisma.visitTreatmentPlan.createMany({
        data: parsed.data.treatmentPlans.map(t => ({ visitId, treatment: t })),
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
      complaints: true,
      diagnoses: true,
      treatmentPlans: true,
      prescription: {
        include: {
          items: true,
        },
      },
    },
  })
}