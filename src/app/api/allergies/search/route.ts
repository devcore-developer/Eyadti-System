import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { rankAndSort } from "@/lib/search-ranking"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")
  if (!query || query.length < 1) return NextResponse.json([])

  try {
    // Fetch more results for better ranking coverage
    const allergies = await prisma.allergyDict.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, category: true },
      take: 100,
    })
    
    // Rank and return top results
    const ranked = rankAndSort(allergies, query, item => item.name || "")
    return NextResponse.json(ranked.slice(0, 15))
  } catch (error) {
    console.error("Allergy Search Error:", error)
    return NextResponse.json([], { status: 500 })
  }
}