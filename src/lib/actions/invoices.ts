"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { InvoiceStatus } from "@prisma/client"

export async function processRefund(invoiceId: string, amount: number, reason: string) {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clinicId: session.user.clinicId },
      include: { payments: true },
    })

    if (!invoice) return { success: false, error: "Invoice not found" }

    // Calculate total paid (excluding previous refunds)
    const totalPaid = invoice.payments
      .filter((p) => p.method !== "REFUND")
      .reduce((sum, p) => sum + Number(p.amount), 0)
    
    const totalRefunded = invoice.payments
      .filter((p) => p.method === "REFUND")
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const maxRefundable = totalPaid - totalRefunded
    if (amount > maxRefundable) {
      return { success: false, error: `Refund amount exceeds refundable balance of ${maxRefundable}` }
    }

    // Create refund payment (negative amount, REFUND method)
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        clinicId: invoice.clinicId,
        branchId: invoice.branchId,
        amount: -amount,
        method: "REFUND",
        reference: `REFUND-${Date.now()}`,
        notes: reason,
        recordedById: session.user.id,
      },
    })

    // Update invoice status based on remaining balance
    const newRefundTotal = totalRefunded + amount
    const remainingPaid = totalPaid - newRefundTotal

    let newStatus: InvoiceStatus
    if (remainingPaid <= 0) {
      newStatus = "CANCELLED"
    } else if (remainingPaid < Number(invoice.amount)) {
      newStatus = "PARTIAL"
    } else {
      newStatus = "PAID"
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        clinicId: invoice.clinicId,
        branchId: invoice.branchId,
        userId: session.user.id,
        action: "REFUND_PROCESSED",
        entityType: "INVOICE",
        entityId: invoice.id,
        newValues: { amount, reason, invoiceStatus: newStatus },
      },
    })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${invoiceId}`)

    return { success: true }
  } catch (error: unknown) {
    console.error("Refund error:", error)
    return { success: false, error: "Failed to process refund" }
  }
}