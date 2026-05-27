"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { notificationSettingsSchema } from "@/lib/validations/notifications"

export async function getNotifications(userId: string, clinicId: string, page: number = 1, filter?: string) {
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where: any = { userId, clinicId }
  if (filter === "unread") where.isRead = false
  if (filter === "read") where.isRead = true

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ])

  return { notifications, total, pages: Math.ceil(total / pageSize) }
}

export async function getUnreadCount(userId: string, clinicId: string) {
  return prisma.notification.count({
    where: { userId, clinicId, isRead: false },
  })
}

export async function markAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user) return { success: false }

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true, readAt: new Date() },
  })

  revalidatePath("/notifications")
  return { success: true }
}

export async function markAllAsRead(userId: string, clinicId: string) {
  await prisma.notification.updateMany({
    where: { userId, clinicId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  revalidatePath("/notifications")
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const session = await auth()
  if (!session?.user) return { success: false }

  await prisma.notification.deleteMany({
    where: { id: notificationId, userId: session.user.id },
  })

  revalidatePath("/notifications")
  return { success: true }
}

export async function getNotificationSettings(userId: string) {
  let settings = await prisma.notificationSettings.findUnique({ where: { userId } })

  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: { userId },
    })
  }

  return settings
}

export async function updateNotificationSettings(userId: string, rawData: unknown) {
  const session = await auth()
  if (!session?.user || session.user.id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = notificationSettingsSchema.parse(rawData)

  await prisma.notificationSettings.upsert({
    where: { userId },
    update: validated,
    create: { userId, ...validated },
  })

  revalidatePath("/settings/notifications")
  return { success: true }
}

export async function getPendingReminders() {
  const now = new Date()
  return prisma.reminder.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    include: { appointment: { include: { patient: true, doctor: true } } },
  })
}

export async function updateReminderStatus(reminderId: string, status: "SENT" | "FAILED") {
  return prisma.reminder.update({
    where: { id: reminderId },
    data: { status, sentAt: new Date() },
  })
}