"use server"

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import { galleryItemCreateSchema } from "@/lib/validations/gallery"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"

export async function getPatientGallery(patientId: string) {
  const { clinicId } = await requireRole("ADMIN", "DOCTOR", "RECEPTIONIST", "SUPER_ADMIN")
  
  return await prisma.galleryItem.findMany({
    where: { patientId, clinicId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createGalleryItem(patientId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("ADMIN", "DOCTOR", "RECEPTIONIST", "SUPER_ADMIN")

    // التأكد إن المريض تبع العيادة
    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
    if (!patient) return { success: false, error: "Patient not found in your clinic." }

    const raw = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      beforeImageUrl: formData.get("beforeImageUrl") as string,
      afterImageUrl: formData.get("afterImageUrl") as string,
    }

    const validated = galleryItemCreateSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation failed" }
    }

    await prisma.galleryItem.create({
      data: {
        ...validated.data,
        patientId,
        clinicId,
      },
    })

    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Failed to add gallery item." }
  }
}

export async function deleteGalleryItem(id: string, patientId: string): Promise<ActionResult> {
  try {
    const { clinicId } = await requireRole("ADMIN", "DOCTOR", "SUPER_ADMIN")

    const item = await prisma.galleryItem.findFirst({ where: { id, clinicId } })
    if (!item) return { success: false, error: "Item not found" }

    await prisma.galleryItem.delete({ where: { id } })

    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete item." }
  }
}