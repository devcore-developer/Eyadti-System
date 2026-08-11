"use server"

import { allergySchema, medicalHistorySchema, surgicalHistorySchema } from "@/lib/validations/patient"
import { patientCreateSchema, patientUpdateSchema } from "@/lib/validations/patient"
import { Gender } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { notifyPatientCreated } from "@/lib/notifications/events"
import { enforceUsageLimit } from "@/lib/services/usage-limits"
import { auditLog } from "@/lib/services/audit"

// ─── Search Patient (For Reception) ───────────────────
// FIX: Changed to use requireRole() to extract clinicId securely from session
export async function searchPatients(query: string): Promise<ActionResult<{ id: string; phone: string; fullName: string; gender: string; dateOfBirth: Date }[]>> {
  try {
    const { clinicId } = await requireRole("ADMIN", "DOCTOR", "RECEPTIONIST")
    
    if (!query || query.length < 2) return { success: true, data: [] }
    
    const patients = await prisma.patient.findMany({
      where: {
        clinicId,
        // ═══ صريح: لا نستبعد أي مريض ═══
        // إذا كان هناك حقل status، نضمن إرجاع النشط فقط
        // لكن لا نفلتر بناءً على الزيارات أو المواعيد
        OR: [
          { phone: { contains: query, mode: "insensitive" } },
          { fullName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { 
        id: true, 
        fullName: true, 
        phone: true, 
        gender: true, 
        dateOfBirth: true,
        // ═══ أضف هذا مؤقتاً للتشخيص ═══
        // إذا كان هناك حقل status أو isArchived، ستبين هنا
        // status: true,
        // isArchived: true,
        // deletedAt: true,
      },
      orderBy: { fullName: "asc" },
      take: 10, // زودناها من 5 لـ 10
    })

    console.log(`[searchPatients] query="${query}" found=${patients.length} clinicId=${clinicId}`)
    
    return { success: true, data: patients }
  } catch (error: any) {
    console.error("[searchPatients] ERROR:", error)
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    return { success: false, error: "Failed to search patients." }
  }
}

// ─── Create Patient ──────────────────────────────────
export async function createPatient(formData: FormData): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR", "RECEPTIONIST")

    const raw = {
      fullName: formData.get("fullName") as string,
      phone: (formData.get("phone") as string) || "",
      email: (formData.get("email") as string) || "",
      gender: (formData.get("gender") as string) || "",
      dateOfBirth: (formData.get("dateOfBirth") as string) || "",
      address: (formData.get("address") as string) || "",
    }

    const validated = patientCreateSchema.safeParse(raw)
    if (!validated.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    await enforceUsageLimit(clinicId, "PATIENTS")

    const patient = await prisma.patient.create({
      data: {
        fullName: validated.data.fullName.trim(),
        phone: validated.data.phone.trim(),
        email: validated.data.email?.trim() || null,
        gender: validated.data.gender as Gender,
        dateOfBirth: new Date(validated.data.dateOfBirth),
        address: validated.data.address?.trim() || null,
        clinicId: clinicId,
      },
    })

    if (patient) {
      await notifyPatientCreated(patient.id, patient.fullName, clinicId, userId)
      await auditLog({ clinicId, userId, action: "CREATE", entityType: "PATIENT", entityId: patient.id, newValues: patient })
    }
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: error.message || "Failed to create patient." }
  }

  revalidatePath("/patients")
  return { success: true }
}

// ─── Update Patient ──────────────────────────────────
export async function updatePatient(patientId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR")

    const existing = await prisma.patient.findFirst({ where: { id: patientId, clinicId: clinicId } })
    if (!existing) return { success: false, error: "Patient not found" }

    const raw = {
      fullName: formData.get("fullName") as string,
      phone: (formData.get("phone") as string) || "",
      email: (formData.get("email") as string) || "",
      gender: (formData.get("gender") as string) || "",
      dateOfBirth: (formData.get("dateOfBirth") as string) || "",
      address: (formData.get("address") as string) || "",
    }

    const validated = patientUpdateSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        fullName: validated.data.fullName.trim(),
        phone: validated.data.phone.trim(),
        email: validated.data.email?.trim() || null,
        gender: validated.data.gender as Gender,
        dateOfBirth: new Date(validated.data.dateOfBirth),
        address: validated.data.address?.trim() || null,
      },
    })

    await auditLog({ clinicId, userId, action: "UPDATE", entityType: "PATIENT", entityId: patientId, oldValues: existing, newValues: updatedPatient })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: "Failed to update patient." }
  }

  revalidatePath("/patients")
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}

