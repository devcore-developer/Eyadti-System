// src/lib/queries/dashboard.ts

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
      where: {
        clinicId,
        dateTime: { gte: todayStart, lte: todayEnd },
      },
    }),

    prisma.appointment.count({
      where: {
        clinicId,
        dateTime: { gte: new Date() },
        status: "SCHEDULED",
      },
    }),

    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { clinicId, status: "PAID" },
    }),

    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: {
        clinicId,
        status: "PAID",
        createdAt: { gte: from, lte: to },
      },
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
// Chart Data (Last 12 Months)
// ───────────────────────────────────────
export async function getChartData(clinicId: string) {
  const months = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = subMonths(now, i)
    const monthStart = startOfMonth(date)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    const monthName = format(date, "MMM")

    const [revenue, appointments, patients] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          clinicId,
          status: "PAID",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId,
          dateTime: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.patient.count({
        where: {
          clinicId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
    ])

    months.push({
      name: monthName,
      revenue: Number(revenue._sum?.amount ?? 0),
      appointments,
      patients,
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
      include: {
        patient: true,
        doctor: true,
      },
    }),
    prisma.invoice.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        patient: true,
      },
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
// Doctor Analytics
// ───────────────────────────────────────
export async function getDoctorAnalytics(clinicId: string) {
  const doctors = await prisma.user.findMany({
    where: {
      clinicId,
      role: "DOCTOR",
    },
  })

  const analytics = await Promise.all(
    doctors.map(async (doctor: Record<string, unknown>) => {
      const doctorId = doctor.id as string

      const [patientCount, appointmentCount] = await Promise.all([
        prisma.appointment
          .groupBy({
            by: ["patientId"],
            where: { doctorId, clinicId },
            _count: true,
          })
          .then((r) => r.length),

        prisma.appointment.count({
          where: { doctorId, clinicId },
        }),
      ])

      return {
        id: doctorId,
        name: getDoctorName(doctor),
        specialization: (doctor.specialization as string) || null,
        patientCount,
        appointmentCount,
      }
    })
  )

  return analytics.sort((a, b) => b.appointmentCount - a.appointmentCount)
}