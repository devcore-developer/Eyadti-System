"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// جلب الإعلانات النشطة وغير المقروءة للعيادة الحالية (للبانر والنوتيفيكيشن)
export async function getActiveAnnouncementsForClinic() {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) return []

    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: { id: true, subscription: { select: { planId: true, status: true } } }
    })

    if (!clinic || clinic.subscription?.status !== "ACTIVE") return []

    const announcements = await prisma.announcement.findMany({
      where: {
        status: "ACTIVE",
        // الشرط الأساسي للتارجتينج (المنطق السحري)
        OR: [
          { targetAll: true },
          { targetClinicIds: { has: clinic.id } },
          { targetPlanIds: { has: clinic.subscription.planId || "" } }
        ],
        // استبعاد الإعلانات التي قام هذا المستخدم بإخفائها (Dismissed)
        NOT: {
          reads: {
            some: {
              clinicId: clinic.id,
              userId: session.user.id,
              // سنستخدم حقل readAt كـ flag، لو null يبقى dismissed
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return announcements
  } catch (error) {
    return []
  }
}

// تسجيل القراءة أو الإخفاء (Dismiss)
export async function dismissOrReadAnnouncement(announcementId: string) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) return { success: false }

    // نستخدم Upsert: لو موجود نحدثه، لو مش موجود ننشئه
    await prisma.announcementRead.upsert({
      where: {
        announcementId_clinicId_userId: {
          announcementId,
          clinicId: session.user.clinicId,
          userId: session.user.id
        }
      },
      update: { readAt: new Date() },
      create: {
        announcementId,
        clinicId: session.user.clinicId,
        userId: session.user.id,
        readAt: new Date() // يعتبر Read/Dismissed
      }
    })

    return { success: true }
  } catch (error) {
    return { success: false }
  }
}