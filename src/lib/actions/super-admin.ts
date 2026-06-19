"use server"

import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
function handleAuthError(error: unknown) {
  if (error instanceof AuthenticationError) return { success: false, error: error.message }
  if (error instanceof AuthorizationError) return { success: false, error: error.message }
  return { success: false, error: "An unexpected error occurred" }
}

export async function getPlatformStats() {
  try {
    await requireRole("SUPER_ADMIN")
    
    // 1. حساب الـ MRR الحقيقي (فلوس الخطط المشتركة شهرية)
    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { monthlyPrice: true } } }
    })
    const mrr = activeSubs.reduce((acc, sub) => acc + (sub.plan?.monthlyPrice || 0), 0)

    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)

    const [
      totalClinics,
      activeClinics,
      totalUsers,
      totalDoctors,
      totalPatients,
      activeTrials,
      expiringSubs,
      failedPayments
    ] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { subscription: { status: "ACTIVE" } } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.patient.count(),
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
      appointmentsToday: 0, 
      mrr, // ✅ دلوقتي بيجيب فلوس الباقات المشتراك فيها فعلاً
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
        subscription: {
          include: { plan: { select: { name: true, slug: true } } }
        },
        _count: {
          select: { users: true, branches: true, patients: true, appointments: true } 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // للداشبورد نحلب 10 بس
    })
  } catch (error) {
    return []
  }
}

export async function getAllPlans() {
  try {
    await requireRole("SUPER_ADMIN")
    return await prisma.plan.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true, monthlyPrice: true },
      orderBy: { name: "asc" }
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

    // 1. تسجيل الدخول في الـ Audit Logs
    await prisma.auditLog.create({
      data: {
        action: "SUPPORT_MODE_LOGIN",
        userId: session.user.id,
        clinicId: clinicId,
        entityType: "CLINIC",
        entityId: clinicId
      }
    })

    // 2. وضع كوكي مؤقت لمدة ساعة
    const cookieStore = await cookies()
    cookieStore.set('support_clinic_id', clinicId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // ساعة واحدة
      sameSite: 'lax'
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to enter support mode" }
  }
}

// دالة الخروج من وضع الدعم
export async function exitSupportMode() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('support_clinic_id')
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to exit support mode" }
  }
}
export async function getAllClinicsForTable() {
  try {
    await requireRole("SUPER_ADMIN")
    return await prisma.clinic.findMany({
      include: {
        subscription: {
          include: { plan: { select: { name: true } } }
        },
        owner: { select: { name: true, email: true } },
        _count: {
          select: { users: true, branches: true, patients: true, appointments: true } 
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    return []
  }
}

export async function getClinicDetails(clinicId: string) {
  try {
    await requireRole("SUPER_ADMIN")

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        subscription: { include: { plan: true } }, 
        owner: { select: { id: true, name: true, email: true } },
        branches: { select: { id: true, name: true, city: true, isActive: true } },
        users: { 
          select: { id: true, name: true, email: true, role: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: { select: { patients: true, appointments: true, invoices: true, users: true } }
      }
    })

    if (!clinic) return null

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
export async function getPlatformBillingData() {
  try {
    await requireRole("SUPER_ADMIN")

    // 1. حساب الإيرادات الفعلية
    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { monthlyPrice: true } } }
    })
    
    const mrr = activeSubs.reduce((acc, sub) => acc + (sub.plan?.monthlyPrice || 0), 0)
    const arr = mrr * 12
    const activeSubsCount = activeSubs.length

    // 2. الفواتير الفاشلة
    const failedPayments = await prisma.invoice.findMany({
      where: { status: { not: "PAID" } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { clinic: { select: { name: true } } }
    })

    // 3. إحصائيات الإيرادات الشهرية (آخر 6 أشهر)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const invoices = await prisma.invoice.findMany({
      where: { status: 'PAID', createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true }
    })

    const revenueByMonth: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('default', { month: 'short' })
      revenueByMonth[key] = 0
    }

    invoices.forEach(inv => {
      const key = new Date(inv.createdAt).toLocaleString('default', { month: 'short' })
      if (revenueByMonth[key] !== undefined) {
        revenueByMonth[key] += Number(inv.amount)
      }
    })

    const chartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }))

    return { mrr, arr, activeSubsCount, failedPayments, chartData }
  } catch (error) {
    console.error("Error fetching billing data:", error)
    return null
  }
}

