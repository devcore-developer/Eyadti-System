"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// 1. جلب صور المريض من الداتابيز
export async function getPatientGallery(patientId: string) {
  const session = await auth()
  if (!session?.user?.clinicId) {
    return [] 
  }

  try {
    const items = await prisma.galleryItem.findMany({
      where: {
        patientId: patientId,
        clinicId: session.user.clinicId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    
    return items
  } catch (error) {
    console.error("Failed to fetch gallery items:", error)
    return []
  }
}

// 2. حفظ صور جديدة في الداتابيز (بعد رفعها على Cloudinary)
export async function createGalleryItem(patientId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.clinicId) {
    return { error: "Unauthorized" }
  }

  try {
    // استخدام getAll عشان نجيب كل الروابط اللي اترفعت (المصفوفة)
    const beforeImageUrls = formData.getAll("beforeImageUrls") as string[]
    const afterImageUrls = formData.getAll("afterImageUrls") as string[]
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!beforeImageUrls.length || !afterImageUrls.length) {
      return { error: "At least one before and one after image are required" }
    }

    await prisma.galleryItem.create({
      data: {
        patientId,
        beforeImageUrls, // حفظ المصفوفة كاملة
        afterImageUrls,  // حفظ المصفوفة كاملة
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
        clinicId: session.user.clinicId
      },
    })
    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete gallery item:", error)
    return { error: "Failed to delete" }
  }
}