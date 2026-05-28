"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { ActionResult } from "@/types"
import crypto from "crypto"

// التأكد إن اللي بيطلب ده هو صاحب المنصة بس
async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Super Admin access required.")
  }
  return session
}

// ─── 1. جلب كل العيادات والاشتراكات ────────────────────
export async function getAllSubscribers() {
  await requireSuperAdmin()
  
  const clinics = await prisma.clinic.findMany({
    include: {
      subscription: true,
      users: {
        where: { role: "ADMIN" },
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return clinics
}

// ─── 2. تحديث حالة اشتراك عيادة (قفل/فتح/تمديد) ────────
export async function overrideSubscription(
  clinicId: string, 
  newStatus: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "TRIAL",
  daysToAdd?: number
): Promise<ActionResult> {
  try {
    await requireSuperAdmin()

    const sub = await prisma.subscription.findUnique({ where: { clinicId } })
    
    let newEndDate = sub?.endDate
    
    if (daysToAdd && daysToAdd > 0) {
      const startDate = (sub?.endDate && new Date(sub.endDate) > new Date()) ? new Date(sub.endDate) : new Date()
      newEndDate = new Date(startDate)
      newEndDate.setDate(newEndDate.getDate() + daysToAdd)
    }

    // لو مفيش اشتراك خالص، هنجيب أول Plan في النظام عشان ننشئه
    if (!sub) {
      const defaultPlan = await prisma.plan.findFirst()
      if (!defaultPlan) return { success: false, error: "No plans found in database." }

      await prisma.subscription.create({
        data: { 
          clinicId, 
          status: newStatus, 
          endDate: newEndDate,
          planId: defaultPlan.id
        }
      })
    } else {
      // لو موجود بنحدثه بس
      await prisma.subscription.update({
        where: { clinicId },
        data: { status: newStatus, endDate: newEndDate }
      })
    }

    return { success: true, message: "Subscription updated successfully." }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─── 3. توليد كود تفعيل ──────────────────────────────
export async function superAdminGenerateCode(durationDays: number): Promise<ActionResult> {
  try {
    await requireSuperAdmin()

    const rawCode = crypto.randomBytes(4).toString("hex").toUpperCase()
    const formattedCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`
    
    await prisma.activationCode.create({
      data: { code: formattedCode, durationDays }
    })

    return { success: true, message: `Code generated: ${formattedCode}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}