import { NextResponse } from "next/server"

export async function POST(req: Request) {
  return NextResponse.json({ error: "Deprecated: Use Server Actions" }, { status: 400 })
}