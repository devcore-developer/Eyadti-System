import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { getPrescriptionsByPatientId } from "@/lib/actions/prescriptions"
import { PrescriptionTable } from "@/components/prescriptions/prescription-table"
import { Button } from "@/components/ui/button"

export default async function PrescriptionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const { id: patientId } = await params
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: session.user.clinicId },
    select: { id: true, fullName: true },
  })
  if (!patient) notFound()

  const prescriptions = await getPrescriptionsByPatientId(patientId, session.user.clinicId)
  const canCreate = session.user.role === "ADMIN" || session.user.role === "DOCTOR"

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/patients/${patientId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to {patient.fullName}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">{patient.fullName} • {prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""}</p>
        </div>
        {canCreate && (
          <Link href={`/patients/${patientId}/prescriptions/new`}>
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
              <Plus className="h-4 w-4" /> New Prescription
            </Button>
          </Link>
        )}
      </div>
      <div className="glass-card rounded-xl p-6">
        <PrescriptionTable prescriptions={prescriptions} patientId={patientId} />
      </div>
    </div>
  )
}