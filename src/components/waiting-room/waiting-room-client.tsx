"use client"

import { useState } from "react"
import { AppointmentStatus, VisitStatus, PaymentWorkflow } from "@prisma/client"
import { changeAppointmentStatus } from "@/actions/appointments"
import { updateVisitStatus } from "@/actions/unified-appointment"
import { useRouter } from "next/navigation"
import { User, Clock, Play, CheckCircle2, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PaymentStatusInfo } from "@/lib/actions/payment-workflow"
import { WaitingTimer } from "./waiting-timer"

type WaitingVisit = {
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
  visitDate: Date | string
  workflow: string
  showBillingAction: boolean
  billingActionLabel: string
  paymentInfo: PaymentStatusInfo | null
  appointmentDateTime?: Date | string | null
}

type Props = {
  visits: WaitingVisit[]
}

const visitStatusConfig: Record<string, { label: string; color: string; nextStatus?: VisitStatus; nextLabel?: string }> = {
  WAITING: { label: "Waiting", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200", nextStatus: VisitStatus.WITH_DOCTOR, nextLabel: "Call Patient" },
  WITH_DOCTOR: { label: "With Doctor", color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200", nextStatus: VisitStatus.PROCEDURE, nextLabel: "To Procedure" },
  PROCEDURE: { label: "Procedure", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200", nextStatus: VisitStatus.BILLING, nextLabel: "To Billing" },
  BILLING: { label: "Billing", color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200" },
  COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
}

export function WaitingRoomClient({ visits }: Props) {
  const router = useRouter()

  const handleStatusChange = async (visitId: string, newStatus: VisitStatus) => {
    const result = await updateVisitStatus(visitId, newStatus)
    if (result.success) {
      router.refresh()
    }
  }

  if (visits.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-[#223247]/50 rounded-2xl border">
        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">No Patients Waiting</h2>
        <p className="text-sm text-gray-400 mt-1">The waiting room is empty right now.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visits.map((visit) => {
        const config = visitStatusConfig[visit.status] || visitStatusConfig.WAITING
        const isEmergency = visit.priority === "URGENT"

        return (
          <div
            key={visit.id}
            className={`bg-white dark:bg-[#223247] rounded-2xl border-2 p-5 shadow-sm transition-all ${
              isEmergency ? "border-red-400 dark:border-red-700" : "border-gray-100 dark:border-gray-700"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{visit.patientName}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" /> Dr. {visit.doctorName}
                </p>
              </div>
              <Badge className={`${config.color} border-0`}>{config.label}</Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
              <Clock className="h-4 w-4 text-gray-400" />
              <WaitingTimer
                scheduledTime={visit.appointmentDateTime || visit.visitDate}
                checkedInAt={visit.checkedInAt}
                isEmergency={isEmergency}
              />
              {visit.queueNumber && <span className="ml-auto font-bold text-gray-400">#{visit.queueNumber}</span>}
            </div>

            {visit.paymentInfo && visit.paymentInfo.hasInvoice && (
              <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Payment: {visit.paymentInfo.status === "PAID" ? "✅ Paid" : visit.paymentInfo.status === "PARTIALLY_PAID" ? `⚡ ${visit.paymentInfo.totalPaid.toFixed(0)}/${visit.paymentInfo.totalAmount.toFixed(0)}` : "❌ Unpaid"}
              </div>
            )}

            <div className="flex gap-2">
              {config.nextStatus && (
                <button
                  onClick={() => handleStatusChange(visit.id, config.nextStatus!)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Play className="h-4 w-4" /> {config.nextLabel}
                </button>
              )}

              {visit.showBillingAction && (
                <button
                  onClick={() => router.push(`/invoices/new?visitId=${visit.id}&patientId=${visit.patientId}&doctorId=${visit.doctorId}&appointmentId=${visit.appointmentId || ""}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  <CreditCard className="h-4 w-4" /> {visit.billingActionLabel || "Bill"}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}