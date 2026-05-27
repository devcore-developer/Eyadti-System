"use server"
import "server-only"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/types"

// ── Zod Schemas ──────────────────────────────────────

const PrescriptionItemSchema = z.object({
  medicationName: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().optional(),
})

const PrescriptionSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  visitId: z.string().optional(),
  items: z.array(PrescriptionItemSchema).min(1, "At least one medication is required"),
})

// ── Helper ───────────────────────────────────────────

function safeJsonParse(str: string | null): any[] {
  if (!str) return []
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ── Create Prescription ──────────────────────────────

export async function createPrescription(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  const raw = {
    patientId: (formData.get("patientId") as string) || "",
    doctorId: (formData.get("doctorId") as string) || "",
    visitId: (formData.get("visitId") as string) || undefined,
    items: safeJsonParse(formData.get("items") as string),
  }

  const parsed = PrescriptionSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = 
      fieldErrors.patientId?.[0] ||
      fieldErrors.doctorId?.[0] ||
      fieldErrors.items?.[0] ||
      "Validation failed"
    return { success: false, error: firstError, fieldErrors: fieldErrors as Record<string, string[]> }
  }

  try {
    await prisma.prescription.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: parsed.data.patientId,
        doctorId: parsed.data.doctorId,
        visitId: parsed.data.visitId || null,
        items: {
          create: parsed.data.items,
        },
      },
    })

    revalidatePath(`/patients/${parsed.data.patientId}/prescriptions`)
    revalidatePath(`/patients/${parsed.data.patientId}`)
    return { success: true }
  } catch (error) {
    console.error("Create prescription error:", error)
    return { success: false, error: "Failed to create prescription" }
  }
}

// ── Update Prescription ──────────────────────────────

export async function updatePrescription(prescriptionId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  const raw = {
    patientId: (formData.get("patientId") as string) || "",
    doctorId: (formData.get("doctorId") as string) || "",
    visitId: (formData.get("visitId") as string) || undefined,
    items: safeJsonParse(formData.get("items") as string),
  }

  const parsed = PrescriptionSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: "Validation failed" }
  }

  try {
    const existing = await prisma.prescription.findFirst({
      where: { id: prescriptionId, clinicId: session.user.clinicId },
    })
    if (!existing) return { success: false, error: "Prescription not found" }

    if (session.user.role === "DOCTOR" && existing.doctorId !== session.user.id) {
      return { success: false, error: "You can only edit your own prescriptions" }
    }

    await prisma.$transaction([
      prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          doctorId: parsed.data.doctorId,
          visitId: parsed.data.visitId || null,
        },
      }),
      prisma.prescriptionItem.deleteMany({ where: { prescriptionId } }),
      prisma.prescriptionItem.createMany({
        data: parsed.data.items.map(item => ({ ...item, prescriptionId })),
      }),
    ])

    revalidatePath(`/patients/${parsed.data.patientId}/prescriptions`)
    revalidatePath(`/patients/${parsed.data.patientId}/prescriptions/${prescriptionId}`)
    return { success: true }
  } catch (error) {
    console.error("Update prescription error:", error)
    return { success: false, error: "Failed to update prescription" }
  }
}

// ── Delete Prescription ──────────────────────────────

export async function deletePrescription(prescriptionId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  try {
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, clinicId: session.user.clinicId },
      select: { id: true, doctorId: true, patientId: true },
    })
    if (!prescription) return { success: false, error: "Prescription not found" }

    if (session.user.role === "DOCTOR" && prescription.doctorId !== session.user.id) {
      return { success: false, error: "Forbidden" }
    }

    await prisma.prescription.delete({ where: { id: prescriptionId } })

    revalidatePath(`/patients/${prescription.patientId}/prescriptions`)
    revalidatePath(`/patients/${prescription.patientId}`)
    return { success: true }
  } catch (error) {
    console.error("Delete prescription error:", error)
    return { success: false, error: "Failed to delete prescription" }
  }
}

// ── Data Fetching ────────────────────────────────────

export async function getPrescriptionsByPatientId(patientId: string, clinicId: string) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId }, select: { id: true } })
  if (!patient) return []

  return prisma.prescription.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      doctor: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  })
}

export async function getPrescriptionById(prescriptionId: string, clinicId: string) {
  return prisma.prescription.findFirst({
    where: { id: prescriptionId, clinicId },
    include: {
      patient: { select: { id: true, fullName: true, phone: true } },
      doctor: { select: { id: true, name: true } },
      items: true,
      visit: { select: { id: true, visitDate: true } },
    },
  })
}