import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // عمل اسم فريد عشان متحصلش تعارض
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const filename = uniqueSuffix + "-" + file.name.replace(/\s/g, "_")
    
    // تحديد المسار اللي هنخزن فيه
    const filepath = path.join(process.cwd(), "public/uploads", filename)
    
    // حفظ الصورة فعلياً
    await writeFile(filepath, buffer)
    
    // اللينك اللي هنخزنه في الداتا بيز
    const imageUrl = `/uploads/${filename}`

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}