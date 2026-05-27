import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getPrescriptionById } from "@/lib/actions/prescriptions"
import { PrescriptionDetails } from "@/components/prescriptions/prescription-details"

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string; prescriptionId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const { id: patientId, prescriptionId } = await params
  const prescription = await getPrescriptionById(prescriptionId, session.user.clinicId)
  if (!prescription || prescription.patientId !== patientId) notFound()

  return (
    <div className="space-y-6">
      <Link href={`/patients/${patientId}/prescriptions`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to Prescriptions
      </Link>
      <PrescriptionDetails prescription={prescription} role={session.user.role} userId={session.user.id} />
    </div>
  )
}