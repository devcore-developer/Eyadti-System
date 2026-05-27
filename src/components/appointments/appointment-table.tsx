// src/components/appointments/appointment-table.tsx
import Link from "next/link"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { AppointmentRowActions } from "./appointment-row-actions"

type AppointmentRow = {
  id: string
  dateTime: Date
  status: string
  notes: string | null
  patient: { id: string; fullName: string }
  doctor: { id: string; name: string }
}

type Props = {
  appointments: AppointmentRow[]
  role: string
  userId: string // عشان الدكتور يقدر يعدل موعده بس
  currentPage: number
  totalPages: number
  searchParams: Record<string, string>
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))
}

function buildPageUrl(page: number, searchParams: Record<string, string>): string {
  const params = new URLSearchParams(searchParams)
  params.set("page", String(page))
  return `/appointments?${params.toString()}`
}

export function AppointmentTable({
  appointments,
  role,
  userId,
  currentPage,
  totalPages,
  searchParams,
}: Props) {
  if (appointments.length === 0) {
    return <div className="py-12 text-center text-gray-500">No appointments found.</div>
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {appointments.map((apt) => (
              <tr key={apt.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  <Link href={`/patients/${apt.patient.id}`} className="text-blue-600 hover:underline">
                    {apt.patient.fullName}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{apt.doctor.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {formatDateTime(apt.dateTime)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <AppointmentStatusBadge status={apt.status as any} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <AppointmentRowActions
                    appointmentId={apt.id}
                    status={apt.status as any}
                    doctorId={apt.doctor.id}
                    role={role}
                    userId={userId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={buildPageUrl(currentPage - 1, searchParams)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={buildPageUrl(currentPage + 1, searchParams)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}