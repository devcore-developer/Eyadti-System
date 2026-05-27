import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PatientForm } from "@/components/patients/patient-form"

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let session
  try {
    session = await requireRole("ADMIN", "DOCTOR")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") redirect("/login")
    if ((error as any)?.name === "AuthorizationError") redirect("/patients")
    throw error
  }

  const { id } = await params

  const patient = await prisma.patient.findFirst({
    where: {
      id: id,
      clinicId: session.clinicId,
    },
  })

  if (!patient) notFound()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <Link
          href={`/patients/${patient.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Patient
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Patient</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update information for {patient.fullName}.
        </p>
      </div>
      <PatientForm patient={patient} />
    </div>
  )
}