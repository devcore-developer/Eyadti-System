"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { bookingFormSchema } from "@/lib/validations/booking"
import { notifyAppointmentCreated, notifyAppointmentCancelled } from "@/lib/notifications/events"
import { AppointmentStatus, Gender } from "@prisma/client"
import { requireFeature } from "@/lib/services/feature-gate"

// ═══════════════════════════════════════════════════════
// 🔒 EGYPT TIMEZONE ENGINE (Handles UTC+2 / UTC+3 DST)
// ═══════════════════════════════════════════════════════
function getEgyptOffset(date: Date = new Date()): number {
  const utcHour = date.getUTCHours()
  const cairoHourStr = date.toLocaleString('en-US', { timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false })
  const cairoHour = parseInt(cairoHourStr)
  
  let offset = cairoHour - utcHour
  if (offset > 12) offset -= 24
  if (offset < -12) offset += 24
  return offset
}

function createDateAsCairoLocal(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)
  
  // Create a dummy date at noon UTC to safely check the offset for that specific day
  const dummyDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const offset = getEgyptOffset(dummyDate)
  
  // Subtract the offset from the local time to get the correct UTC time
  return new Date(Date.UTC(y, m - 1, d, h - offset, min, 0))
}

function getCairoTimeParts(utcDate: Date): { hours: number; minutes: number } {
  const timeStr = utcDate.toLocaleString('en-US', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false })
  const [h, m] = timeStr.split(':').map(Number)
  return { hours: h === 24 ? 0 : h, minutes: m }
}

function getCairoDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  // Use noon UTC to avoid DST edge cases flipping the day
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const dayStr = utcDate.toLocaleDateString('en-US', { timeZone: 'Africa/Cairo', weekday: 'short' })
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return days.indexOf(dayStr)
}


// ── Get Public Clinic Info ───────────────────────────
// ═══════════════════════════════════════════════════════
// ✅ FIX #1: استخدم id بدلاً من slug في الـ query
// ═══════════════════════════════════════════════════════
export async function getPublicClinicInfo(clinicId: string) {
  const [clinic, settings] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },  // ✅ FIX: استخدام id بدلاً من slug
      select: { id: true, name: true, address: true, phone: true },
    }),
    prisma.clinicSettings.findUnique({
      where: { clinicId },
      select: { logoUrl: true, clinicName: true, address: true, phone: true, email: true, defaultAppointmentDuration: true },
    }),
  ])

  // ✅ FIX: أعد null إذا لم يتم العثور على العيادة
  if (!clinic) return null

  return {
    id: clinic.id,
    name: settings?.clinicName || clinic.name || "Clinic",
    logoUrl: settings?.logoUrl || null,
    address: settings?.address || clinic.address || null,
    phone: settings?.phone || clinic.phone || null,
    email: settings?.email || null,
    duration: settings?.defaultAppointmentDuration || 30,
  }
}

