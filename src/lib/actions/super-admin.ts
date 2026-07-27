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
    
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0,0,0,0)
    const lastMonthStart = new Date(thisMonthStart)
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)

    const [
      totalClinics, activeClinics, totalUsers, totalDoctors, totalPatients,
      activeTrials, expiringSubs, failedPayments,
      prevTotalClinics, prevTotalPatients, prevTotalDoctors,
      newSubsThisMonth, newSubsLastMonth
    ] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { subscription: { status: "ACTIVE" } } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.patient.count(),
      prisma.clinic.count({ where: { subscription: { status: "TRIAL" } } }),
      prisma.clinic.count({ where: { subscription: { endDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, status: "ACTIVE" } } }),
      prisma.invoice.count({ where: { status: { not: "PAID" } } }),
      prisma.clinic.count({ where: { createdAt: { lt: oneMonthAgo } } }),
      prisma.patient.count({ where: { createdAt: { lt: oneMonthAgo } } }),
      prisma.user.count({ where: { role: "DOCTOR", createdAt: { lt: oneMonthAgo } } }),
      prisma.subscription.count({ where: { status: "ACTIVE", startDate: { gte: thisMonthStart } } }),
      prisma.subscription.count({ where: { status: "ACTIVE", startDate: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ])

    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { monthlyPrice: true } } }
    })
    const mrr = activeSubs.reduce((acc, sub) => acc + (sub.plan?.monthlyPrice || 0), 0)

    const calcGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return parseFloat(((current - previous) / previous * 100).toFixed(1))
    }

    return {
      totalClinics,
      activeClinics,
      totalUsers,
      totalDoctors,
      totalPatients,
      appointmentsToday: 0, 
      mrr,
      activeTrials,
      expiringSubs,
      failedPayments,
      clinicsGrowth: calcGrowth(totalClinics, prevTotalClinics),
      patientsGrowth: calcGrowth(totalPatients, prevTotalPatients),
      doctorsGrowth: calcGrowth(totalDoctors, prevTotalDoctors),
      mrrGrowth: newSubsLastMonth === 0 ? 0 : calcGrowth(newSubsThisMonth, newSubsLastMonth),
    }
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    return null
  }
}

export async function getDashboardSparklines() {
  try {
    await requireRole("SUPER_ADMIN")
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() - (6 - i)); date.setHours(0,0,0,0); return date
    })

    const data = await Promise.all(days.map(async (day) => {
      const nextDay = new Date(day); nextDay.setDate(nextDay.getDate() + 1)
      const [clinics, patients] = await Promise.all([
        prisma.clinic.count({ where: { createdAt: { gte: day, lt: nextDay } } }),
        prisma.patient.count({ where: { createdAt: { gte: day, lt: nextDay } } }),
      ])
      return { clinics, patients }
    }))

    return data
  } catch (error) { return [] }
}

