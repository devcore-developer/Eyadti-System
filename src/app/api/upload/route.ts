import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth" // استخدام الـ auth الجديد

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  // تعديل هنا: نتحقق بس إنه مسجل دخوله، مش شرط يكون معاه clinicId
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "clinic_uploads", // فولدر مختلف للوجوهات والملفات العامة
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    const uploadResult = result as any
    return NextResponse.json({ url: uploadResult.secure_url })
  } catch (error) {
    console.error("Cloudinary Upload Error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}