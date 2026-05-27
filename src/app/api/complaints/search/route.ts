import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    const complaints = await prisma.complaint.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      take: 10,
    })

    return NextResponse.json(complaints)
  } catch (error) {
    console.error("[COMPLAINTS_SEARCH_ERROR]", error)
    return NextResponse.json([], { status: 500 })
  }
}