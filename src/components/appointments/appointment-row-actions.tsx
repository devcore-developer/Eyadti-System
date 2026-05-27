// src/components/appointments/appointment-row-actions.tsx
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

export function AppointmentRowActions({ appointmentId, status, doctorId, role, userId }: Props) {
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
      // التعديل هنا: أضفنا ?? null
      if (!result.success) setError(result.error ?? null)
      else router.refresh()
    })
  }

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAppointment(appointmentId)
      // التعديل هنا: أضفنا ?? null
      if (!result.success) setError(result.error ?? null)
      else router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      
      <Link
        href={`/appointments/${appointmentId}`}
        className="text-gray-600 hover:text-gray-900"
      >
        View
      </Link>

      {canEdit && (
        <Link
          href={`/appointments/edit/${appointmentId}`}
          className="text-blue-600 hover:text-blue-800"
        >
          Edit
        </Link>
      )}

      {canComplete && (
        <button
          onClick={() => handleStatusChange(AppointmentStatus.COMPLETED)}
          disabled={isPending}
          className="text-green-600 hover:text-green-800 disabled:opacity-50"
        >
          {isPending ? "..." : "Complete"}
        </button>
      )}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "..." : "Cancel"}
        </button>
      )}
    </div>
  )
}