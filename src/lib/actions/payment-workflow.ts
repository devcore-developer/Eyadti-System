"use server"

import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import { PaymentMethod, InvoiceStatus, AppointmentStatus, PaymentWorkflow } from "@prisma/client"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { auditLog } from "@/lib/services/audit"

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

export type ClinicPaymentPolicy = PaymentWorkflow

export interface PaymentStatusInfo {
  hasInvoice: boolean
  invoiceId?: string
  status: "NO_INVOICE" | "UNPAID" | "PARTIALLY_PAID" | "PAID"
  invoiceStatus?: InvoiceStatus
  totalAmount: number
  totalPaid: number
  remaining: number
  paymentCount: number
}

// ══════════════════════════════════════════════════════════════
// BULLETPROOF PAYMENT CREATION HELPER
// ══════════════════════════════════════════════════════════════
async function createPaymentRecord(tx: any, data: {
  invoiceId: string,
  amount: number,
  method: PaymentMethod,
  recordedById: string,
  clinicId: string,
  branchId?: string | null,
  notes?: string | null
}) {
  if (!data.invoiceId) {
    console.error("FATAL PAYMENT ERROR: Attempted to create payment without invoiceId", data)
    throw new Error("System Error: Cannot record payment without a valid invoice.")
  }

  return tx.payment.create({
    data: {
      invoiceId: data.invoiceId,
      amount: data.amount,
      method: data.method,
      recordedById: data.recordedById,
      clinicId: data.clinicId,
      branchId: data.branchId || null,
      notes: data.notes || null,
    }
  })
}

// ══════════════════════════════════════════════════════════════
// GET CLINIC PAYMENT POLICY
// ══════════════════════════════════════════════════════════════

export async function getClinicPaymentPolicy(clinicId: string): Promise<ClinicPaymentPolicy> {
  const settings = await prisma.clinicSettings.findUnique({
    where: { clinicId },
    select: { paymentWorkflow: true }
  })
  return (settings?.paymentWorkflow || PaymentWorkflow.PAY_AFTER_VISIT) as ClinicPaymentPolicy
}

export async function isPreVisitPaymentRequired(clinicId: string): Promise<boolean> {
  const policy = await getClinicPaymentPolicy(clinicId)
  return policy === PaymentWorkflow.PAY_BEFORE_VISIT || policy === PaymentWorkflow.SPLIT_PAYMENT
}

// ══════════════════════════════════════════════════════════════
// GET APPOINTMENT PAYMENT STATUS
// ══════════════════════════════════════════════════════════════

export async function getAppointmentPaymentStatus(appointmentId: string): Promise<PaymentStatusInfo> {
  const invoice = await prisma.invoice.findFirst({
    where: { appointmentId },
    include: { payments: { where: { method: { not: PaymentMethod.REFUND } } } }
  })

  if (!invoice) {
    return { hasInvoice: false, status: "NO_INVOICE", totalAmount: 0, totalPaid: 0, remaining: 0, paymentCount: 0 }
  }

  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Math.max(0, Number(invoice.amount) - totalPaid)

  let status: PaymentStatusInfo["status"] = "UNPAID"
  if (totalPaid >= Number(invoice.amount)) status = "PAID"
  else if (totalPaid > 0) status = "PARTIALLY_PAID"

  return {
    hasInvoice: true,
    invoiceId: invoice.id,
    status,
    invoiceStatus: invoice.status,
    totalAmount: Number(invoice.amount),
    totalPaid,
    remaining,
    paymentCount: invoice.payments.length,
  }
}

// ══════════════════════════════════════════════════════════════
// ADD PAYMENT TO EXISTING INVOICE
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// ADD PAYMENT TO EXISTING INVOICE
// ═══ CRITICAL FIX: Fallback to session clinicId if frontend sends undefined ═══
// ══════════════════════════════════════════════════════════════

