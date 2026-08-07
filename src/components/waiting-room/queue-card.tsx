"use client"

import { useState, useTransition } from "react"
import { updateVisitStatus } from "@/actions/unified-appointment"
import { VisitStatus, Priority } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Clock, Stethoscope, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react"
import { QuickBillingDialog } from "./quick-billing-dialog"
import type { PaymentWorkflowType } from "@/types"

type QueueCardProps = {
  id: string
  queueNumber: number | null
  patientName: string
  patientId: string
  doctorId: string
  doctorName: string
  appointmentType: string
  priority: Priority
  status: VisitStatus
  checkedInAt: Date | null
  scheduledTime: Date | string | null
  workflow?: PaymentWorkflowType
}

// ✨ دالة ذكية لحساب الوقت (متبقي ولا انتظار)
function getTimeDisplay(scheduledTime: Date | string | null, checkedInAt: Date | string | null): string {
  const now = new Date()
  const scheduled = scheduledTime ? new Date(scheduledTime) : null
  const checkedIn = checkedInAt ? new Date(checkedInAt) : null

  // لو مفيش موعد محدد، ن fallback لوقت التسجيل
  if (!scheduled) {
    if (!checkedIn) return "Scheduled"
    const diffMs = now.getTime() - checkedIn.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return "Just arrived"
    if (mins < 60) return `Waiting ${mins} min`
    return `Waiting ${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  // الحالة 1: الموعد لسه في المستقبل (المريض مجهز بدري)
  if (now < scheduled) {
    const diffMs = scheduled.getTime() - now.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 60) return `In ${mins} min` // بقى عليه 45 دقيقة مثلاً
    const hours = Math.floor(mins / 60)
    const remMins = mins % 60
    return `In ${hours}h ${remMins}m`  // بقى عليه 4h 15m
  }

  // الحالة 2: الموعد عدى (المريض بيستنى الدكتور فعلياً)
  const diffMs = now.getTime() - scheduled.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Just arrived"
  if (mins < 60) return `Waiting ${mins} min`
  return `Waiting ${Math.floor(mins / 60)}h ${mins % 60}m`
}

const statusConfig: Record<VisitStatus, { label: string; color: string; nextStatus?: VisitStatus; nextLabel?: string }> = {
  CHECKED_IN: { label: "Checked In", color: "bg-blue-100 text-blue-800", nextStatus: VisitStatus.WAITING, nextLabel: "Move to Waiting" },
  WAITING: { label: "Waiting", color: "bg-blue-100 text-blue-800", nextStatus: VisitStatus.WITH_DOCTOR, nextLabel: "Call Patient" },
  WITH_DOCTOR: { label: "With Doctor", color: "bg-green-100 text-green-800", nextStatus: VisitStatus.PROCEDURE, nextLabel: "To Procedure" },
  PROCEDURE: { label: "Procedure", color: "bg-purple-100 text-purple-800", nextStatus: VisitStatus.BILLING, nextLabel: "To Billing" },
  BILLING: { label: "Billing", color: "bg-orange-100 text-orange-800" },
  COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-800" },
}

export function QueueCard({ id, queueNumber, patientName, patientId, doctorId, doctorName, appointmentType, priority, status, checkedInAt, scheduledTime }: QueueCardProps) {
  const [isPending, startTransition] = useTransition()
  const config = statusConfig[status]
  const isEmergency = priority === Priority.URGENT

  function handleNextStatus() {
    if (!config.nextStatus) return
    startTransition(async () => {
      const result = await updateVisitStatus(id, config.nextStatus!)
      if (result.success) toast.success(`Patient moved to ${config.nextLabel}`)
      else toast.error(result.error || "Failed to update status")
    })
  }

  const timeDisplay = getTimeDisplay(scheduledTime, checkedInAt)
  const isWaitingLate = timeDisplay.includes("Waiting") && !timeDisplay.includes("Just arrived")

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md flex flex-col ${isEmergency ? "border-red-400 bg-red-50/50 shadow-red-100 border-l-4 border-l-red-500" : "bg-white"}`}>
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {queueNumber && <span className="text-2xl font-bold text-gray-300 shrink-0">#{queueNumber}</span>}
            <h3 className="font-bold text-lg truncate">{patientName}</h3>
          </div>
          <Badge className={`${config.color} border-0 shrink-0`}>{config.label}</Badge>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1.5 truncate">
            <Stethoscope className="h-4 w-4 shrink-0" /> <span className="truncate">Dr. {doctorName}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <Clock className="h-4 w-4" /> 
            {/* ✨ لو المريض مستني أكتر من 15 دقيقة يبقى لونه برتقاني */}
            <span className={isWaitingLate ? "text-orange-500 font-semibold" : timeDisplay.includes("In ") ? "text-blue-500" : ""}>
              {timeDisplay}
            </span>
          </div>
        </div>
        
        <div className="flex gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-xs capitalize">{appointmentType.toLowerCase()}</Badge>
          {isEmergency && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> Urgent</Badge>}
        </div>
      </div>

      {status !== VisitStatus.COMPLETED && (
        <div className="p-4 pt-0 sm:pt-4 sm:px-4 border-t sm:border-t-0 mt-auto">
          {status === VisitStatus.BILLING ? (
            <QuickBillingDialog 
              visitId={id} 
              patientId={patientId} 
              doctorId={doctorId} 
              patientName={patientName} 
            />
          ) : config.nextStatus ? (
            <Button 
              size="sm" 
              onClick={handleNextStatus} 
              disabled={isPending} 
              className="w-full sm:w-auto gap-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white h-10 sm:h-9"
            >
              {isPending ? "Processing..." : config.nextLabel} <ArrowRight className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  )
}