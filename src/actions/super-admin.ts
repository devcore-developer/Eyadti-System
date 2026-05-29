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
        select: { status: true, endDate: true }
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
    const newEndDate = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : sub.endDate
    await prisma.subscription.update({
      where: { clinicId },
      data: { status, endDate: newEndDate }
    })
  } else if (status === "ACTIVE" && days) {
    const defaultPlan = await prisma.plan.upsert({
      where: { slug: "default-plan" },
      update: {},
      create: { name: "Unified Plan", slug: "default-plan", monthlyPrice: 0, yearlyPrice: 0, active: true }
    })
    
    await prisma.subscription.create({
      data: {
        clinicId,
        planId: defaultPlan.id,
        status: "ACTIVE",
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      }
    })
  }
}

// ─── Super Admin Generate Code ──────────────────────
export async function superAdminGenerateCode(type: "SIGNUP" | "SUBSCRIPTION", durationDays: number) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // توليد كود عشوائي
    const rawCode = crypto.randomBytes(4).toString("hex").toUpperCase()
    const formattedCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`
    
    // لو الكود لتسجيل، دايماً بيدي 3 أيام تجربة. لو لتفعيل، بيستخدم الـ durationDays
    const days = type === "SIGNUP" ? 3 : durationDays

    await prisma.activationCode.create({
      data: {
        code: formattedCode,
        type: type,
        durationDays: days,
      },
    })

    const typeLabel = type === "SIGNUP" ? "Signup (3 Days Trial)" : `Subscription (${days} Days)`
    return { success: true, message: `${typeLabel} Code: ${formattedCode}` }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to generate code." }
  }
}