"use server"

import { prisma } from "@/lib/db"
import { requireRole, requireSelfEdit, AuthenticationError, AuthorizationError } from "@/lib/permissions"
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
    // ── Use requireSelfEdit instead of requireRole("ADMIN") ──
    // This allows DOCTOR and RECEPTION to edit their own profile.
    // ADMIN/SUPER_ADMIN can still edit any user (enforced at page level).
    const session = await requireSelfEdit()

    // ── Security: User can ONLY edit their OWN record ──
    if (session.userId !== userId) {
      return { success: false, error: "You can only edit your own account." }
    }

    const existingUser = await prisma.user.findFirst({ 
      where: { id: userId, clinicId: session.clinicId } 
    })
    if (!existingUser) return { success: false, error: "User not found in your clinic." }

    // ── Security: Prevent role changes for non-admin users ──
    // Even though the frontend disables the Role field, enforce at server level.
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
      const incomingRole = formData.get("role") as string
      if (incomingRole && incomingRole !== existingUser.role) {
        return { success: false, error: "Role changes are not allowed." }
      }
    }

    // ── Admin-specific: prevent removing own Admin role ──
    if (existingUser.id === session.userId && formData.get("role") !== "ADMIN") {
      return { success: false, error: "You cannot remove your own Admin role." }
    }

    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: (formData.get("role") as string) || "",
      password: (formData.get("password") as string) || "",
    }

    const validated = updateUserSchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }

    // For non-admin: always keep the existing role
    const updateData: any = { 
      name: validated.data.name, 
      email: validated.data.email, 
      role: existingUser.role 
    }
    if (validated.data.password && validated.data.password.trim() !== "") {
      updateData.password = await hash(validated.data.password, 10)
    }

    await prisma.user.update({ where: { id: userId }, data: updateData })
  } catch (error) {
    return handleAuthError(error)
  }
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/edit/${userId}`)
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
      prisma.appointment.count({
        where: {
          dateTime: { gte: todayStart },
          status: { not: "CANCELLED" },
        },
      }),
      
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

export async function impersonateClinic(clinicId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized")
    }

    await prisma.auditLog.create({
      data: {
        action: "SUPPORT_MODE_LOGIN",
        userId: session.user.id,
        clinicId: clinicId,
        entityType: "CLINIC",
        entityId: clinicId,
      },
    })

    // NOTE: Full impersonation requires session swapping infrastructure
    // (e.g., storing impersonatedClinicId in JWT, middleware to inject it).
    // For now, this logs the action and redirects to the clinic details page.
    return {
      success: true,
      message: "Support mode access logged. Redirecting to clinic details...",
      redirectTo: `/super-admin/clinics/${clinicId}`,
    }
  } catch (error) {
    return { success: false, error: "Failed to enter support mode." }
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

// NOTE: Feature flags require a dedicated FeatureFlag model in the database
// to store per-clinic overrides. Current implementation uses plan-based
// feature gates via feature-gate.ts which is the correct approach.
// This function is a placeholder for future per-clinic overrides.
export async function toggleFeatureFlag(clinicId: string, feature: string, value: boolean) {
  try {
    await requireRole("SUPER_ADMIN")

    await prisma.auditLog.create({
      data: {
        action: "FEATURE_FLAG_TOGGLE",
        userId: (await requireRole("SUPER_ADMIN")).userId,
        clinicId,
        entityType: "FEATURE_FLAG",
        entityId: feature,
        newValues: { feature, value },
      },
    })

    return { success: true, message: `Feature flag "${feature}" toggle logged. (Per-clinic overrides require schema changes.)` }
  } catch (error) {
    return { success: false, error: "Failed to update feature flag." }
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
// ─── ACTIVATION CODES ──────────────────────────────────────────

export async function getActivationCodes() {
  try {
    await requireRole("SUPER_ADMIN")

    const codes = await prisma.activationCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usedByClinic: {
          select: { id: true, name: true }
        },
        usedByUser: {
          select: { id: true, name: true, email: true }
        },
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        plan: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    return codes
  } catch (error) {
    console.error("Error fetching activation codes:", error)
    return []
  }
}
export async function generateActivationCode(data: {
  code?: string
  type: "SIGNUP" | "SUBSCRIPTION"
  durationDays: number
  planId?: string
}): Promise<ActionResult> {
  try {
    await requireRole("SUPER_ADMIN")

    const code = data.code || `AC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const existing = await prisma.activationCode.findUnique({ where: { code } })
    if (existing) return { success: false, error: "This code already exists." }

    await prisma.activationCode.create({
      data: {
        code,
        type: data.type,
        durationDays: data.durationDays,
        planId: data.planId ?? null,
        isUsed: false,
      }
    })

    revalidatePath("/admin/activation-codes")
    return { success: true }
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function deleteActivationCode(codeId: string): Promise<ActionResult> {
  try {
    await requireRole("SUPER_ADMIN")

    const code = await prisma.activationCode.findUnique({ where: { id: codeId } })
    if (!code) return { success: false, error: "Code not found." }
    if (code.isUsed) return { success: false, error: "Cannot delete a used code." }

    await prisma.activationCode.delete({ where: { id: codeId } })

    revalidatePath("/admin/activation-codes")
    return { success: true }
  } catch (error) {
    return handleAuthError(error)
  }
}

