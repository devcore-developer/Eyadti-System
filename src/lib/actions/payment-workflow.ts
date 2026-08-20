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

/** Returned by check-in actions for SPLIT_PAYMENT so frontend can
 *  show the "Remaining Consultation Fee" dialog with exact numbers. */
export interface SplitCheckInPaymentData {
  invoiceId: string
  invoiceTotal: number
  totalPaid: number
  remaining: number
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

/**
 * Returns true if the clinic uses SPLIT_PAYMENT workflow.
 * Useful for frontend to decide which dialog to show.
 */
export async function isSplitPayment(clinicId: string): Promise<boolean> {
  const policy = await getClinicPaymentPolicy(clinicId)
  return policy === PaymentWorkflow.SPLIT_PAYMENT
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

export async function addPaymentToExistingInvoice(data: {
  invoiceId: string
  amount: number
  paymentMethod: PaymentMethod
  clinicId?: string | undefined
  branchId?: string | null
  notes?: string
}): Promise<ActionResult & { newTotalPaid?: number; newRemaining?: number; newStatus?: string }> {
  try {
    const { userId, clinicId: sessionClinicId } = await requireRole("SUPER_ADMIN", "ADMIN", "RECEPTIONIST")
    const clinicId = data.clinicId || sessionClinicId

    if (!clinicId) return { success: false, error: "Clinic ID is missing." }
    if (!data.invoiceId) return { success: false, error: "Invoice ID is missing." }
    if (!data.amount || data.amount <= 0) return { success: false, error: "Payment amount must be greater than zero" }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, clinicId },
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
        method: data.paymentMethod,
        recordedById: userId,
        clinicId,
        branchId: data.branchId,
        notes: data.notes || "Payment recorded",
      })

      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { status: newStatus }
      })

      await auditLog({
        clinicId, userId,
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
// ═══ FIX: Accepts paidAmount = 0 (creates invoice without payment record)
// ═══ This is valid for SPLIT_PAYMENT at booking time
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
      // ═══ FIX: If paidAmount is 0, just return success with existing invoice ID ═══
      // ═══ This handles the case where the frontend calls this after already creating the invoice ═══
      if (paidAmount <= 0) {
        return { success: true, invoiceId: existingInvoice.id }
      }

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
          notes: "Pre-visit payment",
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
// ═══ FIXED: For SPLIT_PAYMENT, always return payment data.
// ═══ The caller decides whether to block or show dialog.
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
    // ═══ UNTOUCHED: Pay Before requires FULL payment ═══
    if (paymentStatus.status === "PAID") return { allowed: true, paymentStatus }
    return { allowed: false, reason: "Payment required before visit", paymentStatus }
  }

  if (policy === PaymentWorkflow.SPLIT_PAYMENT) {
    // ═══ FIXED: For SPLIT, return allowed=false with payment data.
    // ═══ The frontend/check-in action will use this data to show the
    // ═══ "Remaining Consultation Fee" dialog. We do NOT require
    // ═══ PARTIALLY_PAID — even UNPAID (0 paid at booking) is valid. ═══
    if (paymentStatus.status === "PAID") {
      return { allowed: true, paymentStatus }
    }
    // NOT allowed yet — but return the data so caller can show dialog
    return { allowed: false, reason: "SPLIT_PRE_VISIT_REMAINING", paymentStatus }
  }

  return { allowed: true }
}

// ══════════════════════════════════════════════════════════════
// FINALIZE WAITING ROOM ENTRY
// ═══ NEW: Creates the visit and adds patient to waiting room.
// ═══ Does NOT check payment. The caller is responsible for
// ═══ showing the payment dialog BEFORE calling this.
// ═══
// ═══ Used by:
// ═══   PATH A: After "Add to Waiting Room" payment dialog
// ═══   PATH B: After "Check-in" payment dialog
// ══════════════════════════════════════════════════════════════

