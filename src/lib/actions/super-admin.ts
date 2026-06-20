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