// ─── Delete Patient ──────────────────────────────────
export async function deletePatient(patientId: string): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("SUPER_ADMIN", "ADMIN")

    const existing = await prisma.patient.findFirst({ where: { id: patientId, clinicId: clinicId } })
    if (!existing) return { success: false, error: "Patient not found" }

    await prisma.patient.delete({ where: { id: patientId } })

    await auditLog({ clinicId, userId, action: "DELETE", entityType: "PATIENT", entityId: patientId, oldValues: existing })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: "Cannot delete patient." }
  }

  revalidatePath("/patients")
  return { success: true }
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
    // Prevent duplicate allergy for same patient
    const existingAllergy = await prisma.patientAllergy.findFirst({
      where: { patientId, allergen: validated.data.allergen }
    })
    if (existingAllergy) {
      return { success: false, error: "This allergy is already recorded for this patient." }
    }
    const allergy = await prisma.patientAllergy.create({ data: { ...validated.data, patientId } })
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
    const existingHistory = await prisma.patientMedicalHistory.findFirst({
      where: { patientId, condition: validated.data.condition }
    })
    if (existingHistory) {
      return { success: false, error: "This condition is already recorded for this patient." }
    }
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
    const existingSurgery = await prisma.patientSurgicalHistory.findFirst({
      where: { patientId, procedure: validated.data.procedure }
    })
    if (existingSurgery) {
      return { success: false, error: "This procedure is already recorded for this patient." }
    }
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

// ─── Delete Allergy ────────────────────────────────
export async function deleteAllergy(allergyId: string, patientId: string): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR")

    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
    if (!patient) return { success: false, error: "Patient not found" }

    const allergy = await prisma.patientAllergy.findFirst({ where: { id: allergyId, patientId } })
    if (!allergy) return { success: false, error: "Allergy record not found" }

    await prisma.patientAllergy.delete({ where: { id: allergyId } })
    await auditLog({ clinicId, userId, action: "DELETE", entityType: "ALLERGY", entityId: allergyId, oldValues: allergy })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    return { success: false, error: "Failed to remove allergy." }
  }
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}

// ─── Delete Medical History ────────────────────────
export async function deleteMedicalHistory(historyId: string, patientId: string): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR")

    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
    if (!patient) return { success: false, error: "Patient not found" }

    const history = await prisma.patientMedicalHistory.findFirst({ where: { id: historyId, patientId } })
    if (!history) return { success: false, error: "Medical history record not found" }

    await prisma.patientMedicalHistory.delete({ where: { id: historyId } })
    await auditLog({ clinicId, userId, action: "DELETE", entityType: "MEDICAL_HISTORY", entityId: historyId, oldValues: history })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    return { success: false, error: "Failed to remove medical history." }
  }
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}

// ─── Delete Surgical History ───────────────────────
export async function deleteSurgicalHistory(surgeryId: string, patientId: string): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR")

    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
    if (!patient) return { success: false, error: "Patient not found" }

    const surgery = await prisma.patientSurgicalHistory.findFirst({ where: { id: surgeryId, patientId } })
    if (!surgery) return { success: false, error: "Surgical history record not found" }

    await prisma.patientSurgicalHistory.delete({ where: { id: surgeryId } })
    await auditLog({ clinicId, userId, action: "DELETE", entityType: "SURGICAL_HISTORY", entityId: surgeryId, oldValues: surgery })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    return { success: false, error: "Failed to remove surgical history." }
  }
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}