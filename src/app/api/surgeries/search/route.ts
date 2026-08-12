import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { rankAndSort } from "@/lib/search-ranking"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")
  if (!query || query.length < 1) return NextResponse.json([])

  try {
    // Fetch more for better ranking
    const surgeries = await prisma.surgeryDict.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, specialty: true },
      take: 100,
    })
    
    // Rank and return top results
    const ranked = rankAndSort(surgeries, query, item => item.name || "")
    return NextResponse.json(ranked.slice(0, 15))
  } catch (error) {
    console.error("Surgery Search Error:", error)
    return NextResponse.json([], { status: 500 })
  }
}