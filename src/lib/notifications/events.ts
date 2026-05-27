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

export async function notifyAppointmentCreated(appointmentId: string, patientName: string, doctorName: string, date: string, clinicId: string, userId: string) {
  await dispatchNotification({
    userId,
    clinicId,
    title: "New Appointment Booked",
    message: `Appointment for ${patientName} with ${doctorName} on ${date}.`,
    type: "APPOINTMENT_CREATED",
    priority: "MEDIUM",
    relatedEntityType: "APPOINTMENT",
    relatedEntityId: appointmentId,
  })
}

export async function notifyAppointmentCancelled(appointmentId: string, patientName: string, date: string, clinicId: string, userId: string) {
  await dispatchNotification({
    userId,
    clinicId,
    title: "Appointment Cancelled",
    message: `Appointment for ${patientName} on ${date} has been cancelled.`,
    type: "APPOINTMENT_CANCELLED",
    priority: "HIGH",
    relatedEntityType: "APPOINTMENT",
    relatedEntityId: appointmentId,
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

export async function notifyPrescriptionCreated(prescriptionId: string, patientName: string, clinicId: string, userId: string) {
  await dispatchNotification({
    userId,
    clinicId,
    title: "New Prescription",
    message: `Prescription created for ${patientName}.`,
    type: "PRESCRIPTION_CREATED",
    priority: "LOW",
    relatedEntityType: "PRESCRIPTION",
    relatedEntityId: prescriptionId,
  })
}