export async function finalizeWaitingRoomEntry(data: {
  appointmentId: string
  isEmergency?: boolean
}): Promise<ActionResult & { visitId?: string; queueNumber?: number }> {
  try {
    const { userId, clinicId } = await requireRole("SUPER_ADMIN", "ADMIN", "RECEPTIONIST")

    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, clinicId },
      select: { id: true, patientId: true, doctorId: true, dateTime: true, notes: true, status: true }
    })

    if (!appointment) return { success: false, error: "Appointment not found" }

    const existingVisit = await prisma.visit.findFirst({ where: { appointmentId: data.appointmentId } })
    if (existingVisit) return { success: false, error: "Visit already exists for this appointment" }

    const result = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: data.appointmentId },
        data: { status: AppointmentStatus.CONFIRMED, arrivedAt: new Date() }
      })

      // Generate queue number
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const queueResult = await tx.visit.aggregate({
        where: { clinicId, createdAt: { gte: today, lt: tomorrow }, queueNumber: { not: null } },
        _max: { queueNumber: true }
      })
      const queueNumber = (queueResult._max.queueNumber || 0) + 1

      const visit = await tx.visit.create({
        data: {
          clinicId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentId: appointment.id,
          visitDate: new Date(),
          notes: appointment.notes,
          status: "WAITING",
          queueNumber,
          priority: data.isEmergency ? "URGENT" : "MEDIUM",
          checkedInAt: new Date(),
        }
      })

      return { visitId: visit.id, queueNumber }
    })

    await auditLog({
      clinicId, userId,
      action: "FINALIZE_WAITING_ROOM_ENTRY" as any,
      entityType: "VISIT", entityId: result.visitId,
      newValues: { appointmentId: data.appointmentId, queueNumber: result.queueNumber }
    })

    revalidatePath("/waiting-room")
    revalidatePath("/appointments")
    return { success: true, ...result }
  } catch (error: any) {
    if (error.name === "AuthorizationError" || error.name === "AuthenticationError") return { success: false, error: error.message }
    console.error("Finalize waiting room entry error:", error)
    return { success: false, error: error.message || "Failed to add patient to waiting room." }
  }
}

// ══════════════════════════════════════════════════════════════
// GET CHECK-IN PAYMENT STATUS (for SPLIT_PAYMENT)
// ═══ NEW: Returns SplitCheckInPaymentData without creating visit.
// ═══ Frontend uses this to populate the "Remaining Consultation Fee" dialog.
// ══════════════════════════════════════════════════════════════

export async function getSplitCheckInPaymentData(appointmentId: string): Promise<
  ActionResult & { splitPaymentData?: SplitCheckInPaymentData }
> {
  try {
    const { clinicId } = await requireRole("SUPER_ADMIN", "ADMIN", "RECEPTIONIST")

    const settings = await prisma.clinicSettings.findUnique({
      where: { clinicId },
      select: { paymentWorkflow: true }
    })

    if (settings?.paymentWorkflow !== "SPLIT_PAYMENT") {
      return { success: false, error: "Not a split payment clinic." }
    }

    const invoice = await prisma.invoice.findFirst({
      where: { appointmentId },
      include: { payments: { where: { method: { not: PaymentMethod.REFUND } } } }
    })

    const invoiceTotal = invoice ? Number(invoice.amount) : 0
    const totalPaid = invoice?.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
    const remaining = Math.max(0, invoiceTotal - totalPaid)

    return {
      success: true,
      splitPaymentData: {
        invoiceId: invoice?.id || "",
        invoiceTotal,
        totalPaid,
        remaining,
      }
    }
  } catch (error: any) {
    if (error.name === "AuthorizationError" || error.name === "AuthenticationError") return { success: false, error: error.message }
    return { success: false, error: error.message || "Failed to get payment data." }
  }
}

// ══════════════════════════════════════════════════════════════
// COMPLETE POST-VISIT PAYMENT (for PAY_AFTER_VISIT)
// ═══ UNTOUCHED for PAY_AFTER_VISIT and PAY_BEFORE_VISIT
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

    const policy = await getClinicPaymentPolicy(clinicId)

    // ═══ PAY_BEFORE_VISIT: Payment already done — just complete visit ═══
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
      revalidatePath("/waiting-room"); revalidatePath("/appointments")
      return { success: true }
    }

    // ═══ PAY_AFTER_VISIT: Create invoice + record payment + complete ═══
    // ═══ SPLIT_PAYMENT should NOT use this function — use completeSplitVisitWithServices ═══
    if (policy === PaymentWorkflow.PAY_AFTER_VISIT) {
      const result = await prisma.$transaction(async (tx) => {
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
        await tx.visit.update({ where: { id: visitId }, data: { status: "COMPLETED" } })
        if (appointmentId) {
          await tx.appointment.update({ where: { id: appointmentId }, data: { status: AppointmentStatus.COMPLETED } })
        }
        await auditLog({
          clinicId, userId,
          action: "COMPLETE_POST_VISIT_PAYMENT" as any,
          entityType: "INVOICE", entityId: invoice.id,
          newValues: { visitId, totalAmount, paidAmount, policy }
        })
        return { invoiceId: invoice.id }
      })
      revalidatePath("/waiting-room"); revalidatePath("/invoices"); revalidatePath("/appointments")
      return { success: true, ...result }
    }

    // ═══ SPLIT_PAYMENT should use completeSplitVisitWithServices instead ═══
    return { success: false, error: "Split payment clinics should use completeSplitVisitWithServices." }
  } catch (error: any) {
    if (error.name === "AuthorizationError" || error.name === "AuthenticationError") return { success: false, error: error.message }
    return { success: false, error: error.message || "Failed to process post-visit payment." }
  }
}

