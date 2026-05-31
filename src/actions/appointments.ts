"use server"

import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { appointmentCreateSchema, appointmentUpdateSchema, changeAppointmentStatusSchema } from "@/lib/validations/appointment"
import type { ActionResult } from "@/types"
import { AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { notifyAppointmentCreated, notifyAppointmentCancelled } from "@/lib/notifications/events"
import { auditLog } from "@/lib/services/audit"

async function enrichAppointmentData(appointment: any) {
  const patient = await prisma.patient.findUnique({ where: { id: appointment.patientId }, select: { fullName: true } })
  const doctor = await prisma.user.findUnique({ where: { id: appointment.doctorId }, select: { name: true } })
  return { ...appointment, patientName: patient?.fullName || "Unknown Patient", doctorName: doctor?.name || "Unknown Doctor" }
}

async function checkAppointmentConflict(clinicId: string, doctorId: string, dateTime: Date, excludeAppointmentId?: string): Promise<string | null> {
  const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000)
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: { id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined, clinicId, doctorId, status: { notIn: [AppointmentStatus.CANCELLED] }, dateTime: { gte: dateTime, lt: endTime } },
    select: { id: true },
  })
  return conflictingAppointment ? "This doctor has a conflicting appointment at this time." : null
}

async function validateClinicEntities(patientId: string, doctorId: string, clinicId: string) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
  if (!patient) return "Patient not found or does not belong to this clinic."
  const doctor = await prisma.user.findFirst({ where: { id: doctorId, clinicId, role: "DOCTOR" } })
  if (!doctor) return "Doctor not found or does not belong to this clinic."
  return null
}

export async function createAppointment(formData: FormData): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST")
    const raw = { patientId: formData.get("patientId") as string, doctorId: formData.get("doctorId") as string, date: formData.get("date") as string, time: formData.get("time") as string, notes: (formData.get("notes") as string) || "" }
    const validated = appointmentCreateSchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const dateTime = new Date(`${validated.data.date}T${validated.data.time}:00`)
    const entityError = await validateClinicEntities(validated.data.patientId, validated.data.doctorId, clinicId)
    if (entityError) return { success: false, error: entityError }
    const conflictError = await checkAppointmentConflict(clinicId, validated.data.doctorId, dateTime)
    if (conflictError) return { success: false, error: conflictError }

    const appointment = await prisma.appointment.create({
      data: { patientId: validated.data.patientId, doctorId: validated.data.doctorId, clinicId, dateTime, notes: validated.data.notes?.trim() || null, status: AppointmentStatus.SCHEDULED },
    })

    if (appointment) {
      const patient = await prisma.patient.findUnique({ where: { id: validated.data.patientId }, select: { fullName: true, phone: true } })
      const doctor = await prisma.user.findUnique({ where: { id: validated.data.doctorId }, select: { name: true } })
      if (patient && doctor) {
        const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true } })
        await notifyAppointmentCreated(appointment.id, patient.fullName, patient.phone, `Dr. ${doctor.name}`, dateTime.toISOString(), clinic?.name || "The Clinic", clinicId, userId)
      }
      const enrichedData = await enrichAppointmentData(appointment)
      await auditLog({ clinicId, userId, action: "CREATE", entityType: "APPOINTMENT", entityId: appointment.id, newValues: enrichedData })
    }
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof AuthenticationError) return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: "Failed to create appointment." }
  }
  revalidatePath("/appointments")
  return { success: true }
}

