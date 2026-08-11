"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteAppointment } from "@/actions/appointments"
import { AppointmentStatus } from "@prisma/client"
import Link from "next/link"
import { toast } from "sonner"
import { CheckInButton } from "./check-in-button"

type Props = {
  appointmentId: string
  status: AppointmentStatus
  doctorId: string
  role: string
  userId: string
  patientId: string
  patientName: string
  clinicId: string
  branchId?: string
  isEmergency?: boolean
}

export function AppointmentRowActions({ 
  appointmentId, status, doctorId, role, userId,
  patientId, patientName, clinicId, branchId, isEmergency = false,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isDoctorOwner = role === "DOCTOR" && doctorId === userId
  const canEdit = (role === "SUPER_ADMIN" || role === "ADMIN" || isDoctorOwner) && status === AppointmentStatus.SCHEDULED
  const canCheckIn = (role === "SUPER_ADMIN" || role === "ADMIN" || role === "RECEPTIONIST") && status === AppointmentStatus.SCHEDULED
  const canCancel = (role === "SUPER_ADMIN" || role === "ADMIN") && status !== AppointmentStatus.CANCELLED && status !== AppointmentStatus.COMPLETED && status !== AppointmentStatus.NO_SHOW

  function handleCancel() {
    startTransition(async () => {
      const result = await deleteAppointment(appointmentId)
      if (!result.success) {
        toast.error(result.error || "Failed to cancel")
      } else {
        toast.success("Appointment cancelled")
        router.refresh()
      }
    })
  }

  const isViewOnly = status === AppointmentStatus.COMPLETED || status === AppointmentStatus.NO_SHOW

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/appointments/${appointmentId}`} className="text-gray-600 hover:text-gray-900 text-xs">
        View
      </Link>

      {canEdit && (
        <Link href={`/appointments/edit/${appointmentId}`} className="text-blue-600 hover:text-blue-800 text-xs">
          Edit
        </Link>
      )}

      {canCheckIn && (
        <CheckInButton
          appointmentId={appointmentId}
          patientId={patientId}
          patientName={patientName}
          clinicId={clinicId}
          branchId={branchId}
          isEmergency={isEmergency}
        />
      )}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="text-red-600 hover:text-red-800 disabled:opacity-50 text-xs transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  )
}