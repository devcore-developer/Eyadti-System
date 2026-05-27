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
  if (!session?.user || !["ADMIN", "CLINIC_OWNER", "DOCTOR"].includes(session.user.role)) {
    return null
  }
  return session
}

export async function getClinicSettings(clinicId: string) {
  try {
    let settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })

    if (!settings) {
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } })
      if (!clinic) return null // Prevent FK error if clinic doesn't exist
      
      settings = await prisma.clinicSettings.create({
        data: { clinicId, clinicName: clinic.name || "My Clinic" },
      })
    }

    return settings
  } catch (error) {
    console.error("Error fetching clinic settings:", error)
    return null // Return null instead of crashing the page
  }
}

export async function updateClinicSettings(clinicId: string, rawData: unknown) {
  const session = await checkAdmin()
  if (!session || session.user.clinicId !== clinicId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = clinicSettingsSchema.parse(rawData)

    await prisma.clinicSettings.upsert({
      where: { clinicId },
      update: validated,
      create: { clinicId, ...validated },
    })

    revalidatePath("/settings/clinics")
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating clinic settings:", error)
    return { success: false, error: "Failed to update settings" }
  }
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

    revalidatePath("/settings/clinics")
    return { success: true, url: fileUrl }
  } catch (error) {
    console.error("Error uploading logo:", error)
    return { success: false, error: "Upload failed" }
  }
}

export async function deleteClinicLogo(clinicId: string) {
  const session = await checkAdmin()
  if (!session || session.user.clinicId !== clinicId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
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

    revalidatePath("/settings/clinics")
    return { success: true }
  } catch (error) {
    console.error("Error deleting logo:", error)
    return { success: false, error: "Failed to delete logo" }
  }
}

export async function getWorkingHours(clinicId: string) {
  try {
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
  } catch (error) {
    console.error("Error fetching working hours:", error)
    // Return default hours instead of crashing
    return [0,1,2,3,4,5,6].map(day => ({
      dayOfWeek: day, 
      startTime: "09:00", 
      endTime: "17:00", 
      isClosed: day === 5 || day === 6
    }))
  }
}

export async function updateWorkingHours(clinicId: string, rawData: unknown) {
  const session = await checkAdmin()
  if (!session || session.user.clinicId !== clinicId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
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

    revalidatePath("/settings/clinics")
    return { success: true }
  } catch (error) {
    console.error("Error updating working hours:", error)
    return { success: false, error: "Failed to update working hours" }
  }
}

export async function getDoctorSchedules(doctorId: string) {
  try {
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
  } catch (error) {
    console.error("Error fetching doctor schedules:", error)
    return [0,1,2,3,4,5,6].map(day => ({
      dayOfWeek: day, 
      startTime: "09:00", 
      endTime: "17:00", 
      isAvailable: day !== 5 && day !== 6
    }))
  }
}

export async function updateDoctorSchedules(doctorId: string, rawData: unknown) {
  const session = await checkAdmin()
  if (!session) return { success: false, error: "Unauthorized" }

  try {
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

    revalidatePath("/settings/clinics")
    return { success: true }
  } catch (error) {
    console.error("Error updating doctor schedules:", error)
    return { success: false, error: "Failed to update doctor schedules" }
  }
}

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

    revalidatePath("/appointments")
    revalidatePath("/settings/clinics")

    return { success: true }
  } catch (error) {
    console.error("Error updating doctor capacity:", error)
    return { success: false, error: "Failed to update doctor capacity" }
  }
}

export async function getClinicDoctors(clinicId: string) {
  try {
    return await prisma.user.findMany({
      where: { clinicId, role: "DOCTOR" },
      select: { 
        id: true, 
        name: true, 
        appointmentDuration: true, 
        maxDailyAppointments: true 
      },
    })
  } catch (error) {
    console.error("Error fetching clinic doctors:", error)
    return []
  }
}