// ✅ قياس صحة النظام الحقيقي (بنقيس سرعة الداتابيز الفعلية)
export async function getRealSystemHealth() {
  try {
    await requireRole("SUPER_ADMIN")

    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - startTime

    const [totalAttachments, failedReminders, pendingAppointments, unpaidInvoices] = await Promise.all([
      prisma.attachment.count(),
      prisma.reminder.count({ where: { status: "FAILED" } }),
      prisma.appointment.count({ where: { status: "SCHEDULED" } }),
      prisma.invoice.count({ where: { status: { not: "PAID" } } })
    ])

    return {
      api: { 
        status: dbLatency < 300 ? "operational" as const : dbLatency < 1000 ? "degraded" as const : "down" as const, 
        load: dbLatency, 
        label: `${dbLatency}ms` 
      },
      db: { status: dbLatency < 100 ? "operational" as const : "degraded" as const, load: pendingAppointments, label: `${pendingAppointments} Pending Tasks` },
      storage: { status: totalAttachments > 500 ? "degraded" as const : "operational" as const, load: totalAttachments, label: `${totalAttachments} Files Stored` },
      jobs: { status: (failedReminders + unpaidInvoices) > 20 ? "degraded" as const : "operational" as const, load: failedReminders + unpaidInvoices, label: `${failedReminders + unpaidInvoices} Issues` }
    }
  } catch (error) { return null }
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
      take: 10
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

    await prisma.auditLog.create({
      data: {
        action: "SUPPORT_MODE_LOGIN",
        userId: session.user.id,
        clinicId: clinicId,
        entityType: "CLINIC",
        entityId: clinicId
      }
    })

    const cookieStore = await cookies()
    cookieStore.set('support_clinic_id', clinicId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60,
      sameSite: 'lax'
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to enter support mode" }
  }
}

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

    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { monthlyPrice: true } } }
    })
    
    const mrr = activeSubs.reduce((acc, sub) => acc + (sub.plan?.monthlyPrice || 0), 0)
    const arr = mrr * 12
    const activeSubsCount = activeSubs.length

    const failedPayments = await prisma.invoice.findMany({
      where: { status: { not: "PAID" } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { clinic: { select: { name: true } } }
    })

    const serializedFailedPayments = failedPayments.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      createdAt: inv.createdAt,
      status: inv.status,
      amount: Number(inv.amount),
      clinic: inv.clinic
    }))

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

    return { mrr, arr, activeSubsCount, failedPayments: serializedFailedPayments, chartData }
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
    
    return clinics.map(c => ({
      ...c,
      features: {
        whatsappEnabled: false, // ✅ تم تعديله ليعكس الواقع لأن Ultramsg مؤجل
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
    const session = await requireRole("SUPER_ADMIN")
    
    await prisma.auditLog.create({
      data: {
        clinicId,
        action: `TOGGLE_FEATURE_${value ? 'ON' : 'OFF'}`,
        userId: session.userId,
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

// ✅ تقرير الأرباح حسب الفترة الزمنية
export async function getRevenueReportData(from: string, to: string) {
  try {
    await requireRole("SUPER_ADMIN")
    
    const startDate = new Date(from)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(to)
    endDate.setHours(23, 59, 59, 999)

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ["ACTIVE", "TRIAL"] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
          { startDate: { lte: endDate }, endDate: null } 
        ]
      },
      include: {
        clinic: { select: { id: true, name: true, owner: { select: { name: true } } } },
        plan: { select: { name: true, monthlyPrice: true } }
      }
    })

    let totalRevenue = 0
    const reportData = subscriptions.map(sub => {
      const subStart = new Date(sub.startDate)
      const subEnd = sub.endDate ? new Date(sub.endDate) : new Date()

      let activeMonthsCount = 0

      // نمر على كل شهر في الفترة اللي اختارها
      let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

      while (cursor <= endCursor) {
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999) // آخر يوم في الشهر

        // لو الاشتراك كان شغل في أي يوم من الشهر ده = شهر كامل فلوس
        if (subStart <= monthEnd && subEnd >= cursor) {
          activeMonthsCount++
        }

        cursor.setMonth(cursor.getMonth() + 1) // نروح للشهر اللي جاي
      }

      // الفلوس = عدد الأشهر الكاملة × سعر الخطة (من غير أي تقسيم)
      const revenue = activeMonthsCount * (sub.plan?.monthlyPrice || 0)
      totalRevenue += revenue

      return {
        clinicName: sub.clinic.name,
        ownerName: sub.clinic.owner?.name || "N/A",
        planName: sub.plan?.name || "Free",
        status: sub.status,
        activeMonths: activeMonthsCount,
        revenue
      }
    })

    return { data: reportData, totalRevenue, startDate: from, endDate: to }
  } catch (error) {
    console.error("Error fetching revenue data:", error)
    return null
  }
}

// ─── SUBSCRIPTION OVERVIEW ───────────────────────────────────────
export async function getSubscriptionOverview() {
  try {
    await requireRole("SUPER_ADMIN")

    const [active, expiringSoon, expired, suspended, cancelled, trial] = await Promise.all([
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          endDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.subscription.count({ where: { status: "EXPIRED" } }),
      prisma.subscription.count({ where: { status: "SUSPENDED" } }),
      prisma.subscription.count({ where: { status: "CANCELLED" } }),
      prisma.subscription.count({ where: { status: "TRIAL" } }),
    ])

    // Subscriptions by plan
    const subsByPlan = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      _count: { id: true }
    })

    const plans = await prisma.plan.findMany({ select: { id: true, name: true } })
    const planChart = subsByPlan.map(sp => ({
      name: plans.find(p => p.id === sp.planId)?.name || 'Unknown',
      value: sp._count.id,
      fill: ['#6B9CFF', '#5BC0BE', '#6BCB77', '#F4B860', '#EF6B6B', '#A78BFA'][subsByPlan.findIndex(s => s.planId === sp.planId) % 6]
    }))

    // Monthly trend - last 6 months
    const monthlyData: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      monthlyData[d.toLocaleString('default', { month: 'short' })] = 0
    }

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const monthlyTrend = await prisma.subscription.findMany({
      where: { startDate: { gte: sixMonthsAgo } },
      select: { startDate: true }
    })

    monthlyTrend.forEach(t => {
      const key = new Date(t.startDate).toLocaleString('default', { month: 'short' })
      if (monthlyData[key] !== undefined) monthlyData[key]++
    })

    const trendChart = Object.entries(monthlyData).map(([month, count]) => ({ month, count }))

    return { active, expiringSoon, expired, suspended, cancelled, trial, planChart, trendChart }
  } catch (error) {
    console.error("Error fetching subscription overview:", error)
    return null
  }
}