export async function addPaymentToExistingInvoice(data: {
  invoiceId: string
  amount: number
  paymentMethod: PaymentMethod
  clinicId?: string | undefined // جعلناه Optional هنا لمنع الكراش
  branchId?: string | null
  notes?: string
}): Promise<ActionResult & { newTotalPaid?: number; newRemaining?: number; newStatus?: string }> {
  try {
    // سحب clinicId من الـ Session كضمانة
    const { userId, clinicId: sessionClinicId } = await requireRole("SUPER_ADMIN", "ADMIN", "RECEPTIONIST")
    
    // استخدام الـ clinicId الممرر، أو الرجوع لـ clinicId الـ Session
    const clinicId = data.clinicId || sessionClinicId

    if (!clinicId) {
      return { success: false, error: "Clinic ID is missing." }
    }
    if (!data.invoiceId) {
      return { success: false, error: "Invoice ID is missing." }
    }
    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Payment amount must be greater than zero" }
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, clinicId: clinicId }, // استخدام الـ ID المضمون
        include: { payments: { where: { method: { not: PaymentMethod.REFUND } } } }
      })

      if (!invoice) throw new Error("Invoice not found")

      const previousPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const newTotalPaid = previousPaid + data.amount
      const remaining = Math.max(0, Number(invoice.amount) - newTotalPaid)

      let newStatus: InvoiceStatus = InvoiceStatus.UNPAID
      if (newTotalPaid >= Number(invoice.amount)) newStatus = InvoiceStatus.PAID
      else if (newTotalPaid > 0) newStatus = InvoiceStatus.PARTIAL

      await createPaymentRecord(tx, {
        invoiceId: invoice.id,
        amount: data.amount,
        method: data.paymentMethod, // تأكد أنك غيرتها لـ method كما أخبرتك سابقاً
        recordedById: userId,
        clinicId: clinicId, // تمرير الـ ID المضمون
        branchId: data.branchId,
        notes: data.notes || "Payment during check-in",
      })

      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { status: newStatus }
      })

      await auditLog({
        clinicId: clinicId, userId,
        action: "ADD_PAYMENT_TO_INVOICE" as any,
        entityType: "INVOICE", entityId: data.invoiceId,
        newValues: { paymentAmount: data.amount, previousPaid, newTotalPaid, remaining, newStatus }
      })

      return { newTotalPaid, remaining, newStatus: newStatus as string }
    })

    revalidatePath("/appointments"); revalidatePath("/invoices"); revalidatePath("/waiting-room")
    return { success: true, ...result }
  } catch (error: any) {
    if (error.name === "AuthorizationError" || error.name === "AuthenticationError") return { success: false, error: error.message }
    console.error("Add payment error:", error)
    return { success: false, error: error.message || "Failed to add payment" }
  }
}
// ══════════════════════════════════════════════════════════════
// CREATE PRE-VISIT PAYMENT
// ══════════════════════════════════════════════════════════════

