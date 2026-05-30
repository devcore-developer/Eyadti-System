import { prisma } from "@/lib/db"
import { getDateRange, type FilterPeriod } from "@/lib/utils/date-filters"
import { startOfMonth, subMonths, format, startOfDay, endOfDay } from "date-fns"

// ───────────────────────────────────────
// Summary Stats
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
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { clinicId, status: "PAID" },
    }),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { clinicId, status: "PAID", createdAt: { gte: from, lte: to } },
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
// Chart Data (Last 12 Months) - OPTIMIZED
// ───────────────────────────────────────
export async function getChartData(clinicId: string) {
  const now = new Date()
  const twelveMonthsAgo = subMonths(startOfMonth(now), 11)

  // ✅ جلب كل الداتا في 3 Queries بس بدل 36 Query
  const [invoices, appointments, patients] = await Promise.all([
    prisma.invoice.findMany({
      where: { clinicId, status: "PAID", createdAt: { gte: twelveMonthsAgo } },
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

  // ✅ ترتيب الداتا في الذاكرة (أسرع بـ 100 مرة من الـ Database)
  const months = []
  for (let i = 11; i >= 0; i--) {
    const date = subMonths(now, i)
    const monthStart = startOfMonth(date)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    const monthName = format(date, "MMM")

    const monthRevenue = invoices
      .filter(inv => inv.createdAt >= monthStart && inv.createdAt <= monthEnd)
      .reduce((sum, inv) => sum + Number(inv.amount), 0)

    const monthAppointments = appointments.filter(apt => apt.dateTime >= monthStart && apt.dateTime <= monthEnd).length

    const monthPatients = patients.filter(pat => pat.createdAt >= monthStart && pat.createdAt <= monthEnd).length

    months.push({
      name: monthName,
      revenue: monthRevenue,
      appointments: monthAppointments,
      patients: monthPatients,
    })
  }

  return months
}

// ───────────────────────────────────────
// Helper: get patient name regardless of schema
// ───────────────────────────────────────
function getPatientName(p: Record<string, unknown>): string {
  if (typeof p.fullName === "string") return p.fullName
  if (typeof p.name === "string") return p.name
  const first = typeof p.firstName === "string" ? p.firstName : ""
  const last = typeof p.lastName === "string" ? p.lastName : ""
  return `${first} ${last}`.trim() || "Unknown"
}

function getDoctorName(d: Record<string, unknown>): string {
  if (typeof d.name === "string") return d.name
  const first = typeof d.firstName === "string" ? d.firstName : ""
  const last = typeof d.lastName === "string" ? d.lastName : ""
  return `Dr. ${first} ${last}`.trim() || "Unknown"
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
    }),
    prisma.appointment.findMany({
      where: { clinicId },
      orderBy: { dateTime: "desc" },
      take: 5,
      include: { patient: true, doctor: true },
    }),
    prisma.invoice.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { patient: true },
    }),
  ])

  return {
    patients: patients.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: getPatientName(p),
      createdAt: p.createdAt as Date,
    })),
    appointments: appointments.map((a: Record<string, unknown>) => ({
      id: a.id as string,
      dateTime: a.dateTime as Date,
      status: a.status as string,
      patientName: getPatientName(a.patient as Record<string, unknown>),
      doctorName: getDoctorName(a.doctor as Record<string, unknown>),
    })),
    invoices: invoices.map((inv: Record<string, unknown>) => ({
      id: inv.id as string,
      amount: Number((inv.amount as { toString(): string }) ?? 0),
      status: inv.status as string,
      createdAt: inv.createdAt as Date,
      patientName: getPatientName(inv.patient as Record<string, unknown>),
    })),
  }
}

// ───────────────────────────────────────
// Doctor Analytics - OPTIMIZED
// ───────────────────────────────────────
export async function getDoctorAnalytics(clinicId: string) {
  const doctors = await prisma.user.findMany({
    where: { clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
  })

  if (doctors.length === 0) return []

  const doctorIds = doctors.map(d => d.id)

  // ✅ جلب كل المواعيد للأطباء في Query واحدة فقط
  const appointments = await prisma.appointment.findMany({
    where: { clinicId, doctorId: { in: doctorIds } },
    select: { doctorId: true, patientId: true },
  })

  // ✅ ترتيب الداتا في الذاكرة
  const analytics = doctors.map(doctor => {
    const docAppointments = appointments.filter(apt => apt.doctorId === doctor.id)
    const uniquePatients = new Set(docAppointments.map(apt => apt.patientId))

    return {
      id: doctor.id,
      name: getDoctorName(doctor),
      specialization: null,
      patientCount: uniquePatients.size,
      appointmentCount: docAppointments.length,
    }
  })

  return analytics.sort((a, b) => b.appointmentCount - a.appointmentCount)
}