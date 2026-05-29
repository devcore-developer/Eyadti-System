"use server"

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions" // ← استخدمنا الدالة الجديدة
import { patientCreateSchema, patientUpdateSchema } from "@/lib/validations/patient"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { Gender } from "@prisma/client"
import { notifyPatientCreated } from "@/lib/notifications/events"
import { enforceUsageLimit } from "@/lib/services/usage-limits"
import { auditLog } from "@/lib/services/audit"

// ─── Create Patient ──────────────────────────────────
export async function createPatient(formData: FormData): Promise<ActionResult> {
  try {
    // ✅ مسموح للأدمين والدكتور والريسبشن (والسوبر أدمن بيعدي من غير سؤال)
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
        clinicId: clinicId, // ← استخدام الـ clinicId الجاهز
      },
    })

    if (patient) {
      await notifyPatientCreated(patient.id, patient.fullName, clinicId, userId)

      await auditLog({
        clinicId: clinicId,
        userId: userId,
        action: "CREATE",
        entityType: "PATIENT",
        entityId: patient.id,
        newValues: patient,
      })
    }
  } catch (error: any) {
    // لو الـ requireRole رمى Error، هنرجعه للفرونت عشان يظهره
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: error.message || "Failed to create patient." }
  }

  revalidatePath("/patients")
  return { success: true }
}

// ─── Update Patient ──────────────────────────────────
export async function updatePatient(
  patientId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    // ✅ مسموح للأدمين والدكتور (والسوبر أدمن)
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR")

    const existing = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: clinicId },
    })
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
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
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

    await auditLog({
      clinicId: clinicId,
      userId: userId,
      action: "UPDATE",
      entityType: "PATIENT",
      entityId: patientId,
      oldValues: existing,
      newValues: updatedPatient,
    })
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
    // ✅ مسموح للأدمين بس (والسوبر أدمن)
    const { clinicId, userId } = await requireRole("ADMIN")

    const existing = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: clinicId },
    })
    if (!existing) return { success: false, error: "Patient not found" }

    await prisma.patient.delete({
      where: { id: patientId },
    })

    await auditLog({
      clinicId: clinicId,
      userId: userId,
      action: "DELETE",
      entityType: "PATIENT",
      entityId: patientId,
      oldValues: existing,
    })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: "Cannot delete patient." }
  }

  revalidatePath("/patients")
  return { success: true }
}