export async function createPreVisitPayment(data: {
  appointmentId: string; patientId: string; amount: number; paidAmount: number;
  paymentMethod: PaymentMethod; description: string; clinicId: string; branchId?: string | null;
}): Promise<ActionResult & { invoiceId?: string }> {
  try {
    const { userId } = await requireRole("SUPER_ADMIN", "ADMIN", "RECEPTIONIST")
    const { appointmentId, patientId, amount, paidAmount, paymentMethod, description, clinicId, branchId } = data

    if (!appointmentId || !patientId || !amount || amount <= 0) return { success: false, error: "Missing required billing information" }
    if (paidAmount < 0) return { success: false, error: "Paid amount cannot be negative" }
    if (paidAmount > amount) return { success: false, error: "Paid amount cannot exceed total amount" }

    const existingInvoice = await prisma.invoice.findFirst({ where: { appointmentId } })

    if (existingInvoice) {
      if (paidAmount <= 0) return { success: false, error: "Payment amount must be greater than zero to record against existing invoice." }
      
      const addResult = await addPaymentToExistingInvoice({
        invoiceId: existingInvoice.id, amount: paidAmount, paymentMethod, clinicId, branchId,
        notes: description || "Payment recorded",
      })
      return { ...addResult, invoiceId: existingInvoice.id }
    }

    const policy = await getClinicPaymentPolicy(clinicId)
    if (policy === PaymentWorkflow.PAY_AFTER_VISIT) {
      return { success: false, error: "This clinic does not require pre-visit payment." }
    }

    let invoiceStatus: InvoiceStatus = InvoiceStatus.UNPAID
    if (paidAmount >= amount) invoiceStatus = InvoiceStatus.PAID
    else if (paidAmount > 0) invoiceStatus = InvoiceStatus.PARTIAL

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: { patientId, clinicId, branchId: branchId || null, appointmentId, amount, status: invoiceStatus, notes: description || "Consultation fee" }
      })

      await tx.invoiceItem.create({
        data: { invoiceId: invoice.id, description: description || "Consultation fee", quantity: 1, unitPrice: amount }
      })

      if (paidAmount > 0) {
        await createPaymentRecord(tx, {
          invoiceId: invoice.id,
          amount: paidAmount,
          method: paymentMethod,
          recordedById: userId,
          clinicId,
          branchId,
          notes: "Full payment — before visit",
        })
      }

      await auditLog({
        clinicId, userId, action: "CREATE_PRE_VISIT_PAYMENT" as any,
        entityType: "INVOICE", entityId: invoice.id,
        newValues: { appointmentId, amount, paidAmount, policy, status: invoiceStatus }
      })
      return { invoiceId: invoice.id }
    })

    revalidatePath("/appointments"); revalidatePath("/invoices"); revalidatePath("/waiting-room")
    return { success: true, invoiceId: result.invoiceId }
  } catch (error: any) {
    if (error.name === "AuthorizationError" || error.name === "AuthenticationError") return { success: false, error: error.message }
    console.error("Pre-visit payment error:", error)
    return { success: false, error: error.message || "Failed to process pre-visit payment." }
  }
}

// ══════════════════════════════════════════════════════════════
// VERIFY PRE-VISIT PAYMENT
// ══════════════════════════════════════════════════════════════

export async function verifyPreVisitPayment(appointmentId: string): Promise<{
  allowed: boolean; reason?: string; paymentStatus?: PaymentStatusInfo
}> {
  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId }, select: { clinicId: true, status: true } })
  if (!appointment) return { allowed: false, reason: "Appointment not found" }
  if (appointment.status !== AppointmentStatus.SCHEDULED) return { allowed: true }

  const policy = await getClinicPaymentPolicy(appointment.clinicId)
  if (policy === PaymentWorkflow.PAY_AFTER_VISIT) return { allowed: true }

  const paymentStatus = await getAppointmentPaymentStatus(appointmentId)

  if (policy === PaymentWorkflow.PAY_BEFORE_VISIT) {
    if (paymentStatus.status === "PAID") return { allowed: true, paymentStatus }
    return { allowed: false, reason: "Payment required before visit", paymentStatus }
  }

  if (policy === PaymentWorkflow.SPLIT_PAYMENT) {
    if (paymentStatus.status === "PAID" || paymentStatus.status === "PARTIALLY_PAID") return { allowed: true, paymentStatus }
    return { allowed: false, reason: "Initial payment required before visit", paymentStatus }
  }

  return { allowed: true }
}

// ══════════════════════════════════════════════════════════════
// COMPLETE POST-VISIT PAYMENT
// ═══ FIX: Handles all 3 payment modes correctly ═══
// ═══  - PAY_BEFORE:    Just completes visit, no payment needed
// ═══  - PAY_AFTER:     Creates invoice + records payment + completes
// ═══  - SPLIT_PAYMENT: Adds to existing invoice, updates total, completes
// ══════════════════════════════════════════════════════════════

