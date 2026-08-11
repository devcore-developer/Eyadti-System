import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AppointmentTable } from "@/components/appointments/appointment-table"
import { AppointmentFilters } from "@/components/appointments/appointment-filters"
import { AppointmentHeader } from "@/components/appointments/appointment-header"
import { AppointmentKPIs } from "@/components/appointments/appointment-kpis"
import { TodayTimeline } from "@/components/appointments/today-timeline"
import { DoctorAvailability } from "@/components/appointments/doctor-availability"
import { QuickBooking } from "@/components/appointments/quick-booking"
import { UnifiedAppointmentDrawer } from "@/components/appointments/unified-appointment-drawer"
import { MarkNoShowButton } from "@/components/appointments/mark-no-show-button"
import { Button } from "@/components/ui/button"
import { Monitor } from "lucide-react"
import { Suspense } from "react"
import { PageWrapper } from "@/components/ui/page-wrapper"
import { TableSkeleton } from "@/components/ui/premium-skeletons"

const PAGE_SIZE = 20

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const filterDate = typeof params.date === "string" ? params.date : ""
  const filterDoctorId = typeof params.doctorId === "string" ? params.doctorId : ""
  const filterStatus = typeof params.status === "string" ? params.status : ""

  const preselectedPatientId = typeof params.patientId === "string" ? params.patientId : ""
  const preselectedType = typeof params.type === "string" ? params.type : ""

  // ══════════════════════════════════════════════════
  // GET CLINIC PAYMENT POLICY
  // ══════════════════════════════════════════════════
  const clinicSettings = await prisma.clinicSettings.findUnique({
    where: { clinicId: session.user.clinicId },
    select: { paymentWorkflow: true }
  })
  const clinicPaymentPolicy = (clinicSettings?.paymentWorkflow || "PAY_AFTER_VISIT") as string

  // ══════════════════════════════════════════════════
  // BUILD WHERE CLAUSE
  // ══════════════════════════════════════════════════
  const where: any = { clinicId: session.user.clinicId }

  if (session.user.role === "DOCTOR") {
    where.doctorId = session.user.id
  } else if (filterDoctorId) {
    where.doctorId = filterDoctorId
  }

  const now = new Date()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

  // ══════════════════════════════════════════════════
  // FIX: Default shows today AND future appointments
  // Specific date filter shows only that date
  // ══════════════════════════════════════════════════
  if (filterDate) {
    const start = new Date(filterDate); start.setHours(0, 0, 0, 0)
    const end = new Date(filterDate); end.setHours(23, 59, 59, 999)
    where.dateTime = { gte: start, lte: end }
  } else {
    // ═══ FIX: Changed from { gte: todayStart, lte: todayEnd } ═══
    // Now shows today + all future appointments by default
    where.dateTime = { gte: todayStart }
  }

  if (filterStatus) {
    where.status = filterStatus
  }

  // ══════════════════════════════════════════════════
  // FETCH DATA IN PARALLEL
  // ══════════════════════════════════════════════════
  const baseTodayWhere: any = {
    clinicId: session.user.clinicId,
    dateTime: { gte: todayStart, lte: todayEnd },
    ...(session.user.role === "DOCTOR" ? { doctorId: session.user.id } : {})
  }

  const [appointments, total, doctors, todayCount, scheduledCount, completedCount, cancelledCount, noShowCount, doctorBookings] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { dateTime: "asc" }, // ═══ FIX: Changed to "asc" so future appointments appear in chronological order ═══
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        patient: { select: { id: true, fullName: true, phone: true, gender: true, dateOfBirth: true } }, // ═══ FIX: Added phone for check-in display ═══
        doctor: { select: { id: true, name: true } },
        visit: { select: { id: true, status: true, queueNumber: true } }, // ═══ FIX: Added queueNumber ═══
      },
    }),
    prisma.appointment.count({ where }),
    session.user.role !== "DOCTOR"
      ? prisma.user.findMany({
          where: { clinicId: session.user.clinicId, role: "DOCTOR" },
          select: { id: true, name: true, appointmentDuration: true, maxDailyAppointments: true },
        })
      : [],
    prisma.appointment.count({ where: baseTodayWhere }),
    prisma.appointment.count({ where: { ...baseTodayWhere, status: "SCHEDULED" } }),
    prisma.appointment.count({ where: { ...baseTodayWhere, status: "COMPLETED" } }),
    prisma.appointment.count({ where: { ...baseTodayWhere, status: "CANCELLED" } }),
    prisma.appointment.count({ where: { ...baseTodayWhere, status: "NO_SHOW" } }),
    prisma.appointment.groupBy({
      by: ["doctorId"],
      where: baseTodayWhere,
      _count: { id: true }
    })
  ])

  // ══════════════════════════════════════════════════
  // BATCH FETCH PAYMENT INFO (single query, no N+1)
  // ══════════════════════════════════════════════════
  const appointmentIds = appointments.map(a => a.id)
  const invoices = appointmentIds.length > 0
    ? await prisma.invoice.findMany({
        where: { appointmentId: { in: appointmentIds } },
        include: {
          payments: { where: { method: { not: "REFUND" } } }
        }
      })
    : []

  type PaymentMapValue = { totalAmount: number; totalPaid: number; remaining: number; status: "NO_INVOICE" | "UNPAID" | "PARTIALLY_PAID" | "PAID"; hasInvoice: boolean; paymentCount: number }
  const paymentMap = new Map<string, PaymentMapValue>()
  for (const inv of invoices) {
    if (!inv.appointmentId) continue
    const existing = paymentMap.get(inv.appointmentId) || { totalAmount: 0, totalPaid: 0, remaining: 0, status: "NO_INVOICE" as const, hasInvoice: false, paymentCount: 0 }
    existing.totalAmount += Number(inv.amount)
    existing.totalPaid += inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    existing.hasInvoice = true
    existing.paymentCount += inv.payments.length
    paymentMap.set(inv.appointmentId, existing)
  }
  for (const [, info] of paymentMap) {
    info.remaining = Math.max(0, info.totalAmount - info.totalPaid)
    if (info.totalPaid >= info.totalAmount) info.status = "PAID"
    else if (info.totalPaid > 0) info.status = "PARTIALLY_PAID"
    else info.status = "UNPAID"
  }

  // ══════════════════════════════════════════════════
  // ENRICH APPOINTMENTS WITH COMPUTED FIELDS
  // ══════════════════════════════════════════════════
  const enrichedAppointments = appointments.map(apt => ({
    ...apt,
    isToday: apt.dateTime >= todayStart && apt.dateTime <= todayEnd,
    isPast: apt.dateTime < now,
    isOverdue: apt.status === "SCHEDULED" && apt.dateTime < now && !apt.visit,
    isFuture: apt.dateTime > todayEnd,
    paymentInfo: paymentMap.get(apt.id) || null,
    // ═══ FIX: Normalize visit.queueNumber from null to undefined ═══
    visit: apt.visit ? {
      ...apt.visit,
      queueNumber: apt.visit.queueNumber ?? undefined,
    } : null,
  }))

  // ══════════════════════════════════════════════════
  // DOCTOR AVAILABILITY
  // ══════════════════════════════════════════════════
  const doctorAvailabilityData = doctors.map(doc => {
    const bookedData = doctorBookings.find(b => b.doctorId === doc.id)
    const booked = bookedData?._count.id || 0
    const maxSlots = doc.maxDailyAppointments || 20
    const duration = doc.appointmentDuration || 30
    return { id: doc.id, name: doc.name, booked, total: maxSlots, remaining: Math.max(0, maxSlots - booked), duration }
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const canCreate = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST"
  const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN"

  // Count overdue (scheduled + past + no visit) for the "Mark No-Show" button
  const overdueCount = enrichedAppointments.filter(a => a.isOverdue).length

  const serializableParams: Record<string, string> = {}
  if (filterDate) serializableParams.date = filterDate
  if (filterDoctorId) serializableParams.doctorId = filterDoctorId
  if (filterStatus) serializableParams.status = filterStatus

  return (
    <PageWrapper className="pb-20">
      <AppointmentHeader totalToday={todayCount} upcomingCount={scheduledCount} />
      <AppointmentKPIs
        today={todayCount}
        upcoming={scheduledCount}
        completed={completedCount}
        cancelled={cancelledCount}
        noShow={noShowCount}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <Suspense fallback={<div className="h-10 w-full md:w-72 bg-muted/50 rounded-xl animate-pulse" />}>
              <AppointmentFilters doctors={doctors} />
            </Suspense>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              {isAdmin && overdueCount > 0 && (
                <MarkNoShowButton
                  clinicId={session.user.clinicId}
                  count={overdueCount}
                />
              )}

              {isAdmin && (
                <Link href="/appointments/online">
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl border-dashed">
                    <Monitor className="h-4 w-4" />
                    Online
                  </Button>
                </Link>
              )}

              {canCreate && (
                <UnifiedAppointmentDrawer
                  doctors={doctors}
                  clinicId={session.user.clinicId}
                  preselectedPatientId={preselectedPatientId}
                  preselectedType={preselectedType}
                />
              )}
            </div>
          </div>

          <Suspense fallback={<TableSkeleton rows={5} />}>
            <AppointmentTable
              appointments={enrichedAppointments}
              role={session.user.role}
              userId={session.user.id}
              currentPage={page}
              totalPages={totalPages}
              searchParams={serializableParams}
              clinicPaymentPolicy={clinicPaymentPolicy}
            />
          </Suspense>
        </div>

        <div className="space-y-6 md:space-y-8">
          <TodayTimeline appointments={enrichedAppointments.filter(a => a.isToday).slice(0, 5)} />
          <DoctorAvailability doctors={doctorAvailabilityData} />
        </div>
      </div>

      <QuickBooking />
    </PageWrapper>
  )
}