"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { ActionResult } from "@/types"

// ─── Redeem Activation Code ────────────────────────────
export async function redeemActivationCode(inputCode: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) {
      return { success: false, error: "You must be logged in." }
    }

    // 1. البحث عن الكود
    const codeRecord = await prisma.activationCode.findUnique({
      where: { code: inputCode },
    })

    // 2. التأكد إن الكود موجود ومستخدمش قبل كده
    if (!codeRecord) {
      return { success: false, error: "Invalid code." }
    }
    if (codeRecord.isUsed) {
      return { success: false, error: "This code has already been used." }
    }

    const clinicId = session.user.clinicId
    const now = new Date()

    // 3. حساب تاريخ الانتهاء الجديد
    const currentSub = await prisma.subscription.findUnique({
      where: { clinicId: clinicId },
    })

    let startDate = now
    // ✅ استخدام endDate زي ما هي في الـ Schema
    if (currentSub?.endDate && new Date(currentSub.endDate) > now) {
      // لو الاشتراك لسه شغال، هنزود عليه
      startDate = new Date(currentSub.endDate)
    }

    const newEndDate = new Date(startDate)
    newEndDate.setDate(newEndDate.getDate() + codeRecord.durationDays)

    // ✅ حل مشكلة الـ planId لو الكود مكنش مرتبط بباقة
    let planId = codeRecord.planId
    if (!planId) {
      const defaultPlan = await prisma.plan.findFirst({ where: { active: true } })
      if (!defaultPlan) return { success: false, error: "No active plans found in system." }
      planId = defaultPlan.id
    }

    // 4. تحديث الداتا بيز في معاملة واحدة (Transaction)
    await prisma.$transaction([
      // تحديث حالة الاشتراك
      prisma.subscription.upsert({
        where: { clinicId: clinicId },
        update: {
          status: "ACTIVE",
          endDate: newEndDate, // ✅ التعديل هنا لـ endDate
          planId: planId,
        },
        create: {
          clinicId: clinicId,
          planId: planId,
          status: "ACTIVE",
          endDate: newEndDate, // ✅ التعديل هنا لـ endDate
        },
      }),
      // تسجيل إن الكود اتمسح واتستخدم
      prisma.activationCode.update({
        where: { id: codeRecord.id },
        data: {
          isUsed: true,
          usedByClinicId: clinicId,
          usedAt: now,
        },
      }),
    ])

    return { success: true, message: "Subscription activated successfully!" }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to redeem code." }
  }
}