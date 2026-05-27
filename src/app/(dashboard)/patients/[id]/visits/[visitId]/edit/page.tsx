import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getVisitById } from "@/lib/actions/visits"
import { VisitForm } from "@/components/visits/visit-form"

export default async function EditVisitPage({
  params,
}: {
  params: Promise<{ id: string; visitId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) redirect("/patients")

  const { id: patientId, visitId } = await params

  const [visit, doctors] = await Promise.all([
    getVisitById(visitId, session.user.clinicId),
    prisma.user.findMany({
      where: { clinicId: session.user.clinicId, role: "DOCTOR" },
      select: { id: true, name: true },
    }),
  ])

  if (!visit) notFound()
  if (visit.patient.id !== patientId) redirect("/patients")

  // لو دكتور، لازم يكون هو صاحب الزيارة
  if (session.user.role === "DOCTOR" && visit.doctor.id !== session.user.id) {
    redirect(`/patients/${patientId}/visits/${visitId}`)
  }

  // تحويل البيانات لشكل الـ Form
  const formVisit = {
    id: visit.id,
    patientId: visit.patient.id,
    doctorId: visit.doctor.id,
    visitDate: visit.visitDate,
    notes: visit.notes,
    complaints: visit.complaints.map(c => c.complaint),
    diagnoses: visit.diagnoses.map(d => d.diagnosis),
    treatmentPlans: visit.treatmentPlans.map(t => t.treatment),
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/patients/${patientId}/visits/${visitId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Visit
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Medical Visit</h1>
        <p className="text-sm text-muted-foreground mt-1">Update visit details for {visit.patient.fullName}</p>
      </div>
      <VisitForm patientId={patientId} doctors={doctors} visit={formVisit} />
    </div>
  )
}