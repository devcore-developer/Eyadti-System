"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions/patients"
import { PaymentMethod, VisitStatus, AppointmentStatus } from "@prisma/client"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { auditLog } from "@/lib/services/audit"
import { completePostVisitPayment } from "@/lib/actions/payment-workflow"

// ══════════════════════════════════════════════════════════════
// CREATE VISIT INVOICE
// Now delegates to the central payment workflow engine
// ══════════════════════════════════════════════════════════════

export async function createVisitInvoice(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    if (!hasPermission(session.user.role, "invoice:create")) {
      return { success: false, error: "Forbidden: You don't have billing permissions." }
    }

    const clinicId = session.user.clinicId

    const visitId = formData.get("visitId") as string
    const patientId = formData.get("patientId") as string
    const doctorId = formData.get("doctorId") as string
    const totalAmount = parseFloat(formData.get("totalAmount") as string)
    const paidAmount = parseFloat(formData.get("paidAmount") as string)
    const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || PaymentMethod.CASH
    const description = (formData.get("description") as string) || "Medical Consultation / Procedure"
    const appointmentId = (formData.get("appointmentId") as string) || null

    if (!visitId || !patientId || !totalAmount || isNaN(totalAmount)) {
      return { success: false, error: "Missing required billing information" }
    }

    // ── Get the visit to find branch and appointment ──
    const visit = await prisma.visit.findFirst({
      where: { id: visitId, clinicId },
      select: { branchId: true, appointmentId: true }
    })

    if (!visit) return { success: false, error: "Visit not found" }

    // ── Delegate to the central payment workflow ──
    const result = await completePostVisitPayment({
      appointmentId: visit.appointmentId || appointmentId,
      visitId,
      patientId,
      totalAmount,
      paidAmount,
      paymentMethod,
      description,
      clinicId,
      branchId: visit.branchId,
      doctorId,
    })

    return result
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || "Failed to process billing" }
  }
}