export async function completePostVisitPayment(data: {
  appointmentId: string | null
  visitId: string
  patientId: string
  totalAmount: number
  paidAmount: number
  paymentMethod: PaymentMethod
  description: string
  clinicId: string
  branchId?: string | null
  doctorId: string
}): Promise<ActionResult & { invoiceId?: string }> {
  try {
    const { userId } = await requireRole("SUPER_ADMIN", "ADMIN", "RECEPTIONIST")
    const { appointmentId, visitId, patientId, totalAmount, paidAmount, paymentMethod, description, clinicId, branchId } = data

    if (!visitId || !patientId) return { success: false, error: "Missing visit or patient ID." }
    if (totalAmount < 0) return { success: false, error: "Total amount cannot be negative." }
    if (paidAmount < 0) return { success: false, error: "Paid amount cannot be negative." }
    if (paidAmount > totalAmount) return { success: false, error: "Paid amount cannot exceed total amount." }

    const policy = await getClinicPaymentPolicy(clinicId)

    // ═══════════════════════════════════════════════════════════
    // PAY_BEFORE_VISIT: Payment already done — just complete visit
    // ═══════════════════════════════════════════════════════════
    if (policy === PaymentWorkflow.PAY_BEFORE_VISIT) {
      await prisma.$transaction(async (tx) => {
        await tx.visit.update({ where: { id: visitId }, data: { status: "COMPLETED" } })
        if (appointmentId) {
          await tx.appointment.update({ where: { id: appointmentId }, data: { status: AppointmentStatus.COMPLETED } })
        }
      })
      await auditLog({
        clinicId, userId,
        action: "COMPLETE_VISIT" as any,
        entityType: "VISIT", entityId: visitId,
        newValues: { policy, note: "Completed without post-visit payment (pre-visit policy)" }
      })
      revalidatePath("/waiting-room")
      revalidatePath("/appointments")
      return { success: true }
    }

    // ═══════════════════════════════════════════════════════════
    // SPLIT_PAYMENT & PAY_AFTER_VISIT: Record payment + complete
    // ═══════════════════════════════════════════════════════════
    const result = await prisma.$transaction(async (tx) => {
      let invoiceId: string

      // ── SPLIT_PAYMENT: Use existing pre-visit invoice ──
      if (policy === PaymentWorkflow.SPLIT_PAYMENT && appointmentId) {
        const existingInvoice = await tx.invoice.findFirst({
          where: { appointmentId },
          include: { payments: { where: { method: { not: PaymentMethod.REFUND } } } }
        })

        if (existingInvoice) {
          // Calculate additional amount (extra services added during visit)
          const previousTotal = Number(existingInvoice.amount)
          const additionalAmount = Math.max(0, totalAmount - previousTotal)

          // Add invoice item for additional services if any
          if (additionalAmount > 0) {
            await tx.invoiceItem.create({
              data: {
                invoiceId: existingInvoice.id,
                description: description || "Additional services during visit",
                quantity: 1,
                unitPrice: additionalAmount,
              }
            })
            // ═══ FIX: Update invoice total to reflect new services ═══
            await tx.invoice.update({
              where: { id: existingInvoice.id },
              data: { amount: totalAmount }
            })
          }

          // Record the post-visit payment
          if (paidAmount > 0) {
            await createPaymentRecord(tx, {
              invoiceId: existingInvoice.id,
              amount: paidAmount,
              method: paymentMethod,
              recordedById: userId,
              clinicId,
              branchId,
              notes: "Post-visit payment",
            })
          }

          // ═══ FIX: Recalculate status from ALL payments ═══
          const allPayments = await tx.payment.findMany({
            where: { invoiceId: existingInvoice.id, method: { not: PaymentMethod.REFUND } }
          })
          const newTotalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
          const effectiveTotal = additionalAmount > 0 ? totalAmount : previousTotal
          let newStatus: InvoiceStatus
          if (newTotalPaid >= effectiveTotal) newStatus = InvoiceStatus.PAID
          else if (newTotalPaid > 0) newStatus = InvoiceStatus.PARTIAL
          else newStatus = InvoiceStatus.UNPAID

          await tx.invoice.update({
            where: { id: existingInvoice.id },
            data: { status: newStatus }
          })

          invoiceId = existingInvoice.id
        } else {
          // No pre-visit invoice found (edge case) — create fresh
          const invoice = await tx.invoice.create({
            data: {
              patientId, clinicId, branchId: branchId || null,
              appointmentId: appointmentId || null,
              amount: totalAmount,
              status: paidAmount >= totalAmount ? InvoiceStatus.PAID : (paidAmount > 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.UNPAID),
              notes: description || "Medical Consultation",
            }
          })
          await tx.invoiceItem.create({
            data: { invoiceId: invoice.id, description: description || "Medical Consultation", quantity: 1, unitPrice: totalAmount }
          })
          if (paidAmount > 0) {
            await createPaymentRecord(tx, { invoiceId: invoice.id, amount: paidAmount, method: paymentMethod, recordedById: userId, clinicId, branchId })
          }
          invoiceId = invoice.id
        }
      }
      // ── PAY_AFTER_VISIT (or SPLIT without appointment): Create new invoice ──
      else {
        const invoice = await tx.invoice.create({
          data: {
            patientId, clinicId, branchId: branchId || null,
            appointmentId: appointmentId || null,
            amount: totalAmount,
            status: paidAmount >= totalAmount ? InvoiceStatus.PAID : (paidAmount > 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.UNPAID),
            notes: description || "Medical Consultation",
          }
        })
        await tx.invoiceItem.create({
          data: { invoiceId: invoice.id, description: description || "Medical Consultation", quantity: 1, unitPrice: totalAmount }
        })
        if (paidAmount > 0) {
          await createPaymentRecord(tx, { invoiceId: invoice.id, amount: paidAmount, method: paymentMethod, recordedById: userId, clinicId, branchId })
        }
        invoiceId = invoice.id
      }

      // ═══ Complete the visit ═══
      await tx.visit.update({ where: { id: visitId }, data: { status: "COMPLETED" } })
      if (appointmentId) {
        await tx.appointment.update({ where: { id: appointmentId }, data: { status: AppointmentStatus.COMPLETED } })
      }

      await auditLog({
        clinicId, userId,
        action: "COMPLETE_POST_VISIT_PAYMENT" as any,
        entityType: "INVOICE", entityId: invoiceId,
        newValues: { visitId, totalAmount, paidAmount, policy }
      })
      return { invoiceId }
    })

    revalidatePath("/waiting-room")
    revalidatePath("/invoices")
    revalidatePath("/appointments")
    return { success: true, ...result }
  } catch (error: any) {
    if (error.name === "AuthorizationError" || error.name === "AuthenticationError") return { success: false, error: error.message }
    return { success: false, error: error.message || "Failed to process post-visit payment." }
  }
}
// ══════════════════════════════════════════════════════════════
// MARK NO-SHOW APPOINTMENTS
// ══════════════════════════════════════════════════════════════

