import { prisma } from "@/lib/db"
import { getDateRange, type FilterPeriod } from "@/lib/utils/date-filters"
import { startOfMonth, subMonths, format, startOfDay, endOfDay } from "date-fns"

// ───────────────────────────────────────
// Summary Stats — FIXED: Revenue from Payments
// ───────────────────────────────────────
export async function getDashboardStats(clinicId: string, period: FilterPeriod) {
  const { from, to } = getDateRange(period)
  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())

  const [
    totalPatients,
    newPatients,
    todayAppointments,
    upcomingAppointments,
    totalRevenueResult,
    monthlyRevenueResult,
    unpaidInvoicesCount,
    unpaidInvoicesAmount,
  ] = await Promise.all([
    prisma.patient.count({ where: { clinicId } }),
    prisma.patient.count({
      where: { clinicId, createdAt: { gte: from, lte: to } },
    }),
    prisma.appointment.count({
      where: { clinicId, dateTime: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.appointment.count({
      where: { clinicId, dateTime: { gte: new Date() }, status: "SCHEDULED" },
    }),
    // ═══ FIXED: Sum from Payment table, not Invoice.amount ═══
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { clinicId, method: { not: "REFUND" } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { clinicId, method: { not: "REFUND" }, createdAt: { gte: from, lte: to } },
    }),
    prisma.invoice.count({
      where: { clinicId, status: { in: ["UNPAID", "PARTIAL"] } },
    }),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { clinicId, status: { in: ["UNPAID", "PARTIAL"] } },
    }),
  ])

  return {
    totalPatients,
    newPatients,
    todayAppointments,
    upcomingAppointments,
    totalRevenue: Number(totalRevenueResult._sum?.amount ?? 0),
    monthlyRevenue: Number(monthlyRevenueResult._sum?.amount ?? 0),
    unpaidInvoicesCount,
    unpaidInvoicesAmount: Number(unpaidInvoicesAmount._sum?.amount ?? 0),
  }
}

// ───────────────────────────────────────
// Chart Data (Last 12 Months) — FIXED
// ───────────────────────────────────────
export async function getChartData(clinicId: string) {
  const now = new Date()
  const twelveMonthsAgo = subMonths(startOfMonth(now), 11)

  // ═══ FIXED: Fetch payments instead of invoices for revenue ═══
  const [payments, appointments, patients] = await Promise.all([
    prisma.payment.findMany({
      where: { clinicId, method: { not: "REFUND" }, createdAt: { gte: twelveMonthsAgo } },
      select: { amount: true, createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { clinicId, dateTime: { gte: twelveMonthsAgo } },
      select: { dateTime: true },
    }),
    prisma.patient.findMany({
      where: { clinicId, createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    }),
  ])

  const months = []
  for (let i = 11; i >= 0; i--) {
    const date = subMonths(now, i)
    const monthStart = startOfMonth(date)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    const monthName = format(date, "MMM")

    // ═══ FIXED: Revenue from actual payments, not invoices ═══
    const monthRevenue = payments
      .filter(p => p.createdAt >= monthStart && p.createdAt <= monthEnd)
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const monthAppointments = appointments.filter(apt => apt.dateTime >= monthStart && apt.dateTime <= monthEnd).length

    const monthPatients = patients.filter(pat => pat.createdAt >= monthStart && pat.createdAt <= monthEnd).length

    months.push({
      name: monthName,
      revenue: monthRevenue,
      appointments: monthAppointments || 0,
      patients: monthPatients || 0,
    })
  }

  if (months.every(m => m.revenue === 0 && m.appointments === 0 && m.patients === 0)) {
    return [
      { name: "Jan", revenue: 0, appointments: 0, patients: 0 },
      { name: "Feb", revenue: 0, appointments: 0, patients: 0 },
      { name: "Mar", revenue: 0, appointments: 0, patients: 0 },
      { name: "Apr", revenue: 0, appointments: 0, patients: 0 },
      { name: "May", revenue: 0, appointments: 0, patients: 0 },
      { name: "Jun", revenue: 0, appointments: 0, patients: 0 },
      { name: "Jul", revenue: 0, appointments: 0, patients: 0 },
      { name: "Aug", revenue: 0, appointments: 0, patients: 0 },
      { name: "Sep", revenue: 0, appointments: 0, patients: 0 },
      { name: "Oct", revenue: 0, appointments: 0, patients: 0 },
      { name: "Nov", revenue: 0, appointments: 0, patients: 0 },
      { name: "Dec", revenue: 0, appointments: 0, patients: 0 },
    ]
  }

  return months
}

// ───────────────────────────────────────
// Recent Activity
// ───────────────────────────────────────
export async function getRecentActivity(clinicId: string) {
  const [patients, appointments, invoices] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { clinicId },
      orderBy: { dateTime: "desc" },
      take: 5,
      select: {
        id: true,
        dateTime: true,
        status: true,
        patient: { select: { fullName: true } },
        doctor: { select: { name: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        patient: { select: { fullName: true } },
      },
    }),
  ])

  return {
    patients: patients.map(p => ({
      id: p.id,
      name: p.fullName || "Unknown",
      createdAt: p.createdAt,
    })),
    appointments: appointments.map(a => ({
      id: a.id,
      dateTime: a.dateTime,
      status: a.status,
      patientName: a.patient?.fullName || "Unknown",
      doctorName: a.doctor?.name ? `Dr. ${a.doctor.name}` : "Unknown",
    })),
    invoices: invoices.map(inv => ({
      id: inv.id,
      amount: Number(inv.amount ?? 0),
      status: inv.status,
      createdAt: inv.createdAt,
      patientName: inv.patient?.fullName || "Unknown",
    })),
  }
}

// ───────────────────────────────────────
// Doctor Analytics
// ───────────────────────────────────────
export async function getDoctorAnalytics(clinicId: string) {
  const doctors = await prisma.user.findMany({
    where: { clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
  })

  if (doctors.length === 0) return []

  const doctorIds = doctors.map(d => d.id)

  const appointmentCounts = await prisma.appointment.groupBy({
    by: ["doctorId"],
    where: { clinicId, doctorId: { in: doctorIds } },
    _count: { id: true },
  })

  const uniquePatientCounts = await prisma.appointment.groupBy({
    by: ["doctorId"],
    where: { clinicId, doctorId: { in: doctorIds } },
    _count: { patientId: true },
  })

  const analytics = doctors.map(doctor => {
    const countData = appointmentCounts.find(c => c.doctorId === doctor.id)
    const patientData = uniquePatientCounts.find(p => p.doctorId === doctor.id)

    return {
      id: doctor.id,
      name: `Dr. ${doctor.name}`,
      specialization: null,
      patientCount: patientData?._count.patientId ?? 0,
      appointmentCount: countData?._count.id ?? 0,
    }
  })

  return analytics.sort((a, b) => b.appointmentCount - a.appointmentCount)
}