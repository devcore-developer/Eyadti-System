// src/lib/actions/settings.ts
"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireRole, AuthorizationError } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { v2 as cloudinary } from "cloudinary"
import {
  clinicSettingsSchema,
  workingHoursArraySchema,
  doctorScheduleArraySchema,
} from "@/lib/validations/settings"
import { getSubscription } from "@/lib/services/subscription"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Role Guards ──────────────────────────────────────

// ADMIN/SUPER_ADMIN only — for editing clinic settings, working hours, schedules
async function requireClinicAdmin(clinicId: string) {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.clinicId !== clinicId) return null
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return null
  return session
}

// ADMIN/SUPER_ADMIN/RECEPTIONIST — for viewing clinic settings (read-only)
async function requireClinicViewer(clinicId: string) {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.clinicId !== clinicId) return null
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) return null
  return session
}

// DOCTOR can view their OWN schedule only
async function requireOwnScheduleAccess(doctorId: string) {
  const session = await auth()
  if (!session?.user) throw new AuthorizationError("Not authenticated")
  if (session.user.role !== "DOCTOR") throw new AuthorizationError("Not authorized")
  if (session.user.id !== doctorId) throw new AuthorizationError("You can only view your own schedule")
  return session
}

// ── Clinic Settings ──────────────────────────────────

export async function getClinicSettings(clinicId: string) {
  try {
    // Any authenticated user in the clinic can read settings
    const session = await requireClinicViewer(clinicId)
    if (!session) return null

    let settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })

    if (!settings) {
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } })
      if (!clinic) return null 
      
      settings = await prisma.clinicSettings.create({
        data: { clinicId, clinicName: clinic.name || "My Clinic" },
      })
    }

    return settings
  } catch (error) {
    console.error("Error fetching clinic settings:", error)
    return null
  }
}

export async function updateClinicSettings(clinicId: string, rawData: unknown) {
  const session = await requireClinicAdmin(clinicId)
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // ═══════════════════════════════════════════════════
    // ✅ SERVER-SIDE ENFORCEMENT: Force plan limits
    // ═══════════════════════════════════════════════════
    const subscription = await getSubscription(clinicId)
    const plan = subscription?.plan

    const validated = clinicSettingsSchema.parse(rawData)

    // If plan doesn't have online booking, force disable
    if (!plan?.onlineBookingEnabled) {
      validated.enableOnlineBooking = false
    }

    // If plan doesn't have WhatsApp, force clear instance name
    if (!plan?.whatsappEnabled) {
      validated.whatsappInstanceName = ""
    }

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

// ── Logo Upload/Delete ───────────────────────────────

export async function uploadClinicLogo(clinicId: string, formData: FormData) {
  const session = await requireClinicAdmin(clinicId)
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  const file = formData.get("logo") as File | null
  if (!file) return { success: false, error: "No file provided" }
  if (file.size > 2 * 1024 * 1024) return { success: false, error: "Max file size is 2MB" }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { success: false, error: "Only JPG, PNG, WebP allowed" }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "clinic_logos" },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    const uploadResult = result as any
    const logoUrl = uploadResult.secure_url

    await prisma.clinicSettings.upsert({
      where: { clinicId },
      update: { logoUrl: logoUrl },
      create: { clinicId, clinicName: "My Clinic", logoUrl: logoUrl },
    })

    revalidatePath("/settings/clinics")
    revalidatePath("/patients/[id]") 
    return { success: true, url: logoUrl }
  } catch (error) {
    console.error("Error uploading logo:", error)
    return { success: false, error: "Upload failed" }
  }
}

export async function deleteClinicLogo(clinicId: string) {
  const session = await requireClinicAdmin(clinicId)
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })
    
    if (settings?.logoUrl && settings.logoUrl.includes("cloudinary")) {
      try {
        const urlParts = settings.logoUrl.split('/')
        const publicIdWithExt = urlParts.slice(-2).join('/') 
        const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'))
        await cloudinary.uploader.destroy(publicId)
      } catch (e) {
        console.error("Could not delete old logo from Cloudinary", e)
      }
    }

    await prisma.clinicSettings.upsert({
      where: { clinicId },
      update: { logoUrl: null },
      create: { clinicId, clinicName: "My Clinic", logoUrl: null },
    })

    revalidatePath("/settings/clinics")
    revalidatePath("/patients/[id]")
    return { success: true }
  } catch (error) {
    console.error("Error deleting logo:", error)
    return { success: false, error: "Failed to delete logo" }
  }
}

// ── Working Hours ────────────────────────────────────

