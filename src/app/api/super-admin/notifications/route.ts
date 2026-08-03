import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await prisma.superAdminNotification.findMany({
      include: { clinic: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Error fetching SA notifications:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (body.action === "mark_all_read") {
      await prisma.superAdminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      })
      return NextResponse.json({ success: true })
    }

    if (body.notificationId && body.action === "mark_read") {
      await prisma.superAdminNotification.update({
        where: { id: body.notificationId },
        data: { isRead: true }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating SA notification:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}