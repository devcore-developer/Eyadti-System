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
import { Button } from "@/components/ui/button"
import { Monitor, Plus } from "lucide-react"
import { Suspense } from "react"

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

  const where: any = {
    clinicId: session.user.clinicId,
  }

  if (session.user.role === "DOCTOR") {
    where.doctorId = session.user.id
  } else if (filterDoctorId) {
    where.doctorId = filterDoctorId
  }

  if (filterDate) {
    const start = new Date(filterDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(filterDate)
    end.setHours(23, 59, 59, 999)
    where.dateTime = { gte: start, lte: end }
  } else {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    where.dateTime = { gte: start, lte: end }
  }

  if (filterStatus) {
    where.status = filterStatus
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
  
  const baseTodayWhere = {
    clinicId: session.user.clinicId,
    dateTime: { gte: todayStart, lte: todayEnd },
    ...(session.user.role === "DOCTOR" ? { doctorId: session.user.id } : {})
  }

  const [appointments, total, doctors, todayCount, upcomingCount, completedCount, cancelledCount, doctorBookings] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { dateTime: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, name: true } },
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
    // الـ Query الجديدة لعدد حجوزات الدكاترة النهارده
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: baseTodayWhere,
      _count: { id: true }
    })
  ])

  // بناء بيانات الـ Doctor Availability بالأرقام الحقيقية
  const doctorAvailabilityData = doctors.map(doc => {
    const bookedData = doctorBookings.find(b => b.doctorId === doc.id)
    const booked = bookedData?._count.id || 0
    const maxSlots = doc.maxDailyAppointments || 20
    const duration = doc.appointmentDuration || 30
    
    return {
      id: doc.id,
      name: doc.name,
      booked: booked,
      total: maxSlots,
      remaining: Math.max(0, maxSlots - booked),
      duration: duration
    }
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const canCreate = session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST"
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST"
  
  const serializableParams: Record<string, string> = {}
  if (filterDate) serializableParams.date = filterDate
  if (filterDoctorId) serializableParams.doctorId = filterDoctorId
  if (filterStatus) serializableParams.status = filterStatus

  return (
    <div className="space-y-8 animate-fade pb-20">
      <AppointmentHeader totalToday={todayCount} upcomingCount={upcomingCount} />
      <AppointmentKPIs today={todayCount} upcoming={upcomingCount} completed={completedCount} cancelled={cancelledCount} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <Suspense fallback={<div className="h-12 w-full bg-muted/50 rounded-2xl animate-pulse" />}>
              <AppointmentFilters doctors={doctors} />
            </Suspense>
            
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {isAdmin && (
                <Link href="/appointments/online">
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl border-dashed">
                    <Monitor className="h-4 w-4" />
                    Online
                  </Button>
                </Link>
              )}
              {canCreate && (
                <Link href="/appointments/new">
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
                    <Plus className="h-4 w-4" />
                    Schedule
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] shadow-[0_15px_35px_rgba(100,116,139,0.10)] p-6">
            <AppointmentTable
              appointments={appointments}
              role={session.user.role}
              userId={session.user.id}
              currentPage={page}
              totalPages={totalPages}
              searchParams={serializableParams}
            />
          </div>
        </div>

        <div className="space-y-8">
          {/* تمرير أول 5 مواعيد حقيقية لـ Timeline */}
          <TodayTimeline appointments={appointments.slice(0, 5)} />
          {/* تمرير بيانات الدكاترة المحسوبة لـ Availability */}
          <DoctorAvailability doctors={doctorAvailabilityData} />
        </div>
      </div>

      <QuickBooking />
    </div>
  )
}