import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { PatientVisitForm } from "@/components/reception/patient-visit-form"
import { AttendancePanel } from "@/components/reception/attendance-panel"

export default async function NewReceptionPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const params = await searchParams
  const clinicId = session.user.clinicId

  const doctors = await prisma.user.findMany({
    where: { clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  let preselectedPatient = null
  if (params.patientId) {
    preselectedPatient = await prisma.patient.findUnique({
      where: { id: params.patientId, clinicId },
      select: { id: true, fullName: true, phone: true }
    })
  }

  return (
    <div className="space-y-6">
      {/* ⭐ PART 6 — Attendance Panel */}
      <AttendancePanel clinicId={clinicId} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Patient Visit</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register patient and start visit in one step.
        </p>
      </div>
      <PatientVisitForm 
        clinicId={clinicId} 
        doctors={doctors} 
        preselectedPatient={preselectedPatient} 
      />
    </div>
  )
}