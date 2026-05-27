// src/components/appointments/appointment-detail-actions.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { changeAppointmentStatus, deleteAppointment } from "@/actions/appointments"
import { AppointmentStatus } from "@prisma/client"
import Link from "next/link"

type Props = {
  appointmentId: string
  status: AppointmentStatus
  doctorId: string
  role: string
  userId: string
}

export function AppointmentDetailActions({ appointmentId, status, doctorId, role, userId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isDoctorOwner = role === "DOCTOR" && doctorId === userId
  const canEdit = (role === "ADMIN" || isDoctorOwner) && status === AppointmentStatus.SCHEDULED
  const canComplete = (role === "ADMIN" || isDoctorOwner) && status === AppointmentStatus.SCHEDULED
  const canCancel = role === "ADMIN" && status !== AppointmentStatus.CANCELLED

  function handleStatusChange(newStatus: AppointmentStatus) {
    setError(null)
    startTransition(async () => {
      const result = await changeAppointmentStatus(appointmentId, newStatus)
      if (!result.success) {
        // التعديل هنا: أضفنا ?? null عشان نطمن TypeScript إننا بنبعت null مش undefined
        setError(result.error ?? null) 
      } else {
        router.refresh()
      }
    })
  }

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAppointment(appointmentId)
      if (!result.success) {
        // التعديل هنا كمان
        setError(result.error ?? null) 
      } else {
        router.push("/appointments")
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-red-600">{error}</span>}
      
      {canEdit && (
        <Link
          href={`/appointments/edit/${appointmentId}`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit
        </Link>
      )}

      {canComplete && (
        <button
          onClick={() => handleStatusChange(AppointmentStatus.COMPLETED)}
          disabled={isPending}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Mark as Completed"}
        </button>
      )}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "Cancelling..." : "Cancel Appointment"}
        </button>
      )}
    </div>
  )
}