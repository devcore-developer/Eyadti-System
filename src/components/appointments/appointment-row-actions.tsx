"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteAppointment } from "@/actions/appointments"
import { checkInAppointment } from "@/actions/unified-appointment" // ✨ الـ Action الجديد
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
  
  // ✨ شروط الأزرار الجديدة بناءً على الـ Workflow الجديد
  const canCheckIn = (role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECEPTIONIST") && status === AppointmentStatus.SCHEDULED
  const canCancel = (role === "SUPER_ADMIN" || role === "ADMIN") && status !== AppointmentStatus.CANCELLED && status !== AppointmentStatus.COMPLETED

  // ✨ دالة الـ Check-in الجديدة
  function handleCheckIn() {
    setError(null)
    startTransition(async () => {
      const result = await checkInAppointment(appointmentId)
      if (!result.success) {
        setError(result.error ?? "Check-in failed")
      } else {
        router.refresh()
      }
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
      
      <Link href={`/appointments/${appointmentId}`} className="text-gray-600 hover:text-gray-900 text-xs">
        View
      </Link>

      {canEdit && (
        <Link href={`/appointments/edit/${appointmentId}`} className="text-blue-600 hover:text-blue-800 text-xs">
          Edit
        </Link>
      )}

      {/* ✨ زر الـ Check-in الجديد */}
      {canCheckIn && (
        <button
          onClick={handleCheckIn}
          disabled={isPending}
          className="rounded-md bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-200 disabled:opacity-50"
        >
          {isPending ? "..." : "✓ Check-in"}
        </button>
      )}

      {/* لا نحتاج أزرار Start Consultation أو Complete هنا، لأن هذا يتم من الـ Waiting Room الآن */}

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