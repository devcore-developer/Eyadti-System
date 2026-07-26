import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getResourceType(fileName: string): "image" | "raw" {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]
  return imageExts.includes(ext) ? "image" : "raw"
}

export async function POST(request: Request) {
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

    // ✅ حد أقصى 50MB لملفات STL
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 50MB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const resourceType = getResourceType(file.name)

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: resourceType, // ✅ "raw" لـ STL، "image" لـ الصور
            folder: "clinic_uploads",
            public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    const uploadResult = result as any
    return NextResponse.json({
      url: uploadResult.secure_url,
      resourceType,
      format: uploadResult.format,
      size: uploadResult.bytes,
    })
  } catch (error) {
    console.error("Cloudinary Upload Error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}