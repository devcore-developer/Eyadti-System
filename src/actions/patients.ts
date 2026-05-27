"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { patientCreateSchema, patientUpdateSchema } from "@/lib/validations/patient"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { Gender } from "@prisma/client"
import { notifyPatientCreated } from "@/lib/notifications/events"
import { enforceUsageLimit } from "@/lib/services/usage-limits"
import { auditLog } from "@/lib/services/audit" // ← جديد

export async function createPatient(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }
    if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" }
    }

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

    await enforceUsageLimit(session.user.clinicId, "PATIENTS")

    const patient = await prisma.patient.create({
      data: {
        fullName: validated.data.fullName.trim(),
        phone: validated.data.phone.trim(),
        email: validated.data.email?.trim() || null,
        gender: validated.data.gender as Gender,
        dateOfBirth: new Date(validated.data.dateOfBirth),
        address: validated.data.address?.trim() || null,
        clinicId: session.user.clinicId,
      },
    })

    if (patient) {
      await notifyPatientCreated(
        patient.id,
        patient.fullName,
        session.user.clinicId,
        session.user.id
      )

      // ← Audit Log: تسجيل إنشاء مريض
      await auditLog({
        clinicId: session.user.clinicId,
        userId: session.user.id,
        action: "CREATE",
        entityType: "PATIENT",
        entityId: patient.id,
        newValues: patient,
      })
    }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || "Failed to create patient." }
  }

  revalidatePath("/patients")
  return { success: true }
}

export async function updatePatient(
  patientId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }
    if (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR") {
      return { success: false, error: "Forbidden" }
    }

    const existing = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
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

    // ← Audit Log: تسجيل تعديل بيانات مريض (القديمة والجديدة)
    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: "UPDATE",
      entityType: "PATIENT",
      entityId: patientId,
      oldValues: existing,
      newValues: updatedPatient,
    })
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update patient." }
  }

  revalidatePath("/patients")
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}

export async function deletePatient(patientId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }
    if (session.user.role !== "ADMIN") return { success: false, error: "Forbidden" }

    const existing = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
    })
    if (!existing) return { success: false, error: "Patient not found" }

    await prisma.patient.delete({
      where: { id: patientId },
    })

    // ← Audit Log: تسجيل حذف مريض
    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: "DELETE",
      entityType: "PATIENT",
      entityId: patientId,
      oldValues: existing,
    })
  } catch (error) {
    console.error(error)
    return { success: false, error: "Cannot delete patient." }
  }

  revalidatePath("/patients")
  return { success: true }
}