// ── Get Available Doctors for Booking ────────────────
export async function getAvailableDoctors(clinicId: string) {
  const doctors = await prisma.user.findMany({
    where: {
      clinicId,
      role: "DOCTOR",
    },
    select: {
      id: true,
      name: true,
      image: true,
      specialty: true,
      degree: true,
      schedules: {
        where: { isAvailable: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return doctors.map((doc) => ({
    ...doc,
    workingDays: doc.schedules.map((s) => dayNames[s.dayOfWeek]),
  }))
}

// ── Get Available Time Slots ─────────────────────────
export async function getAvailableTimeSlots(
  doctorId: string,
  clinicId: string,
  dateStr: string,
  branchId?: string | null
) {
  // ✅ FIX: Use Cairo Day of Week instead of Server Day
  const dayOfWeek = getCairoDayOfWeek(dateStr)

  const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })
  const duration = settings?.defaultAppointmentDuration || 30

  // ✅ FIX #1 & #2: ابحث عن schedule الفرع المحدد أولاً، ثم fallback لـ null
  let doctorSchedule = null

  if (branchId) {
    doctorSchedule = await prisma.doctorSchedule.findFirst({
      where: { doctorId, branchId, dayOfWeek },
    })
  }

  // Fallback: ابحث عن schedule عام (بدون فرع)
  if (!doctorSchedule) {
    doctorSchedule = await prisma.doctorSchedule.findFirst({
      where: { doctorId, branchId: null, dayOfWeek },
    })
  }

  // Fallback أخير: أي schedule للدكتور في اليوم ده
  if (!doctorSchedule) {
    doctorSchedule = await prisma.doctorSchedule.findFirst({
      where: { doctorId, dayOfWeek },
    })
  }

  if (!doctorSchedule || !doctorSchedule.isAvailable) return []

  // ✅ FIX #3: لو مفيش clinic working hours، استخدم مواعيد الدكتور مباشرة
  const clinicHours = await prisma.clinicWorkingHours.findFirst({
    where: { clinicId, dayOfWeek },
  })

  let effectiveStart: string
  let effectiveEnd: string

  if (clinicHours && !clinicHours.isClosed) {
    effectiveStart = doctorSchedule.startTime > clinicHours.startTime
      ? doctorSchedule.startTime
      : clinicHours.startTime

    effectiveEnd = doctorSchedule.endTime < clinicHours.endTime
      ? doctorSchedule.endTime
      : clinicHours.endTime
  } else if (clinicHours?.isClosed) {
    return []
  } else {
    effectiveStart = doctorSchedule.startTime
    effectiveEnd = doctorSchedule.endTime
  }

  if (effectiveStart >= effectiveEnd) return []

  const slots: string[] = []
  const [startH, startM] = effectiveStart.split(":").map(Number)
  const [endH, endM] = effectiveEnd.split(":").map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  for (let mins = startMinutes; mins + duration <= endMinutes; mins += duration) {
    const h = Math.floor(mins / 60).toString().padStart(2, "0")
    const m = (mins % 60).toString().padStart(2, "0")
    slots.push(`${h}:${m}`)
  }

  // ✅ FIX: Calculate next day in Cairo Time, not UTC
  const [y, m, d] = dateStr.split('-').map(Number)
  const startOfDayUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
  const offset = getEgyptOffset(startOfDayUTC)
  const startCairo = new Date(startOfDayUTC.getTime() + (offset * 60 * 60 * 1000))
  const endCairo = new Date(startCairo.getTime() + (24 * 60 * 60 * 1000))

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gte: startCairo,
        lt: endCairo,
      },
      status: { notIn: [AppointmentStatus.CANCELLED] },
    },
    select: { dateTime: true },
  })

  // ✅ FIX: Extract time using Cairo Timezone
  const bookedSlots = new Set(
    existingAppointments.map((apt) => {
      const { hours, minutes } = getCairoTimeParts(new Date(apt.dateTime))
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    })
  )

  // ✅ FIX: Check "isToday" based on Cairo Time
  const nowCairo = new Date()
  const todayStr = `${nowCairo.getFullYear()}-${String(nowCairo.getMonth() + 1).padStart(2, "0")}-${String(nowCairo.getDate()).padStart(2, "0")}`
  const isToday = dateStr === todayStr
  const currentCairoTime = getCairoTimeParts(nowCairo)
  const currentTotalMinutes = currentCairoTime.hours * 60 + currentCairoTime.minutes

  return slots.filter((slot) => {
    if (bookedSlots.has(slot)) return false
    if (isToday) {
      const [h, m] = slot.split(":").map(Number)
      if ((h * 60 + m) <= currentTotalMinutes) return false
    }
    return true
  })
}

