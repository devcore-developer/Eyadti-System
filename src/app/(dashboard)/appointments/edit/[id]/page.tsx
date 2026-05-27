// src/app/(dashboard)/appointments/edit/[id]/page.tsx
import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { AppointmentForm } from "@/components/appointments/appointment-form"

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let session;
  try {
    session = await requireRole("ADMIN", "DOCTOR")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") redirect("/login")
    if (error instanceof AuthorizationError) redirect("/appointments")
    throw error
  }

  const { id } = await params

  const appointment = await prisma.appointment.findFirst({
    where: { id, clinicId: session.clinicId },
  })

  if (!appointment) notFound()

  // لو الدكتور، لازم يتأكد إن الموعد بتاعه
  if (session.role === "DOCTOR" && appointment.doctorId !== session.userId) {
    redirect("/appointments")
  }

  // لا يمكن تعديل موعد ملغي أو مكتمل (عادي تعديله، لكن ده منطقي عشان النظام)
  // لو عايز تمنع التعديل، ابني الـ Logic هنا.

  const [patients, doctors] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId: session.clinicId },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({
      where: { clinicId: session.clinicId, role: "DOCTOR" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/appointments/${appointment.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Appointment
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Edit Appointment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the details of this appointment.
        </p>
      </div>
      <AppointmentForm patients={patients} doctors={doctors} appointment={appointment} />
    </div>
  )
}