export async function markNoShowAppointments(clinicId: string): Promise<ActionResult> {
  try {
    const { userId } = await requireRole("SUPER_ADMIN", "ADMIN")
    const now = new Date()
    const missedAppointments = await prisma.appointment.findMany({
      where: { clinicId, status: AppointmentStatus.SCHEDULED, dateTime: { lt: now }, visit: { is: null } },
      select: { id: true }
    })
    if (missedAppointments.length === 0) return { success: true, message: "No missed appointments found." }

    const updated = await prisma.appointment.updateMany({
      where: { id: { in: missedAppointments.map(a => a.id) }, status: AppointmentStatus.SCHEDULED },
      data: { status: AppointmentStatus.NO_SHOW }
    })
    await auditLog({ clinicId, userId, action: "MARK_NO_SHOW" as any, entityType: "APPOINTMENT", entityId: "BATCH", newValues: { count: updated.count, appointmentIds: missedAppointments.map(a => a.id) } })
    revalidatePath("/appointments")
    return { success: true, message: `Marked ${updated.count} appointment(s) as no-show.` }
  } catch (error: any) {
    if (error.name === "AuthorizationError" || error.name === "AuthenticationError") return { success: false, error: error.message }
    return { success: false, error: "Failed to mark no-show appointments." }
  }
}