// ── Create Booking ───────────────────────────────────
// ═══════════════════════════════════════════════════════
// ✅ FIX: إعادة كتابة كاملة مع error handling محسّن
// ═══════════════════════════════════════════════════════
export async function createBooking(clinicId: string, rawData: unknown) {
  // ═══════════════════════════════════════════════════════
  // 🐛 DEBUG LOGGING - احذف بعد التأكد من حل المشكلة
  // ═══════════════════════════════════════════════════════
  console.log("=== [BOOKING] createBooking called ===")
  console.log("[BOOKING] clinicId:", clinicId)
  console.log("[BOOKING] rawData:", JSON.stringify(rawData, null, 2))
  
  try {
    // ═══════════════════════════════════════════════════════
    // ✅ FIX #2: تحقق من وجود العيادة أولاً
    // ═══════════════════════════════════════════════════════
    const clinicExists = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true },
    })
    
    if (!clinicExists) {
      console.error("[BOOKING] Clinic not found:", clinicId)
      return { success: false, error: "Clinic not found. Please refresh the page and try again." }
    }
    
    console.log("[BOOKING] Clinic found:", clinicExists.name)

    // ═══════════════════════════════════════════════════════
    // ✅ FIX #3: تحقق من الـ feature بشكل آمن
    // ═══════════════════════════════════════════════════════
    try {
      await requireFeature(clinicId, "ONLINE_BOOKING")
      console.log("[BOOKING] Feature check passed")
    } catch (featureError: any) {
      console.error("[BOOKING] Feature check failed:", featureError.message)
      return { 
        success: false, 
        error: "Online booking is not available for this clinic. Please contact the clinic directly." 
      }
    }

    // ═══════════════════════════════════════════════════════
    // ✅ FIX #4: تحقق من الـ usage limit بشكل آمن
    // ═══════════════════════════════════════════════════════
    try {
      const { enforceUsageLimit } = await import("@/lib/services/usage-limits")
      await enforceUsageLimit(clinicId, "MONTHLY_VISITS")
      console.log("[BOOKING] Usage limit check passed")
    } catch (usageError: any) {
      console.error("[BOOKING] Usage limit error:", usageError.message)
      return { 
        success: false, 
        error: "Monthly visit limit has been reached. Please contact the clinic to book an appointment." 
      }
    }

    // ═══════════════════════════════════════════════════════
    // ✅ Validation
    // ═══════════════════════════════════════════════════════
    let validated: any
    try {
      validated = bookingFormSchema.parse(rawData)
      console.log("[BOOKING] Validation passed:", JSON.stringify(validated, null, 2))
    } catch (zodError: any) {
      console.error("[BOOKING] Validation failed:", zodError.errors)
      const fieldErrors = zodError.flatten?.()?.fieldErrors
      const errorMsg = fieldErrors 
        ? Object.values(fieldErrors).flat().join(", ")
        : "Please fill in all required fields correctly."
      return { success: false, error: errorMsg, fieldErrors }
    }

    // ═══════════════════════════════════════════════════════
    // ✅ SECURE: Verify Doctor belongs to this Clinic
    // ═══════════════════════════════════════════════════════
    const doctor = await prisma.user.findFirst({
      where: { id: validated.doctorId, clinicId, role: "DOCTOR" }
    })
    if (!doctor) {
      console.error("[BOOKING] Doctor not found or doesn't belong to clinic:", validated.doctorId)
      return { success: false, error: "Selected doctor is not available. Please go back and select a different doctor." }
    }
    console.log("[BOOKING] Doctor found:", doctor.name)

    // ═══════════════════════════════════════════════════════
    // ✅ SECURE: Verify Branch belongs to this Clinic (if provided)
    // ═══════════════════════════════════════════════════════
    if (validated.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: validated.branchId, clinicId }
      })
      if (!branch) {
        console.error("[BOOKING] Branch not found or doesn't belong to clinic:", validated.branchId)
        return { success: false, error: "Selected branch is not available. Please go back and select a different branch." }
      }
      console.log("[BOOKING] Branch found:", branch.name)
    }

    // ═══════════════════════════════════════════════════════
    // ✅ CRITICAL FIX: Strict Patient Match to prevent Name Mismatch
    // ═══════════════════════════════════════════════════════
    let patient = await prisma.patient.findFirst({
      where: { 
        phone: validated.phone, 
        clinicId,
        fullName: validated.fullName 
      },
    })

    if (!patient) {
      // ✅ FIX: ابحث بالهاتف فقط إذا لم تجد بالاسم والهاتف معاً
      patient = await prisma.patient.findFirst({
        where: { 
          phone: validated.phone, 
          clinicId,
        },
      })
      
      if (patient) {
        // ✅ وجدنا مريض بنفس الرقم لكن اسم مختلف - نحدث الاسم
        console.log("[BOOKING] Existing patient found by phone, updating name from", patient.fullName, "to", validated.fullName)
        patient = await prisma.patient.update({
          where: { id: patient.id },
          data: { 
            fullName: validated.fullName,
            email: validated.email || patient.email || null,
            gender: validated.gender as Gender,
          },
        })
      } else {
        // ✅ إنشاء مريض جديد
        console.log("[BOOKING] Creating new patient:", validated.fullName)
        patient = await prisma.patient.create({
          data: {
            fullName: validated.fullName,
            phone: validated.phone,
            email: validated.email || null,
            gender: validated.gender as Gender,
            dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : new Date("1990-01-01"),
            clinicId,
            branchId: validated.branchId || null,
          },
        })
      }
    }
    console.log("[BOOKING] Patient:", patient.id, patient.fullName)

    // ═══════════════════════════════════════════════════════
    // ✅ CRITICAL FIX: Create DateTime respecting Egypt Timezone
    // ═══════════════════════════════════════════════════════
    const dateTime = createDateAsCairoLocal(validated.date, validated.time)
    const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })
    const duration = settings?.defaultAppointmentDuration || 30

    console.log("[BOOKING] DateTime (UTC):", dateTime.toISOString())
    console.log("[BOOKING] DateTime (Cairo):", getCairoTimeParts(dateTime))

    // Calculate boundaries in Cairo Time for Double Booking Check
    const [y, m, d] = validated.date.split('-').map(Number)
    const startOfDayUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
    const offset = getEgyptOffset(startOfDayUTC)
    const startCairo = new Date(startOfDayUTC.getTime() + (offset * 60 * 60 * 1000))
    const endCairo = new Date(startCairo.getTime() + (24 * 60 * 60 * 1000))

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: validated.doctorId,
        clinicId,
        status: { notIn: [AppointmentStatus.CANCELLED] },
        dateTime: {
          gte: startCairo,
          lt: endCairo,
        },
      },
      select: { dateTime: true },
    })

    // ═══════════════════════════════════════════════════════
    // ✅ FIX #5: استخدم Cairo Time بشكل متسق في فحص الـ double booking
    // ═══════════════════════════════════════════════════════
    const cairoTime = getCairoTimeParts(dateTime)
    const slotStartMinutes = cairoTime.hours * 60 + cairoTime.minutes  // ✅ Cairo time
    const slotEndMinutes = slotStartMinutes + duration

    console.log("[BOOKING] Slot Cairo time:", cairoTime, `minutes: ${slotStartMinutes}-${slotEndMinutes}`)

    for (const apt of existingAppointments) {
      const aptTime = getCairoTimeParts(new Date(apt.dateTime))
      const aptStart = aptTime.hours * 60 + aptTime.minutes  // ✅ Cairo time
      const aptEnd = aptStart + duration
      
      console.log("[BOOKING] Existing apt Cairo time:", aptTime, `minutes: ${aptStart}-${aptEnd}`)
      
      if (slotStartMinutes < aptEnd && slotEndMinutes > aptStart) {
        console.error("[BOOKING] Slot conflict detected!")
        return { success: false, error: "This time slot is no longer available. Please select a different time." }
      }
    }

    // ═══════════════════════════════════════════════════════
    // ✅ Create Appointment
    // ═══════════════════════════════════════════════════════
    console.log("[BOOKING] Creating appointment...")
    
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: validated.doctorId,
        clinicId,
        branchId: validated.branchId || null,
        dateTime,
        notes: validated.notes || "Online Booking",
        status: AppointmentStatus.SCHEDULED,
      },
    })
    console.log("[BOOKING] Appointment created:", appointment.id)

    // ═══════════════════════════════════════════════════════
    // ✅ Create Booking Record
    // ═══════════════════════════════════════════════════════
    console.log("[BOOKING] Creating booking record...")
    
    const booking = await prisma.booking.create({
      data: {
        appointmentId: appointment.id,
        patientId: patient.id,
        doctorId: validated.doctorId,
        clinicId,
        branchId: validated.branchId || null,
        status: "PENDING",
        source: "WEBSITE",
      },
    })
    console.log("[BOOKING] Booking created:", booking.id)

    // ═══════════════════════════════════════════════════════
    // ✅ Send Notification (non-blocking)
    // ═══════════════════════════════════════════════════════
    try {
      const bookingClinic = await prisma.clinic.findUnique({ 
        where: { id: clinicId }, 
        select: { name: true } 
      })
      
      await notifyAppointmentCreated(
        appointment.id,
        patient.fullName,
        patient.phone,
        `Dr. ${doctor.name}`,
        dateTime.toISOString(),
        bookingClinic?.name || "The Clinic",
        clinicId,
        doctor.id
      )
      console.log("[BOOKING] Notification sent")
    } catch (notifError) {
      console.error("[BOOKING] Failed to send notification (non-blocking):", notifError)
      // لا نريد أن نفشل الـ booking بسبب فشل الإشعار
    }

    // ═══════════════════════════════════════════════════════
    // ✅ Revalidate paths
    // ═══════════════════════════════════════════════════════