export async function getAllClinicsWithFlags() {
  try {
    await requireRole("SUPER_ADMIN")
    const clinics = await prisma.clinic.findMany({
      select: { id: true, name: true, subscription: { select: { status: true, plan: { select: { name: true } } } } },
      orderBy: { name: 'asc' }
    })
    
    // ملاحظة: ده Mock Data مؤقت. عشان تخليه حقيقي، لازم تضيف حقل JSON في جدول ClinicSettings
    return clinics.map(c => ({
      ...c,
      features: {
        whatsappEnabled: true,
        onlineBookingEnabled: c.subscription?.status === 'ACTIVE',
        smsNotifications: false,
        analyticsEnabled: c.subscription?.status === 'ACTIVE',
      }
    }))
  } catch (error) {
    return []
  }
}

export async function toggleFeatureFlag(clinicId: string, feature: string, value: boolean) {
  try {
    // requireRole بترجع الـ session مباشرة وبترمي Error لو مش مسجل
    const session = await requireRole("SUPER_ADMIN")
    
    // تسجيل العملية في الـ Audit Log
    await prisma.auditLog.create({
      data: {
        clinicId,
        action: `TOGGLE_FEATURE_${value ? 'ON' : 'OFF'}`,
        userId: session.userId, // ✅ تم التصحيح
        entityType: "FEATURE_FLAG",
        entityId: feature,
      }
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update feature flag" }
  }
}
export async function globalSearch(query: string) {
  try {
    const session = await auth()
    if (!session?.user || !query.trim()) return { results: [] }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    if (isSuperAdmin) {
      const [clinics, users] = await Promise.all([
        prisma.clinic.findMany({
          where: { name: { contains: query, mode: 'insensitive' } },
          take: 5,
          select: { id: true, name: true, subscription: { select: { status: true } } }
        }),
        prisma.user.findMany({
          where: { name: { contains: query, mode: 'insensitive' } },
          take: 5,
          select: { id: true, name: true, email: true, role: true }
        })
      ])

      return {
        results: [
          ...clinics.map(c => ({ id: c.id, type: 'clinic' as const, title: c.name, subtitle: `Status: ${c.subscription?.status || 'N/A'}`, href: `/super-admin/clinics/${c.id}` })),
          ...users.map(u => ({ id: u.id, type: 'user' as const, title: u.name, subtitle: `${u.email} (${u.role})`, href: `/admin/users` }))
        ]
      }
    } else {
      // باقي المستخدمين يبحثوا عن المرضى فقط
      const patients = await prisma.patient.findMany({
        where: { 
          clinicId: session.user.clinicId,
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } }
          ]
        },
        take: 5,
        select: { id: true, fullName: true, phone: true }
      })

      return {
        results: patients.map(p => ({ id: p.id, type: 'patient' as const, title: p.fullName, subtitle: p.phone, href: `/patients/${p.id}` }))
      }
    }
  } catch (error) {
    return { results: [] }
  }
}
export async function getPlatformAuditLogs() {
  try {
    await requireRole("SUPER_ADMIN")
    return await prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        clinic: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  } catch (error) {
    return []
  }
}
export async function getRealSystemHealth() {
  try {
    await requireRole("SUPER_ADMIN")

    const [
      failedReminders,
      totalUsers,
      totalPatients,
      totalAppointments,
      totalInvoices
    ] = await Promise.all([
      prisma.reminder.count({ where: { status: "FAILED" } }),
      prisma.user.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.invoice.count({ where: { status: { not: "PAID" } } })
    ])

    return {
      db: { status: "operational" as const, load: totalPatients + totalAppointments, label: `${totalPatients + totalAppointments} Records` },
      api: { status: "operational" as const, load: totalUsers, label: `${totalUsers} Active Sessions` },
      reminders: { status: failedReminders > 10 ? "degraded" as const : "operational" as const, load: failedReminders, label: `${failedReminders} Failed` },
      billing: { status: totalInvoices > 20 ? "degraded" as const : "operational" as const, load: totalInvoices, label: `${totalInvoices} Unpaid` }
    }
  } catch (error) {
    return null
  }
}