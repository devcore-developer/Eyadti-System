import { auth } from "@/lib/auth"
import { requireFeature } from "@/lib/services/feature-gate"
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Server-Side Block للـ API
    try {
      await requireFeature(session.user.clinicId, "GALLERY")
    } catch (featureError: any) {
      return NextResponse.json(
        { error: featureError.message, upgradeRequired: true }, 
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    const items = await prisma.galleryItem.findMany({
      where: { 
        patientId,
        clinicId: session.user.clinicId 
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(items)

  } catch (error) {
    console.error("Gallery GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}