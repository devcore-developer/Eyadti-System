import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { randomUUID } from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      // Don't reveal — always same response
      return NextResponse.json(
        { message: "If an account exists with that email, you will receive a reset link." },
        { status: 200 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true },
    })

    // Security: don't reveal whether email exists
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with that email, you will receive a reset link." },
        { status: 200 }
      )
    }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expiresAt,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    })

    return NextResponse.json(
      { message: "If an account exists with that email, you will receive a reset link." },
      { status: 200 }
    )
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error)
    // Still return 200 to prevent email enumeration
    return NextResponse.json(
      { message: "If an account exists with that email, you will receive a reset link." },
      { status: 200 }
    )
  }
}