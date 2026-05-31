import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getPrescriptionById } from "@/lib/actions/prescriptions"
import { PrescriptionForm } from "@/components/prescriptions/prescription-form"

export default async function EditPrescriptionPage({
  params,
}: {
  params: Promise<{ id: string; prescriptionId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) redirect("/patients")

  const { id: patientId, prescriptionId } = await params
  const prescription = await getPrescriptionById(prescriptionId, session.user.clinicId)
  if (!prescription || prescription.patientId !== patientId) notFound()

  if (session.user.role === "DOCTOR" && prescription.doctorId !== session.user.id) {
    redirect(`/patients/${patientId}/prescriptions/${prescriptionId}`)
  }

  const doctors = await prisma.user.findMany({
    where: { clinicId: session.user.clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
  })

  const formPrescription = {
    id: prescription.id,
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    visitId: prescription.visitId,
    items: prescription.items.map((i: any) => ({
      medicationName: i.medicationName,
      dosage: i.dosage,
      frequency: i.frequency,
      duration: i.duration,
      instructions: i.instructions || "",
    })),
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/patients/${patientId}/prescriptions/${prescriptionId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Prescription
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Prescription</h1>
      </div>
      <PrescriptionForm patientId={patientId} doctors={doctors} prescription={formPrescription} />
    </div>
  )
}