export async function getWorkingHours(clinicId: string) {
  try {
    const session = await requireClinicViewer(clinicId)
    if (!session) return [0,1,2,3,4,5,6].map(day => ({ dayOfWeek: day, startTime: "09:00", endTime: "17:00", isClosed: day === 5 || day === 6 }))

    const hours = await prisma.clinicWorkingHours.findMany({
      where: { clinicId },
      orderBy: { dayOfWeek: "asc" },
    })
    const days = [0, 1, 2, 3, 4, 5, 6]
    return days.map((day) => {
      const existing = hours.find((h: any) => h.dayOfWeek === day)
      return existing || { dayOfWeek: day, startTime: "09:00", endTime: "17:00", isClosed: day === 5 || day === 6 }
    })
  } catch (error) {
    console.error("Error fetching working hours:", error)
    return [0,1,2,3,4,5,6].map(day => ({ dayOfWeek: day, startTime: "09:00", endTime: "17:00", isClosed: day === 5 || day === 6 }))
  }
}

export async function updateWorkingHours(clinicId: string, rawData: unknown) {
  const session = await requireClinicAdmin(clinicId)
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = workingHoursArraySchema.parse(rawData)
    await prisma.$transaction(async (tx) => {
      await tx.clinicWorkingHours.deleteMany({ where: { clinicId } })
      await Promise.all(validated.map((wh) => tx.clinicWorkingHours.create({ data: { clinicId, ...wh } })))
    })
    revalidatePath("/settings/clinics")
    return { success: true }
  } catch (error) {
    console.error("Error updating working hours:", error)
    return { success: false, error: "Failed to update working hours" }
  }
}

// ── Doctor Schedules ─────────────────────────────────

export async function getDoctorSchedules(doctorId: string) {
  try {
    const session = await auth()
    if (!session?.user) throw new AuthorizationError("Not authenticated")

    // DOCTOR can only see their OWN schedule
    if (session.user.role === "DOCTOR") {
      await requireOwnScheduleAccess(doctorId)
    }
    // ADMIN/RECEPTIONIST can see any doctor's schedule
    else if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
      throw new AuthorizationError("Not authorized")
    }

    const schedules = await prisma.doctorSchedule.findMany({ where: { doctorId }, orderBy: { dayOfWeek: "asc" } })
    const days = [0, 1, 2, 3, 4, 5, 6]
    return days.map((day) => {
      const existing = schedules.find((s: any) => s.dayOfWeek === day)
      return existing || { dayOfWeek: day, startTime: "09:00", endTime: "17:00", isAvailable: day !== 5 && day !== 6 }
    })
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return [0,1,2,3,4,5,6].map(day => ({ dayOfWeek: day, startTime: "09:00", endTime: "17:00", isAvailable: day !== 5 && day !== 6 }))
    }
    console.error("Error fetching doctor schedules:", error)
    return [0,1,2,3,4,5,6].map(day => ({ dayOfWeek: day, startTime: "09:00", endTime: "17:00", isAvailable: day !== 5 && day !== 6 }))
  }
}

export async function updateDoctorSchedules(doctorId: string, rawData: unknown) {
  // ── DOCTOR cannot edit schedules — only ADMIN/RECEPTIONIST ──
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  if (session.user.role === "DOCTOR") {
    return { success: false, error: "Doctors cannot modify clinic schedules. Contact your admin." }
  }

  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Not authorized" }
  }

  try {
    const validated = doctorScheduleArraySchema.parse(rawData)
    await prisma.$transaction(async (tx) => {
      await tx.doctorSchedule.deleteMany({ where: { doctorId } })
      await Promise.all(validated.map((s) => tx.doctorSchedule.create({ data: { doctorId, ...s } })))
    })
    revalidatePath("/settings/clinics")
    return { success: true }
  } catch (error) {
    console.error("Error updating doctor schedules:", error)
    return { success: false, error: "Failed to update doctor schedules" }
  }
}

export async function updateDoctorCapacity(doctorId: string, duration: number, maxAppointments: number) {
  // ── DOCTOR cannot edit capacity — only ADMIN/RECEPTIONIST ──
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  if (session.user.role === "DOCTOR") {
    return { success: false, error: "Doctors cannot modify capacity settings." }
  }

  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Not authorized" }
  }

  if (!doctorId || duration <= 0 || maxAppointments <= 0) return { success: false, error: "Invalid data provided" }

  try {
    await prisma.user.update({ where: { id: doctorId }, data: { appointmentDuration: duration, maxDailyAppointments: maxAppointments } })
    revalidatePath("/appointments")
    revalidatePath("/settings/clinics")
    return { success: true }
  } catch (error) {
    console.error("Error updating doctor capacity:", error)
    return { success: false, error: "Failed to update doctor capacity" }
  }
}

// ── Get Clinic Doctors ───────────────────────────────

export async function getClinicDoctors(clinicId: string) {
  try {
    const session = await requireClinicViewer(clinicId)
    if (!session) return []

    return await prisma.user.findMany({ 
      where: { clinicId, role: "DOCTOR" }, 
      select: { id: true, name: true, appointmentDuration: true, maxDailyAppointments: true } 
    })
  } catch (error) {
    console.error("Error fetching clinic doctors:", error)
    return []
  }
}