// ✅ FIX: لا نعمل revalidatePath من هنا عشان مش يعمل refresh لصفحة الـ booking
// الـ bookings هتظهر لما المستخدم يزور صفحة Online Bookings

    console.log("[BOOKING] ✅ SUCCESS! Returning appointmentId:", appointment.id)

    return { success: true, appointmentId: appointment.id }
    
  } catch (error: any) {
    console.error("=== [BOOKING] UNEXPECTED ERROR ===")
    console.error("[BOOKING] Error name:", error?.name)
    console.error("[BOOKING] Error message:", error?.message)
    console.error("[BOOKING] Error stack:", error?.stack)
    
    // ═══════════════════════════════════════════════════════
    // ✅ FIX #6: Handle specific error types
    // ═══════════════════════════════════════════════════════
    if (error?.name === "PrismaClientKnownRequestError") {
      console.error("[BOOKING] Prisma error code:", error.code)
      
      if (error.code === "P2002") {
        return { 
          success: false, 
          error: "A duplicate record was detected. You may have already booked this slot." 
        }
      }
      if (error.code === "P2003") {
        return { 
          success: false, 
          error: "Invalid reference. Please refresh the page and try again." 
        }
      }
    }
    
    if (error?.name === "PrismaClientValidationError") {
      return { 
        success: false, 
        error: "Invalid data format. Please check your information and try again." 
      }
    }
    
    // Generic error
    return { 
      success: false, 
      error: "An unexpected error occurred while creating your booking. Please try again or contact the clinic directly." 
    }
  }
}

