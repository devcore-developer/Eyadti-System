"use client"

import { AppointmentStatus, VisitStatus, PaymentWorkflow } from "@prisma/client"
import { updateVisitStatus } from "@/actions/unified-appointment"
import { useRouter } from "next/navigation"
import { User, Play, CheckCircle2, CreditCard, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { PaymentStatusInfo } from "@/lib/actions/payment-workflow"
import { WaitingTimer } from "./waiting-timer"

type Props = {
  id: string
  queueNumber: number | null
  patientName: string
  patientId: string
  doctorId: string
  doctorName: string
  appointmentType: string
  appointmentId: string | null
  priority: string
  status: VisitStatus
  checkedInAt: Date | string | null
  scheduledTime: Date | string
  workflow: string
  showBillingAction: boolean
  billingActionLabel: string
  paymentInfo: PaymentStatusInfo | null
}

// ══════════════════════════════════════════════════════════════
// STATUS CONFIG — Now payment-workflow aware
// ══════════════════════════════════════════════════════════════

function getStatusConfig(
  status: VisitStatus,
  workflow: string,
  showBillingAction: boolean,
  billingActionLabel: string
): {
  label: string
  color: string
  nextStatus?: VisitStatus
  nextLabel?: string
  actionType?: "status" | "billing" | "none"
} {
  const isPreVisit = workflow === PaymentWorkflow.PAY_BEFORE_VISIT

  switch (status) {
    case VisitStatus.WAITING:
      return {
        label: "Waiting",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
        nextStatus: VisitStatus.WITH_DOCTOR,
        nextLabel: "Call Patient",
        actionType: "status",
      }

    case VisitStatus.WITH_DOCTOR:
      return {
        label: "With Doctor",
        color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
        nextStatus: VisitStatus.PROCEDURE,
        nextLabel: "To Procedure",
        actionType: "status",
      }

    case VisitStatus.PROCEDURE:
      // ═══ FIX: Pre-visit payment → Complete directly ═══
      if (isPreVisit) {
        return {
          label: "Procedure",
          color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
          nextStatus: VisitStatus.COMPLETED,
          nextLabel: "Complete Visit",
          actionType: "status",
        }
      }

      // Split / After → go to billing (or complete if no balance)
      if (showBillingAction) {
        return {
          label: "Procedure",
          color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
          nextStatus: VisitStatus.BILLING,
          nextLabel: "To Billing",
          actionType: "status",
        }
      }

      return {
        label: "Procedure",
        color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
        nextStatus: VisitStatus.COMPLETED,
        nextLabel: "Complete Visit",
        actionType: "status",
      }

    case VisitStatus.BILLING:
      if (showBillingAction) {
        return {
          label: "Billing",
          color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
          nextStatus: VisitStatus.COMPLETED,
          nextLabel: billingActionLabel || "Complete Payment",
          actionType: "billing",
        }
      }

      return {
        label: "Finalizing",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        nextStatus: VisitStatus.COMPLETED,
        nextLabel: "Complete Visit",
        actionType: "status",
      }

    case VisitStatus.COMPLETED:
      return {
        label: "Completed",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
        actionType: "none",
      }

    default:
      return {
        label: status,
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        actionType: "none",
      }
  }
}

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

export function QueueCard({
  id,
  queueNumber,
  patientName,
  patientId,
  doctorId,
  doctorName,
  appointmentType,
  appointmentId,
  priority,
  status,
  checkedInAt,
  scheduledTime,
  workflow,
  showBillingAction,
  billingActionLabel,
  paymentInfo,
}: Props) {
  const router = useRouter()
  const isEmergency = priority === "URGENT"
  const config = getStatusConfig(status, workflow, showBillingAction, billingActionLabel)

  const handleStatusChange = async () => {
    if (!config.nextStatus) return

    if (config.actionType === "billing") {
      router.push(
        `/invoices/new?visitId=${id}&patientId=${patientId}&doctorId=${doctorId}&appointmentId=${appointmentId || ""}`
      )
      return
    }

    const result = await updateVisitStatus(id, config.nextStatus)
    if (result.success) {
      router.refresh()
    }
  }

  // Payment info text
  const paymentDisplay = (() => {
    if (!paymentInfo || !paymentInfo.hasInvoice) return null

    if (paymentInfo.status === "PAID") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          <span>Pre-visit payment completed</span>
        </div>
      )
    }

    if (paymentInfo.status === "PARTIALLY_PAID") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <CreditCard className="h-3 w-3" />
          <span>
            Partial: {paymentInfo.totalPaid.toFixed(0)}/{paymentInfo.totalAmount.toFixed(0)}
          </span>
        </div>
      )
    }

    return null
  })()

  return (
    <div
      className={`bg-white dark:bg-[#223247] rounded-2xl border-2 p-5 shadow-sm transition-all ${
        isEmergency
          ? "border-red-400 dark:border-red-700"
          : "border-gray-100 dark:border-gray-700"
      }`}
    >
      {/* ━━━ Header ━━━ */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {patientName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <User className="h-3 w-3" /> Dr. {doctorName}
          </p>
        </div>
        <Badge className={`${config.color} border-0`}>
          {config.label}
        </Badge>
      </div>

      {/* ━━━ Timer / Wait Time ━━━ */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
        <Clock className="h-4 w-4 text-gray-400" />
        <WaitingTimer
          scheduledTime={scheduledTime}
          checkedInAt={checkedInAt}
          isEmergency={isEmergency}
        />
        {queueNumber && (
          <span className="ml-auto font-bold text-gray-400">#{queueNumber}</span>
        )}
      </div>

      {/* ━━━ Payment Info (pre-visit clinics) ━━━ */}
      {workflow === PaymentWorkflow.PAY_BEFORE_VISIT && paymentDisplay && (
        <div className="mb-3">{paymentDisplay}</div>
      )}

      {/* ━━━ Appointment Type ━━━ */}
      {appointmentType && appointmentType !== "WALK_IN" && (
        <div className="mb-3">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {appointmentType.replace(/_/g, " ")}
          </span>
        </div>
      )}

      {/* ━━━ Actions ━━━ */}
      {config.actionType !== "none" && config.nextStatus && (
        <div className="flex gap-2">
          {config.actionType === "status" && (
            <button
              onClick={handleStatusChange}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Play className="h-4 w-4" /> {config.nextLabel}
            </button>
          )}

          {config.actionType === "billing" && (
            <button
              onClick={handleStatusChange}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              <CreditCard className="h-4 w-4" /> {config.nextLabel}
            </button>
          )}
        </div>
      )}

      {/* ━━━ Completed State ━━━ */}
      {status === VisitStatus.COMPLETED && (
        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium py-2">
          <CheckCircle2 className="h-4 w-4" />
          Visit Completed
        </div>
      )}
    </div>
  )
}