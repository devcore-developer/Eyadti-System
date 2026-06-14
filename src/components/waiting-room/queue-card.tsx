"use client"

import { useState, useTransition } from "react"
import { updateVisitStatus } from "@/actions/unified-appointment"
import { VisitStatus, Priority } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Clock, Stethoscope, AlertTriangle, ArrowRight } from "lucide-react"
import { QuickBillingDialog } from "./quick-billing-dialog" // ✨ استيراد النافذة

type QueueCardProps = {
  id: string
  queueNumber: number | null
  patientName: string
  patientId: string // ✨ جديد
  doctorId: string  // ✨ جديد
  doctorName: string
  appointmentType: string
  priority: Priority
  status: VisitStatus
  checkedInAt: Date | null
}

function getWaitTime(checkedInAt: Date | null): string {
  if (!checkedInAt) return "N/A"
  const diff = new Date().getTime() - new Date(checkedInAt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const statusConfig: Record<VisitStatus, { label: string; color: string; nextStatus?: VisitStatus; nextLabel?: string }> = {
  CHECKED_IN: { label: "Checked In", color: "bg-blue-100 text-blue-800", nextStatus: VisitStatus.WAITING, nextLabel: "Move to Waiting" },
  WAITING: { label: "Waiting", color: "bg-yellow-100 text-yellow-800", nextStatus: VisitStatus.WITH_DOCTOR, nextLabel: "Call Patient" },
  WITH_DOCTOR: { label: "With Doctor", color: "bg-green-100 text-green-800", nextStatus: VisitStatus.PROCEDURE, nextLabel: "To Procedure" },
  PROCEDURE: { label: "Procedure", color: "bg-purple-100 text-purple-800", nextStatus: VisitStatus.BILLING, nextLabel: "To Billing" },
  BILLING: { label: "Billing", color: "bg-orange-100 text-orange-800" }, // ✨ لا يوجد nextStatus، سيتم استخدام الـ Dialog
  COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-800" },
}

export function QueueCard({ id, queueNumber, patientName, patientId, doctorId, doctorName, appointmentType, priority, status, checkedInAt }: QueueCardProps) {
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

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${isEmergency ? "border-red-400 bg-red-50/50 shadow-red-100" : "bg-white"}`}>
      {isEmergency && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />}
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center gap-2">
          {queueNumber && <span className="text-2xl font-bold text-gray-400">#{queueNumber}</span>}
          <h3 className="font-bold text-lg">{patientName}</h3>
        </div>
        <Badge className={`${config.color} border-0`}>{config.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4" /> Dr. {doctorName}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {getWaitTime(checkedInAt)}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-xs capitalize">{appointmentType.toLowerCase()}</Badge>
            {isEmergency && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> Urgent</Badge>}
          </div>
          
          {/* ✨ المنطق الجديد: إذا كانت الحالة Billing، اعرض نافذة الدفع، غير ذلك اعرض زر التحريك */}
          {status === VisitStatus.BILLING ? (
            <QuickBillingDialog 
              visitId={id} 
              patientId={patientId} 
              doctorId={doctorId} 
              patientName={patientName} 
            />
          ) : config.nextStatus ? (
            <Button size="sm" onClick={handleNextStatus} disabled={isPending} className="gap-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
              {config.nextLabel} <ArrowRight className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}