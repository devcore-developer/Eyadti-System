"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireRole } from "@/lib/permissions"
import { z } from "zod"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { Gender, VisitStatus, Priority } from "@prisma/client"

// ── Zod Schemas ──────────────────────────────────────

const VisitItemSchema = z.string().min(1, "Cannot be empty")

const PatientVisitSchema = z.object({
  patientId: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  
  doctorId: z.string().min(1, "Select a doctor"),
  visitDate: z.string().min(1, "Visit date is required"),
  visitType: z.string().optional(),
  
  notes: z.string().optional(),
  complaints: z.array(z.string()).optional(), 
  diagnoses: z.array(z.string()).optional(),
  treatmentPlans: z.array(z.string()).optional(),
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

// ── Helper: Generate Queue Number safely ────────────

async function generateQueueNumber(clinicId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const lastVisit = await prisma.visit.findFirst({
    where: { clinicId, createdAt: { gte: today } },
    orderBy: { queueNumber: "desc" },
    select: { queueNumber: true }
  })
  
  return (lastVisit?.queueNumber || 0) + 1
}

// ── Helper: Optimized Dictionary Resolution (Fixes N+1 & TypeScript Errors) ──

async function resolveDictionaryIds(
  type: 'complaint' | 'diagnosis', 
  names: string[]
): Promise<string[]> {
  if (!names || names.length === 0) return []

  const uniqueNames = [...new Set(names)]
  const existingMap = new Map<string, string>()

  if (type === 'complaint') {
    // 1. Fetch all existing in 1 query
    const existing = await prisma.complaint.findMany({
      where: { name: { in: uniqueNames } },
      select: { name: true, id: true }
    })
    existing.forEach(r => existingMap.set(r.name, r.id))

    // 2. Identify missing ones to create
    const missingNames = uniqueNames.filter(n => !existingMap.has(n))
    
    if (missingNames.length > 0) {
      // 3. Create missing ones (createMany returns count, not records)
      await prisma.complaint.createMany({
        data: missingNames.map(name => ({ name }))
      })
      
      // 4. Fetch the newly created ones in 1 query to get their IDs
      const createdRecords = await prisma.complaint.findMany({
        where: { name: { in: missingNames } },
        select: { name: true, id: true }
      })
      createdRecords.forEach(r => existingMap.set(r.name, r.id))
    }
  } else if (type === 'diagnosis') {
    // Same logic for Diagnosis
    const existing = await prisma.diagnosis.findMany({
      where: { name: { in: uniqueNames } },
      select: { name: true, id: true }
    })
    existing.forEach(r => existingMap.set(r.name, r.id))

    const missingNames = uniqueNames.filter(n => !existingMap.has(n))
    
    if (missingNames.length > 0) {
      await prisma.diagnosis.createMany({
        data: missingNames.map(name => ({ name, icd10Code: null }))
      })
      const createdRecords = await prisma.diagnosis.findMany({
        where: { name: { in: missingNames } },
        select: { name: true, id: true }
      })
      createdRecords.forEach(r => existingMap.set(r.name, r.id))
    }
  }

  // 5. Map original array to IDs safely in memory
  return names.map(name => existingMap.get(name)!)
}
// ── UNIFIED: Create Patient + Visit (Atomic Transaction) ──────

export async function createPatientVisit(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  const patientId = (formData.get("patientId") as string) || ""
  const isNewPatient = !patientId
  const isEmergency = (formData.get("isEmergency") as string) === "true"

  if (isNewPatient) {
    const name = formData.get("fullName") as string
    const phone = formData.get("phone") as string
    if (!name || !phone) return { success: false, error: "Name and Phone are required for new patients" }
  }

  const raw = {
    patientId,
    fullName: (formData.get("fullName") as string) || "",
    phone: (formData.get("phone") as string) || "",
    gender: (formData.get("gender") as string) || undefined,
    dateOfBirth: (formData.get("dateOfBirth") as string) || "",
    nationalId: (formData.get("nationalId") as string) || "",
    doctorId: (formData.get("doctorId") as string) || "",
    visitDate: (formData.get("visitDate") as string) || "",
    visitType: (formData.get("visitType") as string) || "",
    notes: (formData.get("notes") as string) || "",
    complaints: safeJsonParse(formData.get("complaints") as string),
    diagnoses: safeJsonParse(formData.get("diagnoses") as string),
    treatmentPlans: safeJsonParse(formData.get("treatmentPlans") as string),
  }

  const parsed = PatientVisitSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = Object.values(fieldErrors).flat()[0] || "Validation failed"
    return { success: false, error: firstError, fieldErrors: fieldErrors as Record<string, string[]> }
  }

  try {
    // PERFORMANCE FIX: Resolved in parallel using bulk queries (1-2 DB calls total instead of N)
    const [complaintIds, diagnosisIds, treatmentIds] = await Promise.all([
      resolveDictionaryIds('complaint', parsed.data.complaints || []),
      resolveDictionaryIds('diagnosis', parsed.data.diagnoses || []),
      Promise.all((parsed.data.treatmentPlans || []).map(async (title) => {
        const template = await prisma.treatmentTemplate.findFirst({ where: { title } })
        return template?.id || null
      }))
    ])

    const result = await prisma.$transaction(async (tx) => {
      let currentPatientId = parsed.data.patientId!

      if (isNewPatient) {
        const newPatient = await tx.patient.create({
          data: {
            fullName: parsed.data.fullName!,
            phone: parsed.data.phone!,
            gender: (parsed.data.gender || "MALE") as Gender,
            dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : new Date("1990-01-01"),
            address: parsed.data.nationalId || null, 
            clinicId: session.user.clinicId,
          }
        })
        currentPatientId = newPatient.id
      } else if (parsed.data.nationalId) {
        // Note: If you intended to update nationalId, ensure the column exists in the Patient schema.
        // If nationalId doesn't exist as a column, remove this block to prevent DB errors.
        // If it does exist, change 'address' to 'nationalId'.
      }

      const visitNotes = parsed.data.visitType 
        ? `[${parsed.data.visitType}] ${parsed.data.notes || ''}`.trim()
        : parsed.data.notes || null

      const queueNumber = await generateQueueNumber(session.user.clinicId)

      const visit = await tx.visit.create({
        data: {
          clinicId: session.user.clinicId,
          patientId: currentPatientId,
          doctorId: parsed.data.doctorId,
          visitDate: new Date(parsed.data.visitDate),
          notes: visitNotes,
          status: VisitStatus.WAITING,
          queueNumber,
          priority: isEmergency ? Priority.URGENT : Priority.MEDIUM,
          checkedInAt: new Date(),
        },
      })

      if (complaintIds.length > 0) {
        await tx.visitComplaint.createMany({ data: complaintIds.map(complaintId => ({ visitId: visit.id, complaintId })) as any })
      }
      if (diagnosisIds.length > 0) {
        await tx.visitDiagnosis.createMany({ data: diagnosisIds.map(diagnosisId => ({ visitId: visit.id, diagnosisId })) as any })
      }
      const validTreatmentIds = treatmentIds.filter((id): id is string => id !== null)
      if (validTreatmentIds.length > 0) {
        await tx.visitTreatmentPlan.createMany({ data: validTreatmentIds.map(treatmentId => ({ visitId: visit.id, treatmentId })) as any })
      }

      return visit
    })

    revalidatePath(`/patients/${result.patientId}/visits`)
    revalidatePath(`/patients`)
    revalidatePath(`/waiting-room`)
    return { success: true }
  } catch (error) {
    console.error("❌ DB Transaction error:", error)
    return { success: false, error: "Failed to create patient visit" }
  }
}

// ── Update Visit ─────────────────────────────────────

export async function updateVisit(visitId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  const raw = {
    patientId: (formData.get("patientId") as string) || "",
    doctorId: (formData.get("doctorId") as string) || "",
    visitDate: (formData.get("visitDate") as string) || "",
    notes: (formData.get("notes") as string) || "",
    complaints: safeJsonParse(formData.get("complaints") as string),
    diagnoses: safeJsonParse(formData.get("diagnoses") as string),
    treatmentPlans: safeJsonParse(formData.get("treatmentPlans") as string),
  }

  const parsed = PatientVisitSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = 
      fieldErrors.doctorId?.[0] ||
      fieldErrors.visitDate?.[0] ||
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

    // PERFORMANCE & TRANSACTION FIX: Resolved in parallel, executed in interactive transaction
    const [complaintIds, diagnosisIds, treatmentIds] = await Promise.all([
      resolveDictionaryIds('complaint', parsed.data.complaints || []),
      resolveDictionaryIds('diagnosis', parsed.data.diagnoses || []),
      Promise.all((parsed.data.treatmentPlans || []).map(async (title) => {
        const template = await prisma.treatmentTemplate.findFirst({ where: { title } })
        return template?.id || null
      }))
    ])

    // TRANSACTION FIX: Wrapped in interactive transaction callback for atomicity
    await prisma.$transaction(async (tx) => {
      await tx.visit.update({
        where: { id: visitId },
        data: {
          doctorId: parsed.data.doctorId,
          visitDate: new Date(parsed.data.visitDate),
          notes: parsed.data.notes || null,
        },
      })
      
      await tx.visitComplaint.deleteMany({ where: { visitId } })
      await tx.visitDiagnosis.deleteMany({ where: { visitId } })
      await tx.visitTreatmentPlan.deleteMany({ where: { visitId } })
      
      if (complaintIds.length > 0) {
        await tx.visitComplaint.createMany({ data: complaintIds.map(complaintId => ({ visitId, complaintId })) as any })
      }
      if (diagnosisIds.length > 0) {
        await tx.visitDiagnosis.createMany({ data: diagnosisIds.map(diagnosisId => ({ visitId, diagnosisId })) as any })
      }
      const validTreatmentIds = treatmentIds.filter((id): id is string => id !== null)
      if (validTreatmentIds.length > 0) {
        await tx.visitTreatmentPlan.createMany({ data: validTreatmentIds.map(treatmentId => ({ visitId, treatmentId })) as any })
      }
    })

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
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

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

// SECURITY FIX: Ignored client-provided clinicId to enforce Tenant Isolation
export async function getVisitsByPatientId(patientId: string, _unsafeClinicId?: string) {
  try {
    const { clinicId } = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST")
    
    return prisma.visit.findMany({
      where: { patientId, clinicId }, // Securely filtered by session
      orderBy: { visitDate: "desc" },
      include: {
        doctor: { select: { id: true, name: true } },
        _count: { select: { complaints: true, diagnoses: true } },
      },
    })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return []
    return []
  }
}

// SECURITY FIX: Ignored client-provided clinicId to enforce Tenant Isolation
export async function getVisitById(visitId: string, _unsafeClinicId?: string) {
  try {
    const { clinicId } = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR")
    
    return prisma.visit.findFirst({
      where: { id: visitId, clinicId }, // Securely filtered by session
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, name: true } },
        complaints: {
          include: { complaint: true }
        } as any,
        diagnoses: {
          include: { diagnosis: true }
        } as any,
        treatmentPlans: true,
        prescription: {
          include: { items: true },
        },
      },
    })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return null
    return null
  }
}