// ─── CLINIC OVERVIEW ─────────────────────────────────────────────
export async function getClinicOverview() {
  try {
    await requireRole("SUPER_ADMIN")

    const thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0, 0, 0, 0)

    const [total, active, inactive, newThisMonth] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { subscription: { status: { in: ["ACTIVE", "TRIAL"] } } } }),
      prisma.clinic.count({ where: { OR: [{ subscription: { status: { in: ["EXPIRED", "SUSPENDED", "CANCELLED"] } } }, { subscription: null }] } }),
      prisma.clinic.count({ where: { createdAt: { gte: thisMonthStart } } }),
    ])

    const clinicsWithCounts = await prisma.clinic.findMany({
      select: { _count: { select: { users: true, branches: true, patients: true, appointments: true } } }
    })

    const tc = clinicsWithCounts.length || 1
    return {
      total, active, inactive, newThisMonth,
      avgDoctors: Math.round(clinicsWithCounts.reduce((s, c) => s + c._count.users, 0) / tc),
      avgBranches: Math.round(clinicsWithCounts.reduce((s, c) => s + c._count.branches, 0) / tc),
      avgPatients: Math.round(clinicsWithCounts.reduce((s, c) => s + c._count.patients, 0) / tc),
      avgAppointments: Math.round(clinicsWithCounts.reduce((s, c) => s + c._count.appointments, 0) / tc),
    }
  } catch (error) {
    console.error("Error fetching clinic overview:", error)
    return null
  }
}

// ─── PRIORITY ALERTS ─────────────────────────────────────────────
export async function getPriorityAlerts() {
  try {
    await requireRole("SUPER_ADMIN")

    const alerts: { id: string; priority: "critical" | "warning" | "info"; title: string; description: string; action: string; actionLabel: string }[] = []

    const expiredSubs = await prisma.clinic.count({ where: { subscription: { status: "EXPIRED" } } })
    if (expiredSubs > 0) alerts.push({ id: 'expired-subs', priority: 'critical', title: `${expiredSubs} Expired Subscriptions`, description: 'Clinics with expired subscriptions need immediate renewal or suspension.', action: '/super-admin/billing', actionLabel: 'Review' })

    const failedPayments = await prisma.invoice.count({ where: { status: { not: "PAID" } } })
    if (failedPayments > 10) alerts.push({ id: 'failed-payments', priority: 'critical', title: `${failedPayments} Unpaid Invoices`, description: 'High volume of unpaid invoices requiring follow-up.', action: '/super-admin/billing', actionLabel: 'Review' })

    const failedReminders = await prisma.reminder.count({ where: { status: "FAILED" } })
    if (failedReminders > 5) alerts.push({ id: 'failed-reminders', priority: 'critical', title: `${failedReminders} Failed Notifications`, description: 'Background job failures detected in notification service.', action: '/super-admin/system-health', actionLabel: 'Check' })

    const expiringSoon = await prisma.clinic.count({ where: { subscription: { status: "ACTIVE", endDate: { lte: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) } } } })
    if (expiringSoon > 0) alerts.push({ id: 'expiring-soon', priority: 'warning', title: `${expiringSoon} Subscriptions Expiring Soon`, description: 'Within the next 5 days. Proactive renewal recommended.', action: '/super-admin/billing', actionLabel: 'Review' })

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const newClinics = await prisma.clinic.count({ where: { createdAt: { gte: weekAgo } } })
    if (newClinics > 0) alerts.push({ id: 'new-clinics', priority: 'info', title: `${newClinics} New Clinics This Week`, description: 'New clinics registered on the platform.', action: '/super-admin/clinics', actionLabel: 'View' })

    return alerts.sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.priority] - { critical: 0, warning: 1, info: 2 }[b.priority]))
  } catch (error) {
    console.error("Error fetching priority alerts:", error)
    return []
  }
}