// ── Get Booking Confirmation ─────────────────────────
export async function getBookingConfirmation(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { fullName: true, phone: true } },
      doctor: { select: { id: true, name: true, image: true, specialty: true, degree: true } },
      clinic: { select: { name: true, address: true, phone: true } },
    },
  })

  if (!appointment) return null

  const settings = await prisma.clinicSettings.findUnique({
    where: { clinicId: appointment.clinicId },
    select: { logoUrl: true, clinicName: true },
  })

  return {
    ...appointment,
    clinicName: settings?.clinicName || appointment.clinic.name,
    logoUrl: settings?.logoUrl,
  }
}

// ── Admin: Get Online Bookings ───────────────────────
export async function getOnlineBookings(clinicId: string) {
  return prisma.booking.findMany({
    where: { clinicId, source: "WEBSITE" },
    include: {
      patient: { select: { fullName: true, phone: true } },
      doctor: { select: { name: true, specialty: true } },
      appointment: { select: { dateTime: true, status: true, notes: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

// ── Admin: Confirm Booking ───────────────────────────
export async function confirmBooking(bookingId: string) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  })

  await prisma.appointment.update({
    where: { id: booking.appointmentId },
    data: { status: AppointmentStatus.SCHEDULED },
  })

  revalidatePath("/appointments/online")
  return { success: true }
}

// ── Admin: Cancel Booking ───────────────────────────
export async function cancelBooking(bookingId: string) {
  // First get booking details before cancelling
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      patient: { select: { fullName: true, phone: true } },
      doctor: { select: { name: true, id: true } },
      appointment: { select: { id: true, dateTime: true } },
      clinic: { select: { id: true, name: true } },
    },
  })

  if (!booking) return { success: false, error: "Booking not found" }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  })

  await prisma.appointment.update({
    where: { id: booking.appointmentId },
    data: { status: AppointmentStatus.CANCELLED },
  })

  // Send cancellation notification
  try {
    if (booking.appointment && booking.doctor && booking.clinic) {
      await notifyAppointmentCancelled(
        booking.appointment.id,
        booking.patient.fullName,
        booking.patient.phone,
        booking.appointment.dateTime.toISOString(),
        booking.clinic.name,
        booking.clinic.id,
        booking.doctor.id
      )
    }
  } catch (notifError) {
    console.error("Failed to send cancellation notification:", notifError)
  }

  revalidatePath("/appointments/online")
  return { success: true }
}

