"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions/patients"
import { AppointmentType, AppointmentStatus, VisitStatus, Priority } from "@prisma/client"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { auditLog } from "@/lib/services/audit"
import { notifyAppointmentCreated, notifyEmergencyWalkIn } from "@/lib/notifications/events"
import { getClinicPaymentPolicy, isPreVisitPaymentRequired, verifyPreVisitPayment } from "@/lib/actions/payment-workflow"

async function generateQueueNumber(clinicId: string, tx?: any): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const db = tx || prisma
  const result = await db.visit.aggregate({
    where: { clinicId, createdAt: { gte: today, lt: tomorrow }, queueNumber: { not: null } },
    _max: { queueNumber: true }
  })
  return (result._max.queueNumber || 0) + 1
}

export async function createUnifiedAppointment(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }
    if (!hasPermission(session.user.role, "appointment:create")) {
      return { success: false, error: "Forbidden: You don't have permission to create appointments." }
    }

    const clinicId = session.user.clinicId
    const userId = session.user.id
    const patientId = formData.get("patientId") as string
    const isNewPatient = formData.get("isNewPatient") === "true"
    const appointmentType = formData.get("appointmentType") as AppointmentType
    const doctorId = formData.get("doctorId") as string
    const dateTime = formData.get("dateTime") as string
    const notes = (formData.get("notes") as string) || ""

    if (!doctorId || !dateTime || !appointmentType) return { success: false, error: "Missing required fields" }

    const paymentPolicy = await getClinicPaymentPolicy(clinicId)
    const requiresPrePayment = await isPreVisitPaymentRequired(clinicId)
    const isEmergency = appointmentType === AppointmentType.EMERGENCY
    const isScheduled = appointmentType === AppointmentType.SCHEDULED
    const requiresPaymentAtBooking = !isScheduled && requiresPrePayment && !isEmergency

    const result = await prisma.$transaction(async (tx) => {
      let currentPatientId = patientId

      if (isNewPatient) {
        const fullName = formData.get("fullName") as string
        const phone = formData.get("phone") as string
        const gender = formData.get("gender") as string
        const dob = formData.get("dateOfBirth") as string
        if (!fullName || !phone) throw new Error("Name and Phone are required for new patients")
        const newPatient = await tx.patient.create({ data: { fullName, phone, gender: (gender || "MALE") as any, dateOfBirth: dob ? new Date(dob) : new Date("1990-01-01"), clinicId } })
        currentPatientId = newPatient.id
      }

      if (!currentPatientId) throw new Error("Patient ID is missing")
      const appointmentData: any = { patientId: currentPatientId, doctorId, clinicId, dateTime: new Date(dateTime), notes: notes || null, type: appointmentType }

      // ═══════════════════════════════════════════════════════════
      // FIX: Separate EMERGENCY from WALK_IN
      // EMERGENCY → always creates visit immediately (bypasses payment)
      // WALK_IN (non-emergency) → respects payment policy
      // ═══════════════════════════════════════════════════════════
      if (isEmergency) {
        // Emergency: create appointment + visit immediately, skip payment
        appointmentData.status = AppointmentStatus.CONFIRMED
        const queueNumber = await generateQueueNumber(clinicId, tx)
        const appointment = await tx.appointment.create({ data: appointmentData })
        const visit = await tx.visit.create({
          data: {
            clinicId, patientId: currentPatientId, doctorId,
            appointmentId: appointment.id, visitDate: new Date(),
            status: VisitStatus.WAITING, queueNumber,
            priority: Priority.URGENT, checkedInAt: new Date(),
            notes: notes || null
          }
        })
        return { appointment, visit, patientId: currentPatientId, visitCreated: true }
      }

      if (appointmentType === AppointmentType.WALK_IN) {
        // Walk-in non-emergency: check payment policy
        if (requiresPrePayment) {
          // PAY_BEFORE or SPLIT: create appointment only, NO visit yet
          // Frontend will show payment dialog → then completePreVisitCheckIn
          appointmentData.status = AppointmentStatus.SCHEDULED
          const appointment = await tx.appointment.create({ data: appointmentData })
          return { appointment, patientId: currentPatientId, visitCreated: false }
        }
        // PAY_AFTER: create appointment + visit immediately
        appointmentData.status = AppointmentStatus.CONFIRMED
        const queueNumber = await generateQueueNumber(clinicId, tx)
        const appointment = await tx.appointment.create({ data: appointmentData })
        const visit = await tx.visit.create({
          data: {
            clinicId, patientId: currentPatientId, doctorId,
            appointmentId: appointment.id, visitDate: new Date(),
            status: VisitStatus.WAITING, queueNumber,
            priority: Priority.MEDIUM, checkedInAt: new Date(),
            notes: notes || null
          }
        })
        return { appointment, visit, patientId: currentPatientId, visitCreated: true }
      }

      // SCHEDULED: create appointment only
      {
        appointmentData.status = AppointmentStatus.SCHEDULED
        const appointment = await tx.appointment.create({ data: appointmentData })
        return { appointment, patientId: currentPatientId, visitCreated: false }
      }
    })

    try {
      const patient = await prisma.patient.findUnique({ where: { id: result.patientId }, select: { fullName: true, phone: true } })
      const doctor = await prisma.user.findUnique({ where: { id: doctorId }, select: { name: true } })
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true } })
      if (patient && doctor) {
        if (isEmergency) { await notifyEmergencyWalkIn(result.appointment.id, patient.fullName, `Dr. ${doctor.name}`, clinicId, userId) }
        else { await notifyAppointmentCreated(result.appointment.id, patient.fullName, patient.phone, `Dr. ${doctor.name}`, new Date(dateTime).toISOString(), clinic?.name || "The Clinic", clinicId, userId) }
      }
    } catch (notifError) { console.error("Failed to send notification:", notifError) }

    await auditLog({ clinicId, userId, action: "CREATE", entityType: "APPOINTMENT", entityId: result.appointment.id, newValues: { type: appointmentType, visitCreated: result.visitCreated } })
    revalidatePath("/appointments"); revalidatePath("/waiting-room")

    return { success: true, patientId: result.patientId, appointmentId: result.appointment.id, visitId: result.visit?.id, visitCreated: result.visitCreated, requiresPayment: requiresPaymentAtBooking && !result.visitCreated, paymentPolicy: requiresPaymentAtBooking ? (paymentPolicy as string) : undefined }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || "Failed to create flow." }
  }
}

// ══════════════════════════════════════════════════════════════
// CHECK-IN APPOINTMENT
// ══════════════════════════════════════════════════════════════

export async function checkInAppointment(appointmentId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }
    if (!hasPermission(session.user.role, "appointment:check_in")) {
      return { success: false, error: "Forbidden: Only reception or admin can check-in patients." }
    }

    const clinicId = session.user.clinicId
    const userId = session.user.id

    const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, clinicId } })
    if (!appointment) return { success: false, error: "Appointment not found" }
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      return { success: false, error: "Only scheduled appointments can be checked in" }
    }

    const verification = await verifyPreVisitPayment(appointmentId)
    if (!verification.allowed) {
      return {
        success: false,
        error: "PAYMENT_REQUIRED",
        paymentRequired: true,
        paymentStatus: verification.paymentStatus,
      }
    }

    const existingVisit = await prisma.visit.findFirst({ where: { appointmentId } })
    if (existingVisit) {
      return { success: false, error: "Visit already exists for this appointment." }
    }

    await prisma.$transaction(async (tx) => {
      const queueNumber = await generateQueueNumber(clinicId, tx)
      await tx.appointment.update({ where: { id: appointmentId }, data: { status: AppointmentStatus.CONFIRMED, arrivedAt: new Date() } })
      await tx.visit.create({
        data: { clinicId, patientId: appointment.patientId, doctorId: appointment.doctorId, appointmentId: appointmentId, visitDate: new Date(), status: VisitStatus.WAITING, queueNumber, priority: Priority.MEDIUM, checkedInAt: new Date(), notes: appointment.notes }
      })
    })

    await auditLog({ clinicId, userId, action: "CHECK_IN", entityType: "APPOINTMENT", entityId: appointmentId })
  } catch (error: any) {
    return { success: false, error: error.message || "Check-in failed" }
  }
  revalidatePath("/appointments"); revalidatePath("/waiting-room")
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// UPDATE VISIT STATUS
// ══════════════════════════════════════════════════════════════

export async function updateVisitStatus(visitId: string, newStatus: VisitStatus): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }
    if (!hasPermission(session.user.role, "visit:change_status")) {
      return { success: false, error: "Forbidden: You cannot change visit status." }
    }

    const clinicId = session.user.clinicId
    const userId = session.user.id

    const visit = await prisma.visit.findFirst({ where: { id: visitId, clinicId }, include: { appointment: true } })
    if (!visit) return { success: false, error: "Visit not found" }

    await prisma.visit.update({ where: { id: visitId }, data: { status: newStatus } })

    if (newStatus === VisitStatus.COMPLETED && visit.appointmentId) {
      await prisma.appointment.update({ where: { id: visit.appointmentId }, data: { status: AppointmentStatus.COMPLETED } })
    }

    await auditLog({ clinicId, userId, action: "STATUS_CHANGE", entityType: "VISIT", entityId: visitId, newValues: { status: newStatus } })
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update status" }
  }
  revalidatePath("/waiting-room"); revalidatePath("/appointments")
  return { success: true }
}