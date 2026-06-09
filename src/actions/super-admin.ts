"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import crypto from "crypto"

// ─── Get All Subscribers ────────────────────────────
export async function getAllSubscribers() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") return []

  return await prisma.clinic.findMany({
    include: {
      users: {
        where: { role: "ADMIN" },
        select: { email: true },
        take: 1,
      },
      subscription: {
        select: { status: true, endDate: true, currentPeriodEnd: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

// ─── Override Subscription ──────────────────────────
export async function overrideSubscription(clinicId: string, status: "ACTIVE" | "EXPIRED" | "SUSPENDED", days?: number) {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

  const sub = await prisma.subscription.findUnique({ where: { clinicId } })
  
  if (sub) {
    const newEndDate = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : (sub.currentPeriodEnd || sub.endDate)
    await prisma.subscription.update({
      where: { clinicId },
      data: { status, endDate: newEndDate, currentPeriodEnd: newEndDate }
    })
  } else if (status === "ACTIVE" && days) {
    const defaultPlan = await prisma.plan.upsert({
      where: { slug: "starter" },
      update: {},
      create: { name: "Starter", slug: "starter", monthlyPrice: 0, yearlyPrice: 0, active: true }
    })
    
    await prisma.subscription.create({
      data: {
        clinicId,
        planId: defaultPlan.id,
        status: "ACTIVE",
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      }
    })
  }
}

// ─── Super Admin Generate Bulk Codes ──────────────────────
export async function superAdminGenerateCodes(data: {
  planId: string;
  durationDays: number;
  quantity: number;
  type: "SIGNUP" | "SUBSCRIPTION";
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const { planId, durationDays, quantity, type } = data;

    if (!planId || !durationDays || !quantity || quantity > 100) {
      return { success: false, error: "Invalid data. Max 100 codes at once." }
    }

    // تحديد الـ Prefix بناءً على المدة
    let prefix = "SUB";
    if (durationDays === 10) prefix = "TRIAL";
    else if (durationDays === 30) prefix = "1M";
    else if (durationDays === 180) prefix = "6M";
    else if (durationDays === 365) prefix = "1Y";

    const codesToCreate = [];
    for (let i = 0; i < quantity; i++) {
      const rawCode = crypto.randomBytes(4).toString("hex").toUpperCase()
      const formattedCode = `${prefix}-${rawCode.slice(0, 4)}-${rawCode.slice(4)}`
      
      codesToCreate.push({
        code: formattedCode,
        type: type,
        durationDays: durationDays,
        planId: planId, // ← ربط الكود بالباقة المحددة
      });
    }

    await prisma.activationCode.createMany({
      data: codesToCreate,
    });

    return { success: true, message: `${quantity} codes generated successfully!` }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to generate codes." }
  }
}

// ─── Get Activation Codes ──────────────────────────
export async function getActivationCodes() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") return []

  return prisma.activationCode.findMany({
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50, // نجلب آخر 50 كود فقط عشان الأداء
  });
}