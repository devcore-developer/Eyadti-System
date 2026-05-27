// src/lib/actions/settings.ts

"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, unlink, mkdir } from "fs/promises"
import path from "path"
import {
  clinicSettingsSchema,
  workingHoursArraySchema,
  doctorScheduleArraySchema,
} from "@/lib/validations/settings"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "CLINIC_OWNER"].includes(session.user.role)) {
    return null
  }
  return session
}

export async function getClinicSettings(clinicId: string) {
  let settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })

  if (!settings) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } })
    settings = await prisma.clinicSettings.create({
      data: { clinicId, clinicName: clinic?.name || "My Clinic" },
    })
  }

  return settings
}

export async function updateClinicSettings(clinicId: string, rawData: unknown) {
  const session = await checkAdmin()
  if (!session || session.user.clinicId !== clinicId) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = clinicSettingsSchema.parse(rawData)

  await prisma.clinicSettings.upsert({
    where: { clinicId },
    update: validated,
    create: { clinicId, ...validated },
  })

  revalidatePath("/settings/clinic")
  return { success: true }
}

export async function uploadClinicLogo(clinicId: string, formData: FormData) {
  const session = await checkAdmin()
  if (!session || session.user.clinicId !== clinicId) {
    return { success: false, error: "Unauthorized" }
  }

  const file = formData.get("logo") as File | null
  if (!file) return { success: false, error: "No file provided" }
  if (file.size > 2 * 1024 * 1024) return { success: false, error: "Max file size is 2MB" }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { success: false, error: "Only JPG, PNG, WebP allowed" }
  }

  try {
    const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })
    
    if (settings?.logoUrl) {
      const oldPath = path.join(process.cwd(), "public", settings.logoUrl)
      await unlink(oldPath).catch(() => {})
    }

    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`
    const uniqueName = `logo-${Date.now()}${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", clinicId)
    await mkdir(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, uniqueName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${clinicId}/${uniqueName}`
    
    await prisma.clinicSettings.upsert({
      where: { clinicId },
      update: { logoUrl: fileUrl },
      create: { clinicId, clinicName: "My Clinic", logoUrl: fileUrl },
    })

    revalidatePath("/settings/clinic")
    return { success: true, url: fileUrl }
  } catch (error) {
    return { success: false, error: "Upload failed" }
  }
}

export async function deleteClinicLogo(clinicId: string) {
  const session = await checkAdmin()
  if (!session || session.user.clinicId !== clinicId) {
    return { success: false, error: "Unauthorized" }
  }

  const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })
  if (settings?.logoUrl) {
    const oldPath = path.join(process.cwd(), "public", settings.logoUrl)
    await unlink(oldPath).catch(() => {})
  }

  await prisma.clinicSettings.upsert({
    where: { clinicId },
    update: { logoUrl: null },
    create: { clinicId, clinicName: "My Clinic", logoUrl: null },
  })

  revalidatePath("/settings/clinic")
  return { success: true }
}

export async function getWorkingHours(clinicId: string) {
  const hours = await prisma.clinicWorkingHours.findMany({
    where: { clinicId },
    orderBy: { dayOfWeek: "asc" },
  })

  const days = [0, 1, 2, 3, 4, 5, 6]
  return days.map((day) => {
    const existing = hours.find((h: any) => h.dayOfWeek === day)
    return (
      existing || { dayOfWeek: day, startTime: "09:00", endTime: "17:00", isClosed: day === 5 || day === 6 }
    )
  })
}

export async function updateWorkingHours(clinicId: string, rawData: unknown) {
  const session = await checkAdmin()
  if (!session || session.user.clinicId !== clinicId) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = workingHoursArraySchema.parse(rawData)

  await prisma.$transaction(async (tx) => {
    await tx.clinicWorkingHours.deleteMany({
      where: { clinicId },
    })

    const createOps = validated.map((wh) =>
      tx.clinicWorkingHours.create({
        data: {
          clinicId,
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime,
          isClosed: wh.isClosed,
        },
      })
    )

    await Promise.all(createOps)
  })

  revalidatePath("/settings/clinic")
  return { success: true }
}

export async function getDoctorSchedules(doctorId: string) {
  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: "asc" },
  })

  const days = [0, 1, 2, 3, 4, 5, 6]
  return days.map((day) => {
    const existing = schedules.find((s: any) => s.dayOfWeek === day)
    return (
      existing || { dayOfWeek: day, startTime: "09:00", endTime: "17:00", isAvailable: day !== 5 && day !== 6 }
    )
  })
}

export async function updateDoctorSchedules(doctorId: string, rawData: unknown) {
  const session = await checkAdmin()
  if (!session) return { success: false, error: "Unauthorized" }

  const validated = doctorScheduleArraySchema.parse(rawData)

  await prisma.$transaction(async (tx) => {
    await tx.doctorSchedule.deleteMany({
      where: { doctorId },
    })

    const createOps = validated.map((s) =>
      tx.doctorSchedule.create({
        data: {
          doctorId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isAvailable,
        },
      })
    )

    await Promise.all(createOps)
  })

  revalidatePath("/settings/clinic")
  return { success: true }
}

// ← الـ Action الجديد: لحفظ مدة الكشف والحد الأقصى للمواعيد
export async function updateDoctorCapacity(
  doctorId: string, 
  duration: number, 
  maxAppointments: number
) {
  const session = await checkAdmin()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  if (!doctorId || duration <= 0 || maxAppointments <= 0) {
    return { success: false, error: "Invalid data provided" }
  }

  try {
    await prisma.user.update({
      where: { id: doctorId },
      data: {
        appointmentDuration: duration,
        maxDailyAppointments: maxAppointments,
      },
    })

    // عشان يحث صفحة المواعيد والـ Settings مع بعض
    revalidatePath("/appointments")
    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update doctor capacity" }
  }
}

// ← تعديل الـ Query عشان تجيب الحقول الجديدة
export async function getClinicDoctors(clinicId: string) {
  return prisma.user.findMany({
    where: { clinicId, role: "DOCTOR" },
    select: { 
      id: true, 
      name: true, 
      appointmentDuration: true, 
      maxDailyAppointments: true 
    },
  })
}