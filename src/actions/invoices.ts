"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { invoiceCreateSchema, updateInvoiceStatusSchema } from "@/lib/validations/invoice"
import type { ActionResult } from "@/types"
import { InvoiceStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { notifyInvoiceCreated, notifyInvoicePaid } from "@/lib/notifications/events"
import { auditLog } from "@/lib/services/audit" // ← جديد

// ─── Create Invoice ──────────────────────────────────────────────────
export async function createInvoice(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST")) {
    return { success: false, error: "Unauthorized" }
  }

  const items = []
  let i = 0
  while (formData.get(`items[${i}][description]`)) {
    items.push({
      description: formData.get(`items[${i}][description]`) as string,
      quantity: formData.get(`items[${i}][quantity]`) as string,
      unitPrice: formData.get(`items[${i}][unitPrice]`) as string,
    })
    i++
  }

  const raw = {
    patientId: formData.get("patientId") as string,
    items,
  }

  const validated = invoiceCreateSchema.safeParse(raw)
  if (!validated.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const patient = await prisma.patient.findFirst({
    where: { id: validated.data.patientId, clinicId: session.user.clinicId },
  })
  if (!patient) return { success: false, error: "Patient not found or does not belong to this clinic." }

  const totalAmount = validated.data.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  )

  try {
    const invoice = await prisma.invoice.create({
      data: {
        patientId: validated.data.patientId,
        clinicId: session.user.clinicId,
        amount: totalAmount,
        status: InvoiceStatus.UNPAID,
        items: {
          create: validated.data.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        },
      },
    })

    // ← إرسال إشعار بإنشاء فاتورة جديدة
    if (invoice) {
      await notifyInvoiceCreated(
        invoice.id,
        patient.fullName,
        totalAmount.toString(),
        session.user.clinicId,
        session.user.id
      )

      // ← Audit Log: تسجيل إنشاء فاتورة
      await auditLog({
        clinicId: session.user.clinicId,
        userId: session.user.id,
        action: "CREATE",
        entityType: "INVOICE",
        entityId: invoice.id,
        newValues: { amount: totalAmount, status: InvoiceStatus.UNPAID, items: validated.data.items },
      })
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to create invoice." }
  }

  revalidatePath("/invoices")
  return { success: true }
}

// ─── Update Invoice Status ────────────────────────────────────────────
export async function updateInvoiceStatus(
  invoiceId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST")) {
    return { success: false, error: "Unauthorized" }
  }

  const raw = {
    status: formData.get("status") as string,
  }

  const validated = updateInvoiceStatusSchema.safeParse(raw)
  if (!validated.success) {
    return { success: false, error: "Invalid status provided" }
  }

  // جلب الفاتورة مع بيانات المريض عشان الإشعار
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clinicId: session.user.clinicId },
    include: { patient: { select: { fullName: true } } }
  })

  if (!invoice) return { success: false, error: "Invoice not found" }

  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: validated.data.status },
    })

    // ← إرسال إشعار في حالة الدفع فقط
    if (validated.data.status === InvoiceStatus.PAID) {
      await notifyInvoicePaid(
        invoiceId,
        invoice.patient.fullName,
        invoice.amount.toString(),
        session.user.clinicId,
        session.user.id
      )
    }

    // ← Audit Log: تسجيل تغيير حالة الفاتورة (دفع أو إلغاء)
    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: validated.data.status === InvoiceStatus.PAID ? "PAID" : "UPDATE",
      entityType: "INVOICE",
      entityId: invoiceId,
      oldValues: { status: invoice.status },
      newValues: { status: validated.data.status },
    })
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update invoice status." }
  }

  revalidatePath("/invoices")
  revalidatePath(`/invoices/${invoiceId}`)
  return { success: true }
}