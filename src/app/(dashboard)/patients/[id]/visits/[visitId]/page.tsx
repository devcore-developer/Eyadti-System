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
  if (!["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const { id: patientId, visitId } = await params

  const visit = await getVisitById(visitId, session.user.clinicId)
  if (!visit) notFound()
  if (visit.patient.id !== patientId) redirect("/patients")

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