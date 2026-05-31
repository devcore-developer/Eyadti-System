"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// 1. جلب صور المريض من الداتابيز
export async function getPatientGallery(patientId: string) {
  const session = await auth()
  if (!session?.user?.clinicId) {
    // لو مش مسجل دخول، نرجع массив فاضي عشان الصفحة ماتقعش
    return [] 
  }

  try {
    const items = await prisma.galleryItem.findMany({
      where: {
        patientId: patientId,
        clinicId: session.user.clinicId, // لازم نتأكد إنه بيجيب صور عيادته بس
      },
      orderBy: {
        createdAt: "desc", // ترتيب من الأحدث للأقدم
      },
    })
    
    return items
  } catch (error) {
    console.error("Failed to fetch gallery items:", error)
    return []
  }
}

// 2. حفظ صورة جديدة في الداتابيز (بعد رفعها على Cloudinary)
export async function createGalleryItem(patientId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.clinicId) {
    return { error: "Unauthorized" }
  }

  try {
    const beforeImageUrl = formData.get("beforeImageUrl") as string
    const afterImageUrl = formData.get("afterImageUrl") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!beforeImageUrl || !afterImageUrl) {
      return { error: "Both before and after images are required" }
    }

    await prisma.galleryItem.create({
      data: {
        patientId,
        beforeImageUrl,
        afterImageUrl,
        title: title || null,
        description: description || null,
        clinicId: session.user.clinicId,
      },
    })

    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to create gallery item:", error)
    return { error: "Failed to save gallery item to database" }
  }
}

// 3. مسح صورة من الداتابيز
export async function deleteGalleryItem(id: string, patientId: string) {
  const session = await auth()
  if (!session?.user?.clinicId) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.galleryItem.delete({
      where: { 
        id, 
        clinicId: session.user.clinicId // أمان إضافي عشان يمسح من عيادته بس
      },
    })
    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete gallery item:", error)
    return { error: "Failed to delete" }
  }
}