// ══════════════════════════════════════════════════════════════
// GET APPOINTMENT WITH FULL PAYMENT INFO
// ═══ CRITICAL FIX: Added hasInvoice and invoiceId to paymentInfo
// ══════════════════════════════════════════════════════════════

export async function getAppointmentWithPaymentInfo(appointmentId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, fullName: true, phone: true } },
      doctor: { select: { id: true, name: true } },
      clinic: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      visit: { select: { id: true, status: true, queueNumber: true, checkedInAt: true } },
      invoices: {
        include: { payments: { where: { method: { not: PaymentMethod.REFUND } }, orderBy: { createdAt: "asc" } }, items: true },
        orderBy: { createdAt: "asc" }
      }
    }
  })
  if (!appointment) return null

  const totalAmount = appointment.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalPaid = appointment.invoices.reduce((sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0), 0)
  const remaining = Math.max(0, totalAmount - totalPaid)

  let paymentStatus: PaymentStatusInfo["status"] = "NO_INVOICE"
  if (appointment.invoices.length > 0) {
    if (totalPaid >= totalAmount) paymentStatus = "PAID"
    else if (totalPaid > 0) paymentStatus = "PARTIALLY_PAID"
    else paymentStatus = "UNPAID"
  }

  const primaryInvoice = appointment.invoices.length > 0 ? appointment.invoices[0] : null

  return {
    ...appointment,
    paymentInfo: {
      hasInvoice: !!primaryInvoice,               
      invoiceId: primaryInvoice?.id,              
      totalAmount,
      totalPaid,
      remaining,
      status: paymentStatus,
      invoices: appointment.invoices
    }
  }
}

// ══════════════════════════════════════════════════════════════
// GET WAITING ROOM ENTRIES WITH PAYMENT CONTEXT
// ══════════════════════════════════════════════════════════════

export async function getWaitingRoomWithPaymentContext(clinicId: string) {
  const policy = await getClinicPaymentPolicy(clinicId)
  const visits = await prisma.visit.findMany({
    where: { clinicId, status: { in: ["WAITING", "WITH_DOCTOR", "PROCEDURE", "BILLING"] } },
    include: {
      patient: { select: { id: true, fullName: true, phone: true } },
      doctor: { select: { id: true, name: true } },
      appointment: { select: { id: true, dateTime: true, type: true, status: true } },
    },
    orderBy: [{ priority: "desc" }, { queueNumber: "asc" }]
  })

  const enrichedVisits = await Promise.all(visits.map(async (visit) => {
    let paymentInfo: PaymentStatusInfo | null = null
    let showBillingAction = false
    let billingActionLabel = ""

    if (visit.appointmentId) {
      paymentInfo = await getAppointmentPaymentStatus(visit.appointmentId)
    }

    if (policy === PaymentWorkflow.PAY_AFTER_VISIT) {
      if (visit.status === "BILLING") { showBillingAction = true; billingActionLabel = "Go to Billing" }
    } else if (policy === PaymentWorkflow.SPLIT_PAYMENT) {
      if (visit.status === "BILLING") {
        showBillingAction = true
        billingActionLabel = paymentInfo && paymentInfo.remaining > 0 ? `Complete Payment (Remaining: ${paymentInfo.remaining})` : "Go to Billing"
      }
    } else if (policy === PaymentWorkflow.PAY_BEFORE_VISIT) {
      showBillingAction = false
    }

    return { ...visit, paymentInfo, showBillingAction, billingActionLabel, clinicPaymentPolicy: policy }
  }))

  return { policy, visits: enrichedVisits }
}