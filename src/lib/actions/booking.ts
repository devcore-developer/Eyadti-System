"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { bookingFormSchema } from "@/lib/validations/booking"
import { notifyAppointmentCreated } from "@/lib/notifications/events"
import { AppointmentStatus, Gender } from "@prisma/client"
import { requireFeature } from "@/lib/services/feature-gate"

const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || "c1"

// ── Get Public Clinic Info ───────────────────────────
export async function getPublicClinicInfo(clinicId: string) {
  const [clinic, settings] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, address: true, phone: true },
    }),
    prisma.clinicSettings.findUnique({
      where: { clinicId },
      select: { logoUrl: true, clinicName: true, address: true, phone: true, email: true, defaultAppointmentDuration: true },
    }),
  ])

  return {
    id: clinic?.id,
    name: settings?.clinicName || clinic?.name || "Clinic",
    logoUrl: settings?.logoUrl || null,
    address: settings?.address || clinic?.address || null,
    phone: settings?.phone || clinic?.phone || null,
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
export async function getAvailableTimeSlots(doctorId: string, clinicId: string, dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  const dayOfWeek = date.getDay()

  const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })
  const duration = settings?.defaultAppointmentDuration || 30

  const doctorSchedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId, dayOfWeek },
  })

  if (!doctorSchedule || !doctorSchedule.isAvailable) return []

  const clinicHours = await prisma.clinicWorkingHours.findFirst({
    where: { clinicId, dayOfWeek },
  })

  if (!clinicHours || clinicHours.isClosed) return []

  const effectiveStart = doctorSchedule.startTime > clinicHours.startTime 
    ? doctorSchedule.startTime 
    : clinicHours.startTime
    
  const effectiveEnd = doctorSchedule.endTime < clinicHours.endTime 
    ? doctorSchedule.endTime 
    : clinicHours.endTime

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

  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gte: date,
        lt: nextDay,
      },
      status: { notIn: [AppointmentStatus.CANCELLED] },
    },
    select: { dateTime: true },
  })

  const bookedSlots = new Set(
    existingAppointments.map((apt) => {
      const d = new Date(apt.dateTime)
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
    })
  )

  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  return slots.filter((slot) => {
    if (bookedSlots.has(slot)) return false
    if (isToday) {
      const [h, m] = slot.split(":").map(Number)
      if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) return false
    }
    return true
  })
}

// ── Create Booking ───────────────────────────────────
export async function createBooking(clinicId: string, rawData: unknown) {
  try {
    await requireFeature(clinicId, "ONLINE_BOOKING")

    const validated = bookingFormSchema.parse(rawData)

    let patient = await prisma.patient.findFirst({
      where: { phone: validated.phone, clinicId },
    })

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          fullName: validated.fullName,
          phone: validated.phone,
          email: validated.email || null,
          gender: validated.gender as Gender,
          dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : new Date("1990-01-01"),
          clinicId,
        },
      })
    }

    const dateTime = new Date(`${validated.date}T${validated.time}:00`)
    const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } })
    const duration = settings?.defaultAppointmentDuration || 30

    const nextDay = new Date(dateTime)
    nextDay.setDate(nextDay.getDate() + 1)

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: validated.doctorId,
        clinicId,
        status: { notIn: [AppointmentStatus.CANCELLED] },
        dateTime: {
          gte: new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate()),
          lt: nextDay,
        },
      },
      select: { dateTime: true },
    })

    const slotStartMinutes = dateTime.getHours() * 60 + dateTime.getMinutes()
    const slotEndMinutes = slotStartMinutes + duration

    for (const apt of existingAppointments) {
      const aptStart = apt.dateTime.getHours() * 60 + apt.dateTime.getMinutes()
      const aptEnd = aptStart + duration
      if (slotStartMinutes < aptEnd && slotEndMinutes > aptStart) {
        return { success: false, error: "This slot is already booked. Please choose another." }
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: validated.doctorId,
        clinicId,
        dateTime,
        notes: validated.notes || "Online Booking",
        status: AppointmentStatus.SCHEDULED,
      },
    })

    await prisma.booking.create({
      data: {
        appointmentId: appointment.id,
        patientId: patient.id,
        doctorId: validated.doctorId,
        clinicId,
        status: "PENDING",
        source: "WEBSITE",
      },
    })

    const doctor = await prisma.user.findUnique({ where: { id: validated.doctorId } })
    
    // ✅ دمج إشعار الواتساب للـ Online Booking
    if (doctor) {
      const bookingClinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true } })
      
      await notifyAppointmentCreated(
        appointment.id,
        patient.fullName,
        patient.phone, // ← رقم المريض
        `Dr. ${doctor.name}`,
        dateTime.toISOString(),
        bookingClinic?.name || "The Clinic", // ← اسم العيادة
        clinicId,
        doctor.id // الـ userId هنا هوا الـ doctorId
      )
    }

    revalidatePath("/appointments")
    revalidatePath("/appointments/online")

    return { success: true, appointmentId: appointment.id }
  } catch (error: any) {
    console.error("Booking error:", error)
    
    if (error.name === "ZodError") {
      return { success: false, error: "Validation failed", fieldErrors: error.flatten?.()?.fieldErrors }
    }
    
    return { success: false, error: error.message || "Failed to create booking" }
  }
}

// ── Get Booking Confirmation ─────────────────────────
export async function getBookingConfirmation(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { fullName: true, phone: true } },
      doctor: { select: { id: true, name: true, image: true } },
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
      doctor: { select: { name: true } },
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
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  })

  await prisma.appointment.update({
    where: { id: booking.appointmentId },
    data: { status: AppointmentStatus.CANCELLED },
  })

  revalidatePath("/appointments/online")
  return { success: true }
}

// ── Multi-Branch Support Functions ───────────────────
export async function getBranches(clinicId: string) {
  return await prisma.branch.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true, code: true, city: true },
    orderBy: { name: "asc" }
  })
}

export async function getDoctorsByBranch(clinicId: string, branchId: string) {
  const doctors = await prisma.user.findMany({
    where: { 
      clinicId, 
      role: "DOCTOR",
      doctorBranches: { some: { branchId: branchId } } 
    },
    select: { 
      id: true, 
      name: true,
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