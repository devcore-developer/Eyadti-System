import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { rankByRelevance } from "@/lib/search-ranking"

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    // Fetch more for better ranking
    const medications = await prisma.medication.findMany({
      where: {
        OR: [
          { tradeName: { contains: q, mode: "insensitive" } },
          { genericName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 100,
    })

    // Rank by BOTH tradeName and genericName, take highest
    const ranked = medications
      .map(med => {
        const tradeRank = rankByRelevance(med.tradeName || "", q)
        const genericRank = rankByRelevance(med.genericName || "", q)
        return {
          ...med,
          _rank: Math.max(tradeRank, genericRank)
        }
      })
      .filter(med => (med._rank ?? 0) > 0)
      .sort((a, b) => {
        if ((b._rank ?? 0) !== (a._rank ?? 0)) {
          return (b._rank ?? 0) - (a._rank ?? 0)
        }
        return (a.tradeName || "").localeCompare(b.tradeName || "")
      })

    return NextResponse.json(ranked.slice(0, 15))
  } catch (error) {
    console.error("[MEDICATIONS_SEARCH_ERROR]", error)
    return NextResponse.json([], { status: 500 })
  }
}