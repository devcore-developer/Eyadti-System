"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth" // ✨ استبدال requireRole
import { hasPermission } from "@/lib/permissions/patients" // ✨ نظام الصلاحيات
import { InvoiceStatus, PaymentMethod, VisitStatus, AppointmentStatus } from "@prisma/client"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { auditLog } from "@/lib/services/audit"

export async function createVisitInvoice(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }
    
    // ✨ التأكد من صلاحية إنشاء الفاتورة
    if (!hasPermission(session.user.role, "invoice:create")) {
      return { success: false, error: "Forbidden: You don't have billing permissions." }
    }

    const clinicId = session.user.clinicId
    const userId = session.user.id

    const visitId = formData.get("visitId") as string
    const patientId = formData.get("patientId") as string
    const doctorId = formData.get("doctorId") as string
    const totalAmount = parseFloat(formData.get("totalAmount") as string)
    const paidAmount = parseFloat(formData.get("paidAmount") as string)
    const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || PaymentMethod.CASH
    const description = (formData.get("description") as string) || "Medical Consultation / Procedure"

    if (!visitId || !patientId || !totalAmount || isNaN(totalAmount)) {
      return { success: false, error: "Missing required billing information" }
    }

    if (paidAmount > totalAmount) {
      return { success: false, error: "Paid amount cannot exceed total amount" }
    }

    const invoiceStatus: InvoiceStatus = paidAmount >= totalAmount ? InvoiceStatus.PAID : (paidAmount > 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.UNPAID)

    await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          patientId,
          clinicId,
          amount: totalAmount,
          discount: 0,
          tax: 0,
          status: invoiceStatus,
          notes: description,
        }
      })

      // 2. Create Invoice Item
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description,
          quantity: 1,
          unitPrice: totalAmount,
        }
      })

      // 3. Record Payment (if any)
      if (paidAmount > 0) {
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: paidAmount,
            method: paymentMethod,
            recordedById: userId,
            clinicId,
          }
        })
      }

      // 4. Update Visit Status to COMPLETED
      const visit = await tx.visit.update({
        where: { id: visitId },
        data: { status: VisitStatus.COMPLETED }
      })

      // 5. Update Appointment Status to COMPLETED (if linked)
      if (visit.appointmentId) {
        await tx.appointment.update({
          where: { id: visit.appointmentId },
          data: { status: AppointmentStatus.COMPLETED }
        })
      }

      await auditLog({ clinicId, userId, action: "CREATE", entityType: "INVOICE", entityId: invoice.id, newValues: { totalAmount, paidAmount, status: invoiceStatus } })
    })

  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Failed to process billing" }
  }

  revalidatePath("/waiting-room")
  revalidatePath("/invoices")
  return { success: true }
}