// ─── SYSTEM METRICS ──────────────────────────────────────────────
export async function getSystemMetrics() {
  try {
    await requireRole("SUPER_ADMIN")

    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - startTime

    const totalAttachments = await prisma.attachment.count()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [dau, wau, mau] = await Promise.all([
      prisma.auditLog.groupBy({ by: ['userId'], where: { createdAt: { gte: todayStart } } }),
      prisma.auditLog.groupBy({ by: ['userId'], where: { createdAt: { gte: weekAgo } } }),
      prisma.auditLog.groupBy({ by: ['userId'], where: { createdAt: { gte: monthAgo } } }),
    ])

    const totalLogs = await prisma.auditLog.count()
    const errorLogs = await prisma.auditLog.count({ where: { action: { contains: 'ERROR' } } })

    return {
      dbLatency,
      storageUsed: totalAttachments,
      dau: dau.length,
      wau: wau.length,
      mau: mau.length,
      errorRate: totalLogs > 0 ? parseFloat(((errorLogs / totalLogs) * 100).toFixed(1)) : 0
    }
  } catch (error) {
    console.error("Error fetching system metrics:", error)
    return null
  }
}

// ─── CLINIC LIFECYCLE ACTIONS ──────────────────────────────────

export async function renewSubscription(clinicId: string, daysToAdd: number) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    const sub = await prisma.subscription.findUnique({ where: { clinicId } })
    if (!sub) return { success: false, error: "No subscription found for this clinic" }

    // نحدد تاريخ البداية: لو الاشتراك لسهactive نضيف على الـ endDate، لو expired نبدأ من اليوم
    const baseDate = sub.endDate && new Date(sub.endDate) > new Date() ? new Date(sub.endDate) : new Date()
    const newEndDate = new Date(baseDate)
    newEndDate.setDate(newEndDate.getDate() + daysToAdd)

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { 
        endDate: newEndDate, 
        status: "ACTIVE", 
        cancelledAt: null 
      }
    })

    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: session.user.id,
        action: "SUBSCRIPTION_RENEWED",
        entityType: "SUBSCRIPTION",
        entityId: sub.id
      }
    })

    return { success: true, newEndDate }
  } catch (error: any) {
    console.error("Renewal error:", error)
    return { success: false, error: error.message || "Failed to renew" }
  }
}

export async function suspendClinic(clinicId: string, reason?: string) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    // نحدث حالة الاشتراك لتكون SUSPENDED (احتياطي مؤقت لحد ما تضيف الحقل في الـ Schema)
    await prisma.subscription.updateMany({
      where: { clinicId },
      data: { status: "SUSPENDED" }
    })

    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: session.user.id,
        action: "CLINIC_SUSPENDED",
        entityType: "CLINIC",
        entityId: clinicId
      }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to suspend" }
  }
}

export async function activateClinic(clinicId: string) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    // نرجع الاشتراك للحالة اللي كانت عليها (ACTIVE لو عليه فلوس، ولا نسيبه زي ما هو)
    const sub = await prisma.subscription.findUnique({ where: { clinicId } })
    if (sub) {
      const newStatus = sub.endDate && new Date(sub.endDate) > new Date() ? "ACTIVE" : "EXPIRED"
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: newStatus }
      })
    }

    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: session.user.id,
        action: "CLINIC_ACTIVATED",
        entityType: "CLINIC",
        entityId: clinicId
      }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to activate" }
  }
}

export async function archiveClinic(clinicId: string) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    // نحدث حالة الاشتراك لتكون CANCELLED كدليل على الأرشفة
    await prisma.subscription.updateMany({
      where: { clinicId },
      data: { status: "CANCELLED" }
    })

    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: session.user.id,
        action: "CLINIC_ARCHIVED",
        entityType: "CLINIC",
        entityId: clinicId
      }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to archive" }
  }
}

