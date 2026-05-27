// src/components/appointments/appointment-form.tsx
"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createAppointment, updateAppointment } from "@/actions/appointments"
import type { ActionResult } from "@/types"

type PatientOption = { id: string; fullName: string }
type DoctorOption = { id: string; name: string }

type AppointmentData = {
  id?: string
  patientId: string
  doctorId: string
  dateTime: Date
  notes?: string | null
}

type Props = {
  patients: PatientOption[]
  doctors: DoctorOption[]
  appointment?: AppointmentData
}

function toLocalDateString(date: Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toLocalTimeString(date: Date): string {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function AppointmentForm({ patients, doctors, appointment }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const isEdit = !!appointment?.id

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      setFieldErrors(result.fieldErrors || {})
    } else {
      router.push("/appointments")
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      if (isEdit && appointment?.id) {
        const result = await updateAppointment(appointment.id, formData)
        handleResult(result)
      } else {
        const result = await createAppointment(formData)
        handleResult(result)
      }
    })
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name]?.[0]
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
            Patient <span className="text-red-500">*</span>
          </label>
          <select
            id="patientId"
            name="patientId"
            defaultValue={appointment?.patientId ?? ""}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
          {fieldError("patientId") && <p className="mt-1 text-xs text-red-600">{fieldError("patientId")}</p>}
        </div>

        <div>
          <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700">
            Doctor <span className="text-red-500">*</span>
          </label>
          <select
            id="doctorId"
            name="doctorId"
            defaultValue={appointment?.doctorId ?? ""}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Doctor...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {fieldError("doctorId") && <p className="mt-1 text-xs text-red-600">{fieldError("doctorId")}</p>}
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={appointment ? toLocalDateString(appointment.dateTime) : ""}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {fieldError("date") && <p className="mt-1 text-xs text-red-600">{fieldError("date")}</p>}
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700">
            Time <span className="text-red-500">*</span>
          </label>
          <input
            id="time"
            name="time"
            type="time"
            defaultValue={appointment ? toLocalTimeString(appointment.dateTime) : ""}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {fieldError("time") && <p className="mt-1 text-xs text-red-600">{fieldError("time")}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={appointment?.notes ?? ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {fieldError("notes") && <p className="mt-1 text-xs text-red-600">{fieldError("notes")}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {isPending ? "Saving..." : isEdit ? "Update Appointment" : "Schedule Appointment"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}