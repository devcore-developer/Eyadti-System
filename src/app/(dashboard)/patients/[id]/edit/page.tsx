import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { canEditPatient } from "@/lib/permissions/patients"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PatientForm } from "@/components/patients/patient-form"

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!canEditPatient(session.user.role)) redirect("/patients")

  const { patientId } = await params

  // جلب بيانات المريض مع عزل العيادة (clinicId)
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId: session.user.clinicId,
    },
  })

  // لو المريض مش موجود أو تابع لعيادة تانية
  if (!patient) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/patients/${patient.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Patient
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Edit Patient
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Update information for {patient.fullName}.
        </p>
      </div>
      
      {/* تمرير بيانات المريض للـ Form */}
      <PatientForm patient={patient} />
    </div>
  )
}