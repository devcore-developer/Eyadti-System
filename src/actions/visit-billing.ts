"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions/patients"
import { InvoiceStatus, PaymentMethod, VisitStatus, AppointmentStatus } from "@prisma/client"
import type { ActionResult, PaymentWorkflowType } from "@/types"
import { revalidatePath } from "next/cache"
import { auditLog } from "@/lib/services/audit"

export async function createVisitInvoice(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }
    
    if (!hasPermission(session.user.role, "invoice:create")) {
      return { success: false, error: "Forbidden: You don't have billing permissions." }
    }

    const clinicId = session.user.clinicId
    const userId = session.user.id

    // ⬇️⬇️⬇️ جلب نظام الدفع ⬇️⬇⬇️
    const clinicSettings = await prisma.clinicSettings.findUnique({
      where: { clinicId },
      select: { paymentWorkflow: true }
    })
    const workflow = (clinicSettings?.paymentWorkflow || "PAY_AFTER_VISIT") as PaymentWorkflowType

    // ⬇️⬇️⬇️ منع إنشاء فاتورة لو العيادة بتاخد فلوس قبل الكشف ⬇️⬇⬇️
    if (workflow === "PAY_BEFORE_VISIT") {
      return { success: false, error: "Invalid Action: This clinic uses 'Pay Before Visit'. The patient should have already paid at reception." }
    }

    const visitId = formData.get("visitId") as string
    const patientId = formData.get("patientId") as string
    const doctorId = formData.get("doctorId") as string
    const totalAmount = parseFloat(formData.get("totalAmount") as string)
    const paidAmount = parseFloat(formData.get("paidAmount") as string)
    const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || PaymentMethod.CASH
    let description = (formData.get("description") as string) || "Medical Consultation / Procedure"

    if (!visitId || !patientId || !totalAmount || isNaN(totalAmount)) {
      return { success: false, error: "Missing required billing information" }
    }

    if (paidAmount > totalAmount) {
      return { success: false, error: "Paid amount cannot exceed total amount" }
    }

    // ⬇️⬇️⬇️ تعديل الوصف لو نظام الدفع منقسم ⬇️⬇⬇️
    if (workflow === "SPLIT_PAYMENT") {
      description = "Procedure / Additional Services Fee (Consultation pre-paid at reception)"
    }

    const invoiceStatus: InvoiceStatus = paidAmount >= totalAmount ? InvoiceStatus.PAID : (paidAmount > 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.UNPAID)

    await prisma.$transaction(async (tx) => {
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

      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description,
          quantity: 1,
          unitPrice: totalAmount,
        }
      })

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

      const visit = await tx.visit.update({
        where: { id: visitId },
        data: { status: VisitStatus.COMPLETED }
      })

      if (visit.appointmentId) {
        await tx.appointment.update({
          where: { id: visit.appointmentId },
          data: { status: AppointmentStatus.COMPLETED }
        })
      }

      await auditLog({ clinicId, userId, action: "CREATE", entityType: "INVOICE", entityId: invoice.id, newValues: { totalAmount, paidAmount, status: invoiceStatus, workflow } })
    })

  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Failed to process billing" }
  }

  revalidatePath("/waiting-room")
  revalidatePath("/invoices")
  return { success: true }
}