import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { rankAndSort } from "@/lib/search-ranking"

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    // Fetch more for better ranking
    const complaints = await prisma.complaint.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      take: 100,
    })

    // Rank and return top results
    const ranked = rankAndSort(complaints, q, item => item.name || "")
    return NextResponse.json(ranked.slice(0, 15))
  } catch (error) {
    console.error("[COMPLAINTS_SEARCH_ERROR]", error)
    return NextResponse.json([], { status: 500 })
  }
}