export async function updateAppointment(appointmentId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { clinicId, userId, role } = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR")
    const raw = { patientId: formData.get("patientId") as string, doctorId: formData.get("doctorId") as string, date: formData.get("date") as string, time: formData.get("time") as string, notes: (formData.get("notes") as string) || "" }
    const validated = appointmentUpdateSchema.safeParse(raw)
    if (!validated.success) return { success: false, error: "Validation failed", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const existingAppointment = await prisma.appointment.findFirst({ where: { id: appointmentId, clinicId } })
    if (!existingAppointment) return { success: false, error: "Appointment not found" }
    if (role === "DOCTOR" && existingAppointment.doctorId !== userId) return { success: false, error: "You can only edit your own appointments." }

    const dateTime = new Date(`${validated.data.date}T${validated.data.time}:00`)
    const entityError = await validateClinicEntities(validated.data.patientId, validated.data.doctorId, clinicId)
    if (entityError) return { success: false, error: entityError }
    const conflictError = await checkAppointmentConflict(clinicId, validated.data.doctorId, dateTime, appointmentId)
    if (conflictError) return { success: false, error: conflictError }

    const updatedAppointment = await prisma.appointment.update({ where: { id: appointmentId }, data: { patientId: validated.data.patientId, doctorId: validated.data.doctorId, dateTime, notes: validated.data.notes?.trim() || null } })
    const enrichedOld = await enrichAppointmentData(existingAppointment)
    const enrichedNew = await enrichAppointmentData(updatedAppointment)
    await auditLog({ clinicId, userId, action: "UPDATE", entityType: "APPOINTMENT", entityId: appointmentId, oldValues: enrichedOld, newValues: enrichedNew })
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof AuthenticationError) return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: "Failed to update appointment." }
  }
  revalidatePath("/appointments")
  revalidatePath(`/appointments/${appointmentId}`)
  return { success: true }
}

export async function changeAppointmentStatus(appointmentId: string, newStatus: AppointmentStatus): Promise<ActionResult> {
  try {
    const { clinicId, userId, role } = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR")
    const validated = changeAppointmentStatusSchema.safeParse({ status: newStatus })
    if (!validated.success) return { success: false, error: "Invalid status" }

    const existingAppointment = await prisma.appointment.findFirst({ where: { id: appointmentId, clinicId } })
    if (!existingAppointment) return { success: false, error: "Appointment not found" }
    if (role === "DOCTOR") {
      if (existingAppointment.doctorId !== userId) return { success: false, error: "You can only change status of your own appointments." }
      if (validated.data.status !== AppointmentStatus.COMPLETED) return { success: false, error: "Doctors can only mark appointments as COMPLETED." }
    }

    const updatedAppointment = await prisma.appointment.update({ where: { id: appointmentId }, data: { status: validated.data.status } })

    if (validated.data.status === AppointmentStatus.CANCELLED) {
      const patient = await prisma.patient.findUnique({ where: { id: existingAppointment.patientId }, select: { fullName: true, phone: true } })
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true } })
      if (patient) {
        await notifyAppointmentCancelled(appointmentId, patient.fullName, patient.phone, existingAppointment.dateTime.toISOString(), clinic?.name || "The Clinic", clinicId, userId)
      }
    }

    const enrichedOld = await enrichAppointmentData(existingAppointment)
    const enrichedNew = await enrichAppointmentData(updatedAppointment)
    await auditLog({ clinicId, userId, action: validated.data.status === AppointmentStatus.CANCELLED ? "CANCEL" : "UPDATE", entityType: "APPOINTMENT", entityId: appointmentId, oldValues: enrichedOld, newValues: enrichedNew })
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof AuthenticationError) return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: "Failed to update status." }
  }
  revalidatePath("/appointments")
  revalidatePath(`/appointments/${appointmentId}`)
  return { success: true }
}

export async function deleteAppointment(appointmentId: string): Promise<ActionResult> {
  try {
    const { clinicId, userId } = await requireRole("SUPER_ADMIN", "ADMIN")
    const existingAppointment = await prisma.appointment.findFirst({ where: { id: appointmentId, clinicId } })
    if (!existingAppointment) return { success: false, error: "Appointment not found" }

    const updatedAppointment = await prisma.appointment.update({ where: { id: appointmentId }, data: { status: AppointmentStatus.CANCELLED } })
    const patient = await prisma.patient.findUnique({ where: { id: existingAppointment.patientId }, select: { fullName: true, phone: true } })
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true } })
    if (patient) {
      await notifyAppointmentCancelled(appointmentId, patient.fullName, patient.phone, existingAppointment.dateTime.toISOString(), clinic?.name || "The Clinic", clinicId, userId)
    }

    const enrichedOld = await enrichAppointmentData(existingAppointment)
    const enrichedNew = await enrichAppointmentData(updatedAppointment)
    await auditLog({ clinicId, userId, action: "CANCEL", entityType: "APPOINTMENT", entityId: appointmentId, oldValues: enrichedOld, newValues: enrichedNew })
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof AuthenticationError) return { success: false, error: error.message }
    console.error(error)
    return { success: false, error: "Cannot cancel appointment. They may have associated records." }
  }
  revalidatePath("/appointments")
  return { success: true }
}