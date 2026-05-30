import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getVisitById } from "@/lib/actions/visits"
import { VisitDetails } from "@/components/visits/visit-details"

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string; visitId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const { id: patientId, visitId } = await params

  const rawVisit: any = await getVisitById(visitId, session.user.clinicId)
  if (!rawVisit) notFound()
  if (rawVisit.patient.id !== patientId) redirect("/patients")

  // تحويل البيانات لتتطابق مع النوع VisitFull المتوقع من المكون
  const visit = {
    ...rawVisit,
    complaints: rawVisit.complaints.map((c: any) => ({
      id: c.id,
      complaint: c.complaint?.name || c.complaintId || "",
    })),
    diagnoses: rawVisit.diagnoses.map((d: any) => ({
      id: d.id,
      diagnosis: d.diagnosis?.name || d.diagnosisId || "",
    })),
    treatmentPlans: rawVisit.treatmentPlans.map((t: any) => ({
      id: t.id,
      treatment: t.treatment || "",
    })),
  }

  return (
    <div className="space-y-6">
      <Link href={`/patients/${patientId}/visits`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to Medical Records
      </Link>
      
      <VisitDetails 
        visit={visit} 
        role={session.user.role} 
        userId={session.user.id}
        patientId={patientId}
      />
    </div>
  )
}