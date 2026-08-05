"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// ─── Helper: Get today's branch for a doctor ────────────────────
export async function getDoctorTodayBranch(doctorId: string): Promise<string | null> {
  const dayOfWeek = new Date().getDay() // 0=Sunday
  const schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId, dayOfWeek, isAvailable: true },
    select: { branchId: true },
  })
  return schedule?.branchId || null
}

// ─── Get today's attendance for all doctors in a clinic ─────────
export async function getTodayAttendance(clinicId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const doctors = await prisma.user.findMany({
    where: { clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const attendances = await prisma.doctorAttendance.findMany({
    where: { clinicId, date: today },
  })

  const attendanceMap = new Map(attendances.map(a => [a.doctorId, a]))

  const result = []
  for (const doc of doctors) {
    const att = attendanceMap.get(doc.id)
    const todayBranch = await getDoctorTodayBranch(doc.id)
    const branchName = todayBranch
      ? (await prisma.branch.findUnique({ where: { id: todayBranch }, select: { name: true } }))?.name || null
      : null

    result.push({
      doctorId: doc.id,
      doctorName: doc.name,
      branchId: todayBranch,
      branchName,
      status: att?.status || "ABSENT",
      checkInTime: att?.checkInTime?.toISOString() || null,
      checkOutTime: att?.checkOutTime?.toISOString() || null,
      attendanceId: att?.id || null,
    })
  }

  return result
}

// ─── Check In ───────────────────────────────────────────────────
export async function checkInDoctor(doctorId: string, branchId: string | null) {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const clinicId = session.user.clinicId
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get doctor's schedule start time for today
  const dayOfWeek = today.getDay()
  const schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId, dayOfWeek, isAvailable: true },
    select: { startTime: true },
  })

  const now = new Date()
  let status = "PRESENT"

  if (schedule) {
    const [h, m] = schedule.startTime.split(":").map(Number)
    const scheduledTime = new Date()
    scheduledTime.setHours(h, m, 0, 0)
    const diffMinutes = (now.getTime() - scheduledTime.getTime()) / 60000
    if (diffMinutes > 30) status = "LATE"
  }

  const attendance = await prisma.doctorAttendance.upsert({
    where: {
      doctorId_date: { doctorId, date: today },
    },
    create: {
      clinicId,
      branchId: branchId || null,
      doctorId,
      date: today,
      checkInTime: now,
      status,
    },
    update: {
      checkInTime: now,
      status,
      branchId: branchId || null,
    },
  })

  return { success: true, data: attendance }
}

// ─── Check Out ──────────────────────────────────────────────────
export async function checkOutDoctor(attendanceId: string) {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const attendance = await prisma.doctorAttendance.update({
    where: { id: attendanceId },
    data: {
      checkOutTime: new Date(),
      status: "FINISHED",
    },
  })

  return { success: true, data: attendance }
}

// ─── Get attendance stats for dashboard ─────────────────────────
export async function getAttendanceStats(clinicId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const attendances = await prisma.doctorAttendance.findMany({
    where: { clinicId, date: today },
  })

  const totalDoctors = await prisma.user.count({
    where: { clinicId, role: "DOCTOR" },
  })

  const present = attendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length
  const late = attendances.filter(a => a.status === "LATE").length
  const absent = totalDoctors - present - attendances.filter(a => a.status === "FINISHED").length
  const finished = attendances.filter(a => a.status === "FINISHED").length

  // Branch coverage
  const branchCoverage = new Map<string, string[]>()
  for (const att of attendances) {
    if (att.branchId) {
      const docs = branchCoverage.get(att.branchId) || []
      docs.push(att.doctorId)
      branchCoverage.set(att.branchId, docs)
    }
  }

  const branches = await prisma.branch.findMany({
    where: { clinicId },
    select: { id: true, name: true },
  })

  const branchCoverageList = branches.map(b => ({
    branchId: b.id,
    branchName: b.name,
    doctorCount: branchCoverage.get(b.id)?.length || 0,
  }))

  return {
    totalDoctors,
    present,
    late,
    absent: Math.max(0, absent),
    finished,
    branchCoverage: branchCoverageList,
  }
}