// ── Multi-Branch Support Functions ───────────────────
export async function getBranches(clinicId: string) {
  return await prisma.branch.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true, nameAr: true, nameEn: true, code: true, city: true, address: true },
    orderBy: { name: "asc" }
  })
}

export async function getDoctorsByBranch(clinicId: string, branchId: string) {
  const isFallbackBranch = branchId.startsWith("branch_for_");

  const doctors = await prisma.user.findMany({
    where: { 
      clinicId, 
      role: "DOCTOR",
      ...(isFallbackBranch 
        ? {} 
        : {
            OR: [
              { allBranchAccess: true },
              { doctorBranches: { some: { branchId: branchId } } }
            ]
          }
      )
    },
    select: { 
      id: true, 
      name: true,
      nameAr: true,
      nameEn: true,
      allBranchAccess: true,
      image: true,
      specialty: true,
      degree: true,
      schedules: {
        where: { isAvailable: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
    orderBy: { name: "asc" }
  })
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  return doctors.map(doc => ({
    ...doc,
    workingDays: doc.schedules.map(s => dayNames[s.dayOfWeek])
  }))
}

// ── Check In Booking ─────────────────────────────────
export async function checkInBooking(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        patient: true,
        doctor: true,
        appointment: { include: { visit: { select: { id: true } } } },
      },
    })

    if (!booking) return { success: false, error: "Booking not found" }
    if (booking.status === "CANCELLED") return { success: false, error: "Cancelled booking cannot be checked in" }
    if (booking.status === "COMPLETED") return { success: false, error: "Already checked in" }
    if (booking.appointment?.visit) return { success: false, error: "Visit already exists" }

    const now = new Date()

    // Create visit
    await prisma.visit.create({
      data: {
        clinicId: booking.clinicId,
        branchId: booking.branchId,
        patientId: booking.patientId,
        doctorId: booking.doctorId,
        visitDate: now,
        appointmentId: booking.appointmentId,
        status: "WAITING",
        checkedInAt: now,
        notes: "Checked in from Online Booking",
      },
    })

    // Update booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" },
    })

    // Update appointment
    if (booking.appointmentId) {
      await prisma.appointment.update({
        where: { id: booking.appointmentId },
        data: { status: AppointmentStatus.CONFIRMED, arrivedAt: now },
      })
    }

    revalidatePath("/appointments/online")
    revalidatePath("/waiting-room")

    return { success: true }
  } catch (error) {
    console.error("Check-in error:", error)
    return { success: false, error: "Failed to check in patient" }
  }
}

// ── Update Booking Notes ─────────────────────────────
export async function updateBookingNotes(appointmentId: string, notes: string) {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { notes },
    })
    revalidatePath("/appointments/online")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to save notes" }
  }
}