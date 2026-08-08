import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")
  if (!query || query.length < 1) return NextResponse.json([])

  try {
    const surgeries = await prisma.surgeryDict.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, specialty: true },
      distinct: ['name'],
      take: 50,
    })
    return NextResponse.json(surgeries)
  } catch (error) {
    console.error("Surgery Search Error:", error)
    return NextResponse.json([], { status: 500 })
  }
}