// ══════════════════════════════════════════════════════════════
// COMPLETE SPLIT VISIT WITH SERVICES
// ═══ THE SINGLE SOURCE OF TRUTH for SPLIT_PAYMENT Complete Visit.
// ═══ Creates individual invoice items per service, updates total,
// ═══ records payment (even partial), and completes the visit.
// ═══
// ═══ CRITICAL: Accepts paidAmount = 0 (no additional services case)
// ═══ CRITICAL: Accepts partial payments (paidAmount < outstanding)
// ═══ CRITICAL: Backend calculates REAL outstanding — never trusts frontend
// ══════════════════════════════════════════════════════════════

export async function completeSplitVisitWithServices(data: {
  appointmentId: string | null
  visitId: string
  patientId: string
  clinicId: string
  branchId?: string | null
  doctorId: string
  services: Array<{
    name: string
    price: number
    quantity: number
  }>
  paidAmount: number
  paymentMethod: PaymentMethod
}): Promise<ActionResult & { invoiceId?: string }> {
  try {
    const { userId } = await requireRole("SUPER_ADMIN", "ADMIN", "RECEPTIONIST")

    if (!data.visitId || !data.patientId) return { success: false, error: "Missing required fields." }
    if (data.paidAmount < 0) return { success: false, error: "Payment amount cannot be negative." }

    const result = await prisma.$transaction(async (tx) => {
      // ── Find existing pre-visit invoice ──
      let invoice = data.appointmentId
        ? await tx.invoice.findFirst({
            where: { appointmentId: data.appointmentId },
          })
        : null

      const previousTotal = invoice ? Number(invoice.amount) : 0

      // ── Calculate services total from ACTUAL line items ──
      const servicesTotal = data.services.reduce(
        (sum, s) => sum + s.price * s.quantity,
        0
      )
      const newTotal = previousTotal + servicesTotal

      // ── Create invoice if none exists (safety net) ──
      if (!invoice) {
        invoice = await tx.invoice.create({
          data: {
            patientId: data.patientId,
            clinicId: data.clinicId,
            branchId: data.branchId || null,
            appointmentId: data.appointmentId || null,
            amount: newTotal,
            status: InvoiceStatus.UNPAID,
            notes: "Split payment — visit services",
          },
        })
      } else {
        // ── Update invoice total to include services ──
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { amount: newTotal },
        })
      }

      // ── Create individual invoice item per service ──
      for (const service of data.services) {
        if (service.price <= 0 || service.quantity <= 0) continue
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: service.name,
            quantity: service.quantity,
            unitPrice: service.price,
          },
        })
      }

      // ── Record post-visit payment (if any) ──
      // ═══ FIXED: Allow 0 payment (no services case) ═══
      // ═══ FIXED: Allow partial payment (paidAmount < outstanding) ═══
      if (data.paidAmount > 0) {
        await createPaymentRecord(tx, {
          invoiceId: invoice.id,
          amount: data.paidAmount,
          method: data.paymentMethod,
          recordedById: userId,
          clinicId: data.clinicId,
          branchId: data.branchId,
          notes: "Post-visit payment (split payment)",
        })
      }

      // ── Recalculate invoice status from ALL payments ──
      const allPayments = await tx.payment.findMany({
        where: { invoiceId: invoice.id, method: { not: PaymentMethod.REFUND } },
      })
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      let newStatus: InvoiceStatus
      if (totalPaid >= newTotal) newStatus = InvoiceStatus.PAID
      else if (totalPaid > 0) newStatus = InvoiceStatus.PARTIAL
      else newStatus = InvoiceStatus.UNPAID

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      })

      // ── Complete the visit ──
      await tx.visit.update({
        where: { id: data.visitId },
        data: { status: "COMPLETED" },
      })

      // ── Complete the appointment ──
      if (data.appointmentId) {
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: AppointmentStatus.COMPLETED },
        })
      }

      await auditLog({
        clinicId: data.clinicId,
        userId,
        action: "COMPLETE_SPLIT_VISIT_WITH_SERVICES" as any,
        entityType: "INVOICE",
        entityId: invoice.id,
        newValues: {
          visitId: data.visitId,
          previousTotal,
          servicesTotal,
          newTotal,
          paidAmount: data.paidAmount,
          totalPaid,
          newStatus,
        },
      })

      return { invoiceId: invoice.id }
    })

    revalidatePath("/waiting-room")
    revalidatePath("/invoices")
    revalidatePath("/appointments")
    return { success: true, ...result }
  } catch (error: any) {
    if (error.name === "AuthorizationError" || error.name === "AuthenticationError")
      return { success: false, error: error.message }
    return { success: false, error: error.message || "Failed to complete visit." }
  }
}

// ══════════════════════════════════════════════════════════════
// MARK NO-SHOW APPOINTMENTS (unchanged)
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
// GET APPOINTMENT WITH FULL PAYMENT INFO (unchanged)
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
// GET WAITING ROOM ENTRIES WITH PAYMENT CONTEXT (unchanged)
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