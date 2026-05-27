// src/app/(dashboard)/appointments/new/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AppointmentForm } from "@/components/appointments/appointment-form"

export default async function NewAppointmentPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  // الأدمن والريسبشنيست بس اللي يقدروا يحجزوا
  if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") {
    redirect("/appointments")
  }

  const [patients, doctors] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId: session.user.clinicId },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({
      where: { clinicId: session.user.clinicId, role: "DOCTOR" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/appointments"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Appointments
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Schedule New Appointment
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details to book a new appointment.
        </p>
      </div>
      <AppointmentForm patients={patients} doctors={doctors} />
    </div>
  )
}