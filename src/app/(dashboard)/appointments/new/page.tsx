import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AppointmentForm } from "@/components/appointments/appointment-form"

export default async function NewAppointmentPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/appointments")
  }

  const clinicId = session.user.clinicId

  const [patients, doctors, branches] = await Promise.all([
    prisma.patient.findMany({
      where: { 
        clinicId,
        // ═══ صريح: لا نستبعد أي مريض ═══
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({
      where: { clinicId, role: "DOCTOR" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, name: true },
      take: 1,
    }),
  ])

  // ═══ أضف هذا للتشخيص ═══
  console.log(`[NewAppointment] Total patients fetched: ${patients.length} for clinic: ${clinicId}`)

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
      <AppointmentForm
        patients={patients}
        doctors={doctors}
        clinicId={clinicId}
        branchId={branches[0]?.id}
      />
    </div>
  )
}