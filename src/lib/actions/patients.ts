"use server"

import { allergySchema, medicalHistorySchema, surgicalHistorySchema } from "@/lib/validations/patient"
import { Gender } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { notifyPatientCreated } from "@/lib/notifications/events"
import { auditLog } from "@/lib/services/audit"


// ── Create Patient ───────────────────────────────────

export async function createPatient(formData: FormData): Promise<ActionResult> {
  let session
  try {
    session = await requireRole("ADMIN", "RECEPTIONIST")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") {
      return { success: false, error: "Not authenticated" }
    }
    if ((error as any)?.name === "AuthorizationError") {
      return { success: false, error: "Not authorized" }
    }
    console.error(error)
    return { success: false, error: "Something went wrong" }
  }

  const raw = {
    fullName: formData.get("fullName") as string,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || null,
    gender: formData.get("gender") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    address: (formData.get("address") as string) || null,
  }

  if (!raw.fullName || !raw.phone || !raw.gender || !raw.dateOfBirth) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        fullName: raw.fullName,
        phone: raw.phone,
        email: raw.email,
        gender: raw.gender as Gender,
        dateOfBirth: new Date(raw.dateOfBirth),
        address: raw.address,
        clinicId: session.clinicId,
      },
    })

    // ← إرسال إشعار بإنشاء مريض جديد
    if (patient) {
      await notifyPatientCreated(
        patient.id,
        patient.fullName,
        session.clinicId,
        session.userId
      )
    }

    revalidatePath("/patients")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to create patient" }
  }
}

// ── Update Patient ───────────────────────────────────

export async function updatePatient(patientId: string, formData: FormData): Promise<ActionResult> {
  let session
  try {
    session = await requireRole("ADMIN", "DOCTOR")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") {
      return { success: false, error: "Not authenticated" }
    }
    if ((error as any)?.name === "AuthorizationError") {
      return { success: false, error: "Not authorized" }
    }
    console.error(error)
    return { success: false, error: "Something went wrong" }
  }

  const raw = {
    fullName: formData.get("fullName") as string,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || null,
    gender: formData.get("gender") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    address: (formData.get("address") as string) || null,
  }

  if (!raw.fullName || !raw.phone || !raw.gender || !raw.dateOfBirth) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    const existing = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.clinicId },
    })
    if (!existing) {
      return { success: false, error: "Patient not found" }
    }

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        fullName: raw.fullName,
        phone: raw.phone,
        email: raw.email,
        gender: raw.gender as Gender,
        dateOfBirth: new Date(raw.dateOfBirth),
        address: raw.address,
      },
    })

    revalidatePath("/patients")
    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update patient" }
  }
}

// ── Delete Patient ───────────────────────────────────

export async function deletePatient(patientId: string): Promise<ActionResult> {
  let session
  try {
    session = await requireRole("ADMIN")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") {
      return { success: false, error: "Not authenticated" }
    }
    if ((error as any)?.name === "AuthorizationError") {
      return { success: false, error: "Not authorized" }
    }
    console.error(error)
    return { success: false, error: "Something went wrong" }
  }

  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.clinicId },
    })
    if (!patient) {
      return { success: false, error: "Patient not found" }
    }

    await prisma.patient.delete({ where: { id: patientId } })

    revalidatePath("/patients")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to delete patient" }
  }
}
// ... الكود القديم بتاعك (createPatient, updatePatient, deletePlayer) فضل موجود ...

// ── Search Patient (For Reception) ───────────────────
export async function searchPatients(query: string, clinicId: string) {
  if (!query || query.length < 2) return []
  
  return prisma.patient.findMany({
    where: {
      clinicId,
      OR: [
        { phone: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, fullName: true, phone: true, gender: true, dateOfBirth: true },
    take: 5,
  })
}
// ─── Add Allergy ──────────────────────────────────
export async function addAllergy(patientId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR")
    
    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
    if (!patient) return { success: false, error: "Patient not found" }

    const raw = {
      allergen: formData.get("allergen") as string,
      reaction: (formData.get("reaction") as string) || undefined,
      severity: (formData.get("severity") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    }

    const validated = allergySchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as any }

    const allergy = await prisma.patientAllergy.create({
      data: { ...validated.data, patientId }
    })

    await auditLog({ clinicId, userId, action: "CREATE", entityType: "ALLERGY", entityId: allergy.id, newValues: allergy })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    return { success: false, error: "Failed to add allergy." }
  }
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}

// ─── Add Medical History ──────────────────────────
export async function addMedicalHistory(patientId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR")
    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
    if (!patient) return { success: false, error: "Patient not found" }

    const raw = {
      condition: formData.get("condition") as string,
      status: (formData.get("status") as string) || undefined,
      diagnosedAt: (formData.get("diagnosedAt") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    }

    const validated = medicalHistorySchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as any }

    const history = await prisma.patientMedicalHistory.create({
      data: { ...validated.data, patientId, diagnosedAt: validated.data.diagnosedAt ? new Date(validated.data.diagnosedAt) : null }
    })

    await auditLog({ clinicId, userId, action: "CREATE", entityType: "MEDICAL_HISTORY", entityId: history.id, newValues: history })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    return { success: false, error: "Failed to add medical history." }
  }
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}

// ─── Add Surgical History ──────────────────────────
export async function addSurgicalHistory(patientId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR")
    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
    if (!patient) return { success: false, error: "Patient not found" }

    const raw = {
      procedure: formData.get("procedure") as string,
      performedAt: (formData.get("performedAt") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    }

    const validated = surgicalHistorySchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as any }

    const surgery = await prisma.patientSurgicalHistory.create({
      data: { ...validated.data, patientId, performedAt: validated.data.performedAt ? new Date(validated.data.performedAt) : null }
    })

    await auditLog({ clinicId, userId, action: "CREATE", entityType: "SURGICAL_HISTORY", entityId: surgery.id, newValues: surgery })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    return { success: false, error: "Failed to add surgical history." }
  }
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}