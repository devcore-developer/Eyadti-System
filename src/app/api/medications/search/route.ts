import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim()

    // تجاهل البحث إذا كان أقل من حرفين
    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    const medications = await prisma.medication.findMany({
      where: {
        OR: [
          { tradeName: { contains: q, mode: "insensitive" } },
          { genericName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10, // أقصى عدد للنتائج
    })

    return NextResponse.json(medications)
  } catch (error) {
    console.error("[MEDICATIONS_SEARCH_ERROR]", error)
    return NextResponse.json([], { status: 500 })
  }
}