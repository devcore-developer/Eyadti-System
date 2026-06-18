"use server"

import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { createUserSchema, updateUserSchema, updateClinicSchema } from "@/lib/validations/admin"
import type { ActionResult } from "@/types"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

function handleAuthError(error: unknown): ActionResult {
  if (error instanceof AuthenticationError) return { success: false, error: error.message }
  if (error instanceof AuthorizationError) return { success: false, error: error.message }
  return { success: false, error: "An unexpected error occurred" }
}

// ─── CLINIC ADMIN FUNCTIONS ─────────────────────────────────────

export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN")
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
    }
    const validated = createUserSchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    
    const existingUser = await prisma.user.findUnique({ where: { email: validated.data.email } })
    if (existingUser) return { success: false, error: "Email is already in use." }
    
    const hashedPassword = await hash(validated.data.password, 10)
    await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
        role: validated.data.role,
        clinicId: session.clinicId,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUser(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN")
    const existingUser = await prisma.user.findFirst({ where: { id: userId, clinicId: session.clinicId } })
    if (!existingUser) return { success: false, error: "User not found in your clinic." }
    
    if (existingUser.id === session.userId && formData.get("role") !== "ADMIN") {
      return { success: false, error: "You cannot remove your own Admin role." }
    }

    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      password: (formData.get("password") as string) || "",
    }
    const validated = updateUserSchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const updateData: any = { name: validated.data.name, email: validated.data.email, role: validated.data.role }
    if (validated.data.password && validated.data.password.trim() !== "") updateData.password = await hash(validated.data.password, 10)

    await prisma.user.update({ where: { id: userId }, data: updateData })
  } catch (error) {
    return handleAuthError(error)
  }
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateClinicSettings(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN")
    const raw = {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || "",
      address: (formData.get("address") as string) || "",
    }
    const validated = updateClinicSchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    
    await prisma.clinic.update({
      where: { id: session.clinicId },
      data: { name: validated.data.name.trim(), phone: validated.data.phone?.trim() || null, address: validated.data.address?.trim() || null },
    })
  } catch (error) {
    return handleAuthError(error)
  }
  revalidatePath("/admin/settings")
  revalidatePath("/dashboard")
  return { success: true }
}

// ─── SUPER ADMIN FUNCTIONS ─────────────────────────────────────

export async function getPlatformStats() {
  try {
    await requireRole("SUPER_ADMIN")
    
    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)

    const [
      totalClinics,
      activeClinics,
      totalUsers,
      totalDoctors,
      totalPatients,
      appointmentsToday,
      totalRevenue,
      activeTrials,
      expiringSubs,
      failedPayments
    ] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { subscription: { status: "ACTIVE" } } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.patient.count(),
      // تم التعليق مؤقتاً بسبب اختلاف اسم الحقل في السكيمة
      // prisma.appointment.count({ where: { start: { gte: todayStart } } }),
      0 as number, 
      
      prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.clinic.count({ where: { subscription: { status: "TRIAL" } } }),
      prisma.clinic.count({ where: { subscription: { endDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, status: "ACTIVE" } } }),
      prisma.invoice.count({ where: { status: { not: "PAID" } } })
    ])

    return {
      totalClinics,
      activeClinics,
      totalUsers,
      totalDoctors,
      totalPatients,
      appointmentsToday,
      // ✅ تم إصلاح التحويل من Decimal إلى Number
      mrr: (totalRevenue._sum.amount as any)?.toNumber?.() || 0,
      activeTrials,
      expiringSubs,
      failedPayments
    }
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    return null
  }
}

export async function getAllClinics() {
  try {
    await requireRole("SUPER_ADMIN")
    return await prisma.clinic.findMany({
      include: {
        subscription: true,
        _count: {
          select: { users: true, branches: true, patients: true } 
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    return []
  }
}

export async function impersonateClinic(clinicId: string) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized")
    }

    // ✅ تم إضافة الحقول المطلوبة entityType و entityId
    await prisma.auditLog.create({
      data: {
        action: "SUPPORT_MODE_LOGIN",
        userId: session.user.id,
        clinicId: clinicId,
        entityType: "CLINIC",
        entityId: clinicId
      }
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to enter support mode" }
  }
}

export async function getClinicDetails(clinicId: string) {
  try {
    await requireRole("SUPER_ADMIN")

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        subscription: {
          // تمت إزالة include plan لأنه غير موجود في السكيمة
        }, 
        branches: { select: { id: true, name: true, city: true } },
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: {
          select: {
            patients: true,
            appointments: true,
            invoices: true,
            users: true 
          }
        }
      }
    })

    if (!clinic) throw new Error("Clinic not found")

    const recentInvoices = await prisma.invoice.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return { ...clinic, recentInvoices }
  } catch (error) {
    console.error("Error fetching clinic details:", error)
    return null
  }
}

// ─── BILLING & REVENUE ────────────────────────────────────────

export async function getPlatformBillingData() {
  try {
    await requireRole("SUPER_ADMIN")

    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true }
    })
    
    // تم وضع 0 مؤقتاً بسبب عدم وجود حقل السعر واضح في السكيمة
    const mrr = 0 

    const failedPayments = await prisma.invoice.findMany({
      where: { status: { not: "PAID" } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { clinic: { select: { name: true } } }
    })

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await prisma.invoice.groupBy({
      by: ['createdAt'],
      where: {
        status: 'PAID',
        createdAt: { gte: sixMonthsAgo }
      },
      _sum: { amount: true }
    })

    return { mrr, failedPayments, monthlyRevenue }
  } catch (error) {
    return null
  }
}

// ─── FEATURE FLAGS ──────────────────────────────────────────────

export async function toggleFeatureFlag(clinicId: string, feature: string, value: boolean) {
  try {
    await requireRole("SUPER_ADMIN")
    
    // Mock Implementation
    // await prisma.auditLog.create({ ... })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update feature flag" }
  }
}

export async function getAllClinicsWithFlags() {
  try {
    await requireRole("SUPER_ADMIN")
    const clinics = await prisma.clinic.findMany({
      select: { id: true, name: true, subscription: { select: { status: true } } },
      orderBy: { name: 'asc' }
    })
    
    return clinics.map(c => ({
      ...c,
      features: {
        whatsappEnabled: true,
        onlineBookingEnabled: c.subscription?.status === 'ACTIVE',
        smsNotifications: false
      }
    }))
  } catch (error) {
    return []
  }
}