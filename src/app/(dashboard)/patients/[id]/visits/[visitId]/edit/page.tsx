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
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) redirect("/patients")

  const { id: patientId, visitId } = await params

  const rawVisit: any = await getVisitById(visitId, session.user.clinicId)
  const doctors = await prisma.user.findMany({
    where: { clinicId: session.user.clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
  })

  if (!rawVisit) notFound()
  if (rawVisit.patient.id !== patientId) redirect("/patients")

  // لو دكتور، لازم يكون هو صاحب الزيارة
  if (session.user.role === "DOCTOR" && rawVisit.doctor.id !== session.user.id) {
    redirect(`/patients/${patientId}/visits/${visitId}`)
  }

  // تحويل البيانات لشكل الـ Form مع استخراج الأسماء من العلاقات الجديدة
  const formVisit = {
    id: rawVisit.id,
    patientId: rawVisit.patient.id,
    doctorId: rawVisit.doctor.id,
    visitDate: rawVisit.visitDate,
    notes: rawVisit.notes,
    complaints: rawVisit.complaints.map((c: any) => c.complaint?.name || c.complaintId || ""),
    diagnoses: rawVisit.diagnoses.map((d: any) => d.diagnosis?.name || d.diagnosisId || ""),
    treatmentPlans: rawVisit.treatmentPlans.map((t: any) => t.treatment || ""),
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/patients/${patientId}/visits/${visitId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Visit
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Medical Visit</h1>
        <p className="text-sm text-muted-foreground mt-1">Update visit details for {rawVisit.patient.fullName}</p>
      </div>
      <VisitForm patientId={patientId} doctors={doctors} visit={formVisit} />
    </div>
  )
}