import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
// تم حذف الاستيراد الغلط: import { getServerSession } from "next-auth"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    // استخرجنا كل البيانات اللي بتبعت من الفورم
    const { patientId, beforeImageUrl, afterImageUrl, title, description } = body

    const newItem = await prisma.galleryItem.create({
      data: {
        patientId,
        beforeImageUrl,
        afterImageUrl,
        title, // إضافة العنوان
        description, // إضافة الوصف
        clinicId: session.user.clinicId, // ⬅️ الحل الأساسي للخطأ التاني: إضافة clinicId
      },
    })

    return NextResponse.json(newItem)
  } catch (error) {
    console.error(error) // عشان لو فيه خطأ يظهرلك في الـ Terminal
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}