export async function permanentDeleteClinic(clinicId: string) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    // نسجل الـ Audit Log الأول لأننا ه نمسح العيادة
    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: session.user.id,
        action: "CLINIC_PERMANENTLY_DELETED",
        entityType: "CLINIC",
        entityId: clinicId
      }
    })

    // تنبيه: يتطلب إعداد onDelete: Cascade في الـ Prisma Schema
    await prisma.clinic.delete({ where: { id: clinicId } })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete permanently" }
  }
}

// جلب سجل التغييرات (Plan History)
export async function getClinicHistory(clinicId: string) {
  try {
    await requireRole("SUPER_ADMIN")
    return await prisma.auditLog.findMany({
      where: { clinicId, action: { in: ["SUBSCRIPTION_RENEWED", "PLAN_ASSIGNED", "CLINIC_SUSPENDED", "CLINIC_ACTIVATED", "CLINIC_ARCHIVED"] } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  } catch (error) {
    return []
  }
}

// ─── SUPPORT MODE ENHANCEMENTS ─────────────────────────────────
export async function getSupportModeClinicData(clinicId: string) {
  try {
    await requireRole("SUPER_ADMIN")
    
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true, 
        name: true, 
        owner: { select: { name: true, email: true } },
        subscription: {
          select: {
            status: true, 
            plan: { select: { name: true } },
          }
        },
        _count: {
          select: { 
            users: true, 
            branches: true, 
            patients: true, 
            appointments: true
          }
        }
      }
    })

    if (!clinic) return null

    const lastActivity = await prisma.auditLog.findFirst({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })

    return { 
      id: clinic.id,
      name: clinic.name,
      owner: clinic.owner,
      subscription: clinic.subscription,
      _count: clinic._count,
      diagnostics: {
        storageUsed: 0, 
        lastActivity: lastActivity,
        failedJobs: 0,
        unpaidInvoices: 0
      }
    }
  } catch (error) {
    console.error("Error fetching support clinic data:", error)
    return null
  }
}

export async function logSupportAction(clinicId: string, action: string, details?: string) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") return
    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: session.user.id,
        action: `SUPPORT_MODE_${action}`,
        entityType: "SUPPORT_SESSION",
        entityId: clinicId,
        // Assuming you have a metadata or details field, otherwise log to console
      }
    })
  } catch (error) { console.error("Support log error:", error) }
}

// ─── ANNOUNCEMENTS SYSTEM ──────────────────────────────
export async function createAnnouncement(data: {
  title: string; 
  message: string; 
  type: "INFO" | "WARNING" | "CRITICAL";
  targetAll: boolean; 
  targetClinicIds?: string[]; 
  targetPlanIds?: string[];
  startsAt: Date; 
  endsAt: Date | null; 
  isDismissible: boolean; 
  requireConfirmation: boolean;
}) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")
    
    await prisma.announcement.create({ 
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        targetAll: data.targetAll,
        targetClinicIds: data.targetClinicIds || [],
        targetPlanIds: data.targetPlanIds || [],
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        isDismissible: data.isDismissible,
        requireConfirmation: data.requireConfirmation,
        createdByUserId: session.user.id
      } 
    })
    
    return { success: true }
  } catch (error: any) {
    console.error("Error creating announcement:", error)
    return { success: false, error: error.message || "Failed to create announcement" }
  }
}

export async function getAnnouncements() {
  try {
    await requireRole("SUPER_ADMIN")
    return await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  } catch (error) {
    return []
  }
}
// ─── PLATFORM USAGE METRICS ────────────────────────────────────
export async function getPlatformUsageMetrics() {
  try {
    await requireRole("SUPER_ADMIN")
    
    const totalAttachments = await prisma.attachment.count()
    const totalAppointments = await prisma.appointment.count()
    
    // Active users in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const dailyActiveUsers = (await prisma.auditLog.groupBy({
      by: ['userId'], where: { createdAt: { gte: yesterday } }
    })).length

    return {
      storageUsed: totalAttachments,
      totalAppointments,
      dailyActiveUsers,
      dbSize: "Calculated via DB Query", // Placeholder for raw SQL if needed
      bandwidth: "N/A (Check Cloudflare/Provider)"
    }
  } catch (error) {
    return null
  }
}