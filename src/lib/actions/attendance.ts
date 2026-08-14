"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { auditLog } from "@/lib/services/audit"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"

// ─── Check In Doctor ────────────────────────────────────────

export async function checkInDoctor(
  attendanceId: string | null,
  doctorId: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Only admins and receptionists can manage attendance" }
  }

  const clinicId = session.user.clinicId
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (attendanceId) {
    const record = await prisma.doctorAttendance.findFirst({
      where: { id: attendanceId, clinicId },
    })
    if (!record) return { success: false, error: "Attendance record not found" }

    await prisma.doctorAttendance.update({
      where: { id: attendanceId },
      data: {
        checkInTime: new Date(),
        status: "PRESENT",
      },
    })

    await auditLog({
      clinicId,
      userId: session.user.id,
      action: "CHECK_IN" as any,
      entityType: "DOCTOR_ATTENDANCE" as any,
      entityId: attendanceId,
      newValues: { doctorId: record.doctorId, date: record.date },
    })
  } else if (doctorId) {
    const existing = await prisma.doctorAttendance.findFirst({
      where: { doctorId, date: today, clinicId },
    })

    if (existing) {
      await prisma.doctorAttendance.update({
        where: { id: existing.id },
        data: {
          checkInTime: new Date(),
          status: "PRESENT",
        },
      })
    } else {
      await prisma.doctorAttendance.create({
        data: {
          clinicId,
          doctorId,
          date: today,
          checkInTime: new Date(),
          status: "PRESENT",
        },
      })
    }
  } else {
    return { success: false, error: "Missing attendance ID or doctor ID" }
  }

  revalidatePath("/doctor-attendance")
  return { success: true }
}

// ─── Check Out Doctor ───────────────────────────────────────

export async function checkOutDoctor(attendanceId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Only admins and receptionists can manage attendance" }
  }

  const record = await prisma.doctorAttendance.findFirst({
    where: { id: attendanceId, clinicId: session.user.clinicId },
  })
  if (!record) return { success: false, error: "Attendance record not found" }
  if (!record.checkInTime) return { success: false, error: "Doctor hasn't checked in yet" }

  const checkOutTime = new Date()
  let workingHours = "—"

  if (record.checkInTime) {
    const inMs = new Date(record.checkInTime).getTime()
    const outMs = checkOutTime.getTime()
    const diffMs = outMs - inMs
    const totalMin = Math.max(0, Math.floor(diffMs / 60000))
    const h = Math.floor(totalMin / 60)
    const m = Math.round((totalMin % 60) / 10)
    workingHours = `${h}:${String(m).padStart(2, "0")}`
  }

  await prisma.doctorAttendance.update({
    where: { id: attendanceId },
    data: {
      checkOutTime,
      status: "CHECKED_OUT",
    },
  })

  await auditLog({
    clinicId: session.user.clinicId,
    userId: session.user.id,
    action: "CHECK_OUT" as any,
    entityType: "DOCTOR_ATTENDANCE" as any,
    entityId: attendanceId,
    newValues: { doctorId: record.doctorId, date: record.date, workingHours },
  })

  revalidatePath("/doctor-attendance")
  return { success: true }
}

// ─── Mark Doctor Absent ─────────────────────────────────

export async function markDoctorAbsent(attendanceId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Only admins and receptionists can manage attendance" }
  }

  const record = await prisma.doctorAttendance.findFirst({
    where: { id: attendanceId, clinicId: session.user.clinicId },
  })
  if (!record) return { success: false, error: "Attendance record not found" }

  await prisma.doctorAttendance.update({
    where: { id: attendanceId },
    data: {
      status: "ABSENT",
      checkInTime: null,
      checkOutTime: null,
    },
  })

  await auditLog({
    clinicId: session.user.clinicId,
    userId: session.user.id,
    action: "MARK_ABSENT" as any,
    entityType: "DOCTOR_ATTENDANCE" as any,
    entityId: attendanceId,
    newValues: { doctorId: record.doctorId, date: record.date },
  })

  revalidatePath("/doctor-attendance")
  return { success: true }
}