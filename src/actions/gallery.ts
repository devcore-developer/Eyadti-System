"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { requireFeature } from "@/lib/services/feature-gate"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"

// ✅ تم إضافة الفنكشن الناقصة اللي بتعملها الـ Page
export async function getPatientGallery(patientId: string) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return { success: false, error: "Unauthorized" } as ActionResult
    }

    const items = await prisma.galleryItem.findMany({
      where: { 
        patientId,
        clinicId: session.user.clinicId 
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, data: items } as ActionResult<any[]>
  } catch (error: any) {
    console.error("Get gallery error:", error)
    return { success: false, error: "Failed to fetch gallery items" } as ActionResult
  }
}

export async function createGalleryItem(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return { success: false, error: "Unauthorized" }
    }

    // ✅ Server-Side Block: التأكد من أن الخطة تدعم الـ Gallery
    await requireFeature(session.user.clinicId, "GALLERY")

    const patientId = formData.get("patientId") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const beforeImageUrlsJson = formData.get("beforeImageUrls") as string
    const afterImageUrlsJson = formData.get("afterImageUrls") as string

    if (!patientId) return { success: false, error: "Patient ID is required" }

    let beforeImageUrls: string[] = []
    let afterImageUrls: string[] = []

    try {
      beforeImageUrls = JSON.parse(beforeImageUrlsJson || "[]")
      afterImageUrls = JSON.parse(afterImageUrlsJson || "[]")
    } catch {
      return { success: false, error: "Invalid image data format" }
    }

    if (beforeImageUrls.length === 0 && afterImageUrls.length === 0) {
      return { success: false, error: "At least one before or after image is required" }
    }

    // التحقق من أن المريض تابع لنفس العيادة
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId }
    })

    if (!patient) {
      return { success: false, error: "Patient not found" }
    }

    await prisma.galleryItem.create({
      data: {
        clinicId: session.user.clinicId,
        patientId,
        title: title || null,
        description: description || null,
        beforeImageUrls,
        afterImageUrls,
      }
    })

    revalidatePath(`/patients/${patientId}`)
    return { success: true }

  } catch (error: any) {
    // ✅ تم إزالة upgradeRequired عشان الـ Type مش بيقبلها، رسالة الخطأ كافية للـ UI
    if (error.message?.includes("not available on your current plan")) {
      return { success: false, error: error.message }
    }
    
    console.error("Create gallery item error:", error)
    return { success: false, error: "Failed to create gallery item" }
  }
}

export async function deleteGalleryItem(itemId: string, patientId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return { success: false, error: "Unauthorized" }
    }

    // ✅ Server-Side Block
    await requireFeature(session.user.clinicId, "GALLERY")

    const item = await prisma.galleryItem.findFirst({
      where: { id: itemId, clinicId: session.user.clinicId, patientId }
    })

    if (!item) {
      return { success: false, error: "Gallery item not found" }
    }

    await prisma.galleryItem.delete({
      where: { id: itemId }
    })

    revalidatePath(`/patients/${patientId}`)
    return { success: true }

  } catch (error: any) {
    // ✅ تم إزالة upgradeRequired
    if (error.message?.includes("not available on your current plan")) {
      return { success: false, error: error.message }
    }
    
    console.error("Delete gallery item error:", error)
    return { success: false, error: "Failed to delete gallery item" }
  }
}