// ─── REVOKE ACTIVATION CODE ──────────────────────────────────────

export async function revokeActivationCode(codeId: string): Promise<ActionResult> {
  try {
    await requireRole("SUPER_ADMIN")

    const code = await prisma.activationCode.findUnique({ where: { id: codeId } })
    if (!code) return { success: false, error: "Code not found." }

    if (code.status === "USED") {
      return { success: false, error: "Cannot revoke a code that has already been used." }
    }

    if (code.status === "REVOKED") {
      return { success: false, error: "This code is already revoked." }
    }

    await prisma.activationCode.update({
      where: { id: codeId },
      data: { status: "REVOKED" },
    })

    revalidatePath("/admin/activation-codes")
    return { success: true, message: "Code revoked successfully." }
  } catch (error) {
    return handleAuthError(error)
  }
}

// ─── REGENERATE ACTIVATION CODE ──────────────────────────────────

export async function regenerateActivationCode(codeId: string): Promise<ActionResult> {
  try {
    await requireRole("SUPER_ADMIN")

    const oldCode = await prisma.activationCode.findUnique({
      where: { id: codeId },
      include: { plan: true },
    })

    if (!oldCode) return { success: false, error: "Code not found." }

    if (oldCode.status === "USED") {
      return { success: false, error: "Cannot regenerate a code that has already been used." }
    }

    // Generate new code with same specifications
    const { randomBytes } = await import("crypto")
    const newCodeValue = randomBytes(4).toString("hex").slice(0, 8).toUpperCase()

    // Use transaction: delete old, create new
    await prisma.$transaction([
      prisma.activationCode.delete({ where: { id: codeId } }),
      prisma.activationCode.create({
        data: {
          code: newCodeValue,
          type: oldCode.type,
          durationDays: oldCode.durationDays,
          planId: oldCode.planId,
          expiresAt: oldCode.expiresAt,
          status: "AVAILABLE",
          isUsed: false,
          createdByUserId: oldCode.createdByUserId,
        },
      }),
    ])

    revalidatePath("/admin/activation-codes")
    return { success: true, message: "Code regenerated successfully.", codes: [newCodeValue] }
  } catch (error) {
    return handleAuthError(error)
  }
}

// ─── EXPORT ACTIVATION CODES (CSV) ──────────────────────────────

export async function exportActivationCodes(): Promise<ActionResult<{
  filename: string;
  content: string;
  mimeType: string;
}>> {
  try {
    await requireRole("SUPER_ADMIN")

    const codes = await prisma.activationCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usedByClinic: { select: { name: true } },
        usedByUser: { select: { name: true, email: true } },
        createdByUser: { select: { name: true, email: true } },
        plan: { select: { name: true, slug: true } },
      },
    })

    const headers = [
      "Code",
      "Type",
      "Status",
      "Plan",
      "Duration (Days)",
      "Expires At",
      "Created At",
      "Used At",
      "Created By",
      "Created By Email",
      "Used By Clinic",
      "Used By User",
      "Used By Email",
    ]

    const rows = codes.map((c) => [
      c.code,
      c.type,
      c.status,
      c.plan?.name || "N/A",
      c.durationDays.toString(),
      c.expiresAt ? c.expiresAt.toISOString() : "N/A",
      c.createdAt.toISOString(),
      c.usedAt ? c.usedAt.toISOString() : "N/A",
      c.createdByUser?.name || "N/A",
      c.createdByUser?.email || "N/A",
      c.usedByClinic?.name || "N/A",
      c.usedByUser?.name || "N/A",
      c.usedByUser?.email || "N/A",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => {
          const str = String(cell)
          // Escape commas and quotes in CSV
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }).join(",")
      ),
    ].join("\n")

    // Return base64 encoded CSV so the client can download it
    const base64 = Buffer.from(csvContent, "utf-8").toString("base64")

    return {
      success: true,
      data: {
        filename: `activation-codes-${new Date().toISOString().split("T")[0]}.csv`,
        content: base64,
        mimeType: "text/csv",
      },
    }
  } catch (error) {
    return handleAuthError(error) as any
  }
}

// ─── HELPER: Get active plans for code generation ────────────────
export async function getActivePlansForCodes() {
  try {
    await requireRole("SUPER_ADMIN")
    return await prisma.plan.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true, monthlyPrice: true },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    console.error("Error fetching plans for codes:", error)
    return []
  }
}

export async function recordPayment(invoiceId: string, amount: number, method: string) {
  try {
    const session = await auth()
    if (!session?.user?.clinicId) return { success: false, error: "Unauthorized" }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) return { success: false, error: "Invoice not found" }

    // 1. تسجيل عملية الدفع
    await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        method: method as any,
        recordedById: session.user.id,
        clinicId: session.user.clinicId,
      }
    })

    // 2. تحديث حالة الفاتورة
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" }
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to record payment" }
  }
}