import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getVisitsByPatientId } from "@/lib/actions/visits"
import { VisitList } from "@/components/visits/visit-list"
import { Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function VisitsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) redirect("/dashboard")

  const { id: patientId } = await params

  // التحقق إن المريض تابع للعيادة
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: session.user.clinicId },
    select: { id: true, fullName: true },
  })
  if (!patient) redirect("/patients")

  const visits = await getVisitsByPatientId(patientId, session.user.clinicId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/patients/${patientId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to {patient.fullName}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
          <p className="text-sm text-muted-foreground mt-1">{patient.fullName} • {visits.length} visit{visits.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href={`/patients/${patientId}/visits/new`}>
          <Button className="gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20 hover:shadow-teal-500/40 transition-all">
            <Plus className="h-4 w-4" /> New Visit
          </Button>
        </Link>
      </div>

      <VisitList visits={visits} patientId={patientId} />
    </div>
  )
}