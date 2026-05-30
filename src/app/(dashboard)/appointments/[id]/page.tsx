// src/app/(dashboard)/appointments/[id]/page.tsx
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge"
import { AppointmentDetailActions } from "@/components/appointments/appointment-detail-actions"

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const { id } = await params

  const appointment = await prisma.appointment.findFirst({
    where: { id, clinicId: session.user.clinicId },
    include: {
      patient: { select: { id: true, fullName: true, phone: true } },
      doctor: { select: { id: true, name: true } },
    },
  })

  if (!appointment) notFound()

  // لو الدكتور مش الأدمن، لازم نتأكد إن الموعد بتاعه
  if (session.user.role === "DOCTOR" && appointment.doctorId !== session.user.id) {
    redirect("/appointments")
  }

  function formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/appointments" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Appointments
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Appointment Details
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <AppointmentStatusBadge status={appointment.status} />
          <AppointmentDetailActions 
            appointmentId={appointment.id}
            status={appointment.status}
            doctorId={appointment.doctorId}
            role={session.user.role}
            userId={session.user.id}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Schedule Info</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Date & Time</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDateTime(appointment.dateTime)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="mt-1"><AppointmentStatusBadge status={appointment.status} /></dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Notes</dt>
              <dd className="whitespace-pre-wrap text-sm text-gray-900">{appointment.notes || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">People Involved</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Patient</dt>
              <dd className="text-sm font-medium text-gray-900">
                <Link href={`/patients/${appointment.patient.id}`} className="text-blue-600 hover:underline">
                  {appointment.patient.fullName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Patient Phone</dt>
              <dd className="text-sm text-gray-900">{appointment.patient.phone}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Doctor</dt>
              <dd className="text-sm font-medium text-gray-900">{appointment.doctor.name}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}