import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { PatientVisitForm } from "@/components/reception/patient-visit-form"

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

  // جلب الدكاتلة
  const doctors = await prisma.user.findMany({
    where: { clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  // لو الرابط فيه patientId، اجيب بيانات المريض عشان اتعرض في الفورم تلقائي
  let preselectedPatient = null
  if (params.patientId) {
    preselectedPatient = await prisma.patient.findUnique({
      where: { id: params.patientId, clinicId },
      select: { id: true, fullName: true, phone: true }
    })
  }

  return (
    <div className="space-y-6">
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