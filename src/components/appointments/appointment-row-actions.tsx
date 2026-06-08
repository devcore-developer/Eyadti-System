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
  const canEdit = (role === "SUPER_ADMIN" || role === "ADMIN" || isDoctorOwner) && status === AppointmentStatus.SCHEDULED
  
  // ← الزرار ده اللي بيخلي المريض يدخل غرفة الانتظار
  const canCheckIn = (role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECEPTIONIST") && status === AppointmentStatus.SCHEDULED
  
  // ← الزرار ده عشان الدكتور يقول المريض دخل عندي
  const canStartConsultation = (role === "SUPER_ADMIN" || role === "ADMIN" || isDoctorOwner) && status === AppointmentStatus.ARRIVED
  
  const canComplete = (role === "SUPER_ADMIN" || role === "ADMIN" || isDoctorOwner) && status === AppointmentStatus.IN_PROGRESS
  const canCancel = (role === "SUPER_ADMIN" || role === "ADMIN") && status !== AppointmentStatus.CANCELLED

  function handleStatusChange(newStatus: AppointmentStatus) {
    setError(null)
    startTransition(async () => {
      const result = await changeAppointmentStatus(appointmentId, newStatus)
      if (!result.success) setError(result.error ?? null)
      else router.refresh()
    })
  }

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAppointment(appointmentId)
      if (!result.success) setError(result.error ?? null)
      else router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      
      <Link href={`/appointments/${appointmentId}`} className="text-gray-600 hover:text-gray-900">
        View
      </Link>

      {canEdit && (
        <Link href={`/appointments/edit/${appointmentId}`} className="text-blue-600 hover:text-blue-800">
          Edit
        </Link>
      )}

      {/* ↓↓↓ الزرار الجديد ↓↓↓ */}
      {canCheckIn && (
        <button
          onClick={() => handleStatusChange(AppointmentStatus.ARRIVED)}
          disabled={isPending}
          className="rounded-md bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-200 disabled:opacity-50"
        >
          {isPending ? "..." : "✓ Check-in"}
        </button>
      )}

      {canStartConsultation && (
        <button
          onClick={() => handleStatusChange(AppointmentStatus.IN_PROGRESS)}
          disabled={isPending}
          className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800 hover:bg-indigo-200 disabled:opacity-50"
        >
          {isPending ? "..." : "▶ Start Consult."}
        </button>
      )}

      {canComplete && (
        <button
          onClick={() => handleStatusChange(AppointmentStatus.COMPLETED)}
          disabled={isPending}
          className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-200 disabled:opacity-50"
        >
          {isPending ? "..." : "✓ Complete"}
        </button>
      )}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="text-red-600 hover:text-red-800 disabled:opacity-50 text-xs"
        >
          Cancel
        </button>
      )}
    </div>
  )
}