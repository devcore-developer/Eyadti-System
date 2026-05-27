"use server"

import { Gender } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { notifyPatientCreated } from "@/lib/notifications/events"

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