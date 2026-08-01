// lib/notifications/events.ts

import { dispatchNotification } from "./dispatcher"

export async function notifyPatientCreated(patientId: string, patientName: string, clinicId: string, userId: string) {
  await dispatchNotification({
    userId,
    clinicId,
    title: "New Patient Registered",
    message: `Patient ${patientName} has been added to the system.`,
    type: "PATIENT_CREATED",
    priority: "LOW",
    relatedEntityType: "PATIENT",
    relatedEntityId: patientId,
  })
}

export async function notifyAppointmentCreated(
  appointmentId: string, 
  patientName: string, 
  patientPhone: string | null, 
  doctorName: string, 
  date: string, 
  clinicName: string, 
  clinicId: string, 
  userId: string
) {
  const internalMessage = `Appointment for ${patientName} with ${doctorName} on ${date}.`
  const whatsappMessage = `مرحباً ${patientName} 👋\nتم حجز موعدك بنجاح في عيادة *${clinicName}*.\nالدكتور: ${doctorName}\nالموعد: ${new Date(date).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })}\nننتظرك! 🏥`

  await dispatchNotification({
    userId,
    clinicId,
    title: "New Appointment Booked",
    message: internalMessage,
    type: "APPOINTMENT_CREATED",
    priority: "MEDIUM",
    relatedEntityType: "APPOINTMENT",
    relatedEntityId: appointmentId,
    patientPhone: patientPhone,
    externalMessage: whatsappMessage,
  })
}

export async function notifyAppointmentCancelled(
  appointmentId: string, 
  patientName: string, 
  patientPhone: string | null, 
  date: string, 
  clinicName: string,
  clinicId: string, 
  userId: string
) {
  const internalMessage = `Appointment for ${patientName} on ${date} has been cancelled.`
  const whatsappMessage = `مرحباً ${patientName}، نأسف لإبلاغك بأن موعدك في عيادة *${clinicName}* يوم ${new Date(date).toLocaleDateString('ar-EG')} قد تم إلغاؤه.\nلإعادة الحجز، يرجى التواصل معنا.`

  await dispatchNotification({
    userId,
    clinicId,
    title: "Appointment Cancelled",
    message: internalMessage,
    type: "APPOINTMENT_CANCELLED",
    priority: "HIGH",
    relatedEntityType: "APPOINTMENT",
    relatedEntityId: appointmentId,
    patientPhone: patientPhone,
    externalMessage: whatsappMessage,
  })
}

export async function notifyInvoiceCreated(invoiceId: string, patientName: string, amount: string, clinicId: string, userId: string) {
  await dispatchNotification({
    userId,
    clinicId,
    title: "New Invoice Generated",
    message: `Invoice of ${amount} created for ${patientName}.`,
    type: "INVOICE_CREATED",
    priority: "MEDIUM",
    relatedEntityType: "INVOICE",
    relatedEntityId: invoiceId,
  })
}

export async function notifyInvoicePaid(invoiceId: string, patientName: string, amount: string, clinicId: string, userId: string) {
  await dispatchNotification({
    userId,
    clinicId,
    title: "Invoice Paid",
    message: `Payment of ${amount} received from ${patientName}.`,
    type: "INVOICE_PAID",
    priority: "LOW",
    relatedEntityType: "INVOICE",
    relatedEntityId: invoiceId,
  })
}

// ✅ FIXED: Added patientId parameter to fix routing
export async function notifyPrescriptionCreated(
  prescriptionId: string, 
  patientId: string,  // ✅ NEW: Required for correct routing
  patientName: string, 
  clinicId: string, 
  userId: string
) {
  await dispatchNotification({
    userId,
    clinicId,
    title: "New Prescription",
    message: `Prescription created for ${patientName}.`,
    type: "PRESCRIPTION_CREATED",
    priority: "LOW",
    relatedEntityType: "PRESCRIPTION",
    relatedEntityId: patientId,  // ✅ FIXED: Use patientId for routing
  })
}

// ✅ ADDED: Emergency/Walk-in notification
export async function notifyEmergencyWalkIn(
  appointmentId: string,
  patientName: string,
  doctorName: string,
  clinicId: string,
  userId: string
) {
  await dispatchNotification({
    userId,
    clinicId,
    title: "🚨 Emergency Walk-in",
    message: `Emergency patient ${patientName} assigned to ${doctorName}.`,
    type: "APPOINTMENT_CREATED",
    priority: "HIGH",
    relatedEntityType: "WAITING_ROOM",
    relatedEntityId: appointmentId,
  })
}