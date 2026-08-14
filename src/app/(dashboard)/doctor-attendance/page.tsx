import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { hasFeature } from "@/lib/services/feature-gate"
import { DoctorAttendanceClient } from "@/components/dashboard/doctor-attendance-client"

export const dynamic = "force-dynamic"

export default async function DoctorAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const access = await hasFeature(session.user.clinicId, "DOCTOR_ATTENDANCE")
  if (!access) redirect("/dashboard")

  const params = await searchParams
  const dateStr = typeof params.date === "string" ? params.date : new Date().toISOString().split("T")[0]
  const branchFilter = typeof params.branch === "string" ? params.branch : ""

  // ── Fetch branches for filter dropdown ──
  const branches = await prisma.branch.findMany({
    where: { clinicId: session.user.clinicId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  // ── Fetch all doctors in this clinic ──
  const doctors = await prisma.user.findMany({
    where: { clinicId: session.user.clinicId, role: "DOCTOR" },
    select: { id: true, name: true, specialty: true, image: true },
    orderBy: { name: "asc" },
  })

  // ── Parse selected date ──
  const [year, month, day] = dateStr.split("-").map(Number)
  const targetDate = new Date(year, month - 1, day)

  // ── Fetch schedules for today's day of week ──
  const dayOfWeek = targetDate.getUTCDay()
  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId: { in: doctors.map(d => d.id) },
      dayOfWeek,
      isAvailable: true,
    },
    include: {
      branch: { select: { id: true, name: true } },
    },
  })

  // ── Fetch attendance records ──
  const attendanceRecords = await prisma.doctorAttendance.findMany({
    where: {
      clinicId: session.user.clinicId,
      date: targetDate,
      ...(branchFilter ? { branchId: branchFilter } : {}),
    },
    include: {
      doctor: { select: { id: true, name: true, specialty: true, image: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { doctor: { name: "asc" } },
  })

  // ── Build lookup maps ──
  const attendanceMap = new Map(attendanceRecords.map(r => [r.doctorId, r]))
  const scheduleMap = new Map<string, { startTime: string; endTime: string; branchId: string; branchName: string }>()
  for (const s of schedules) {
    scheduleMap.set(s.doctorId, {
      startTime: s.startTime,
      endTime: s.endTime,
      branchId: s.branchId || "",
      branchName: s.branch?.name || "Unassigned",
    })
  }

  // ── Build table data ──
  const tableData = doctors.map(doctor => {
    const attendance = attendanceMap.get(doctor.id)
    const schedule = scheduleMap.get(doctor.id)

    let status = "NOT_CHECKED_IN"
    let checkInTime: string | null = null
    let checkOutTime: string | null = null
    let workingHours: string | null = null
    let scheduledStart = "09:00"
    let scheduledEnd = "17:00"
    let branchName = "Unassigned"

    if (attendance) {
      status = attendance.status
      checkInTime = attendance.checkInTime?.toISOString() || null
      checkOutTime = attendance.checkOutTime?.toISOString() || null
      branchName = attendance.branch?.name || "Unassigned"
    }

    if (schedule) {
      scheduledStart = schedule.startTime
      scheduledEnd = schedule.endTime
      branchName = schedule.branchName
    }

    if (checkInTime && checkOutTime) {
      const inMs = new Date(checkInTime).getTime()
      const outMs = new Date(checkOutTime).getTime()
      const diffMs = outMs - inMs
      const totalMin = Math.max(0, Math.floor(diffMs / 60000))
      const h = Math.floor(totalMin / 60)
      const m = Math.round((totalMin % 60) / 10)
      workingHours = `${h}:${String(m).padStart(2, "0")}`
    }

    return {
      id: attendance?.id || "",
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty || null,
      doctorImage: doctor.image || null,
      branchName,
      scheduledStart,
      scheduledEnd,
      checkInTime,
      checkOutTime,
      workingHours,
      status,
    }
  })

  // ── Calculate KPIs ──
  const presentCount = attendanceRecords.filter(r => r.status === "PRESENT").length
  const absentCount = attendanceRecords.filter(r => r.status === "ABSENT").length
  const checkedOutCount = attendanceRecords.filter(r => r.status === "CHECKED_OUT").length
  const notCheckedInCount = doctors.length - attendanceRecords.length

  return (
    <DoctorAttendanceClient
      tableData={tableData}
      branches={branches}
      doctors={doctors.map(d => ({ value: d.id, label: d.name }))}
      selectedDate={dateStr}
      selectedBranch={branchFilter}
      kpis={{
        totalDoctors: doctors.length,
        presentCount,
        absentCount,
        notCheckedInCount,
      }}
    />
  )
}