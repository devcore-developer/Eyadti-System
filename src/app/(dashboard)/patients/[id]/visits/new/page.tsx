import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { VisitForm } from "@/components/visits/visit-form"

export default async function NewVisitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) redirect("/patients")

  const { id: patientId } = await params

  const [patient, doctors] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: { id: true, fullName: true },
    }),
    prisma.user.findMany({
      where: { clinicId: session.user.clinicId, role: "DOCTOR" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!patient) redirect("/patients")

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/patients/${patientId}/visits`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Visits
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Medical Visit</h1>
        <p className="text-sm text-muted-foreground mt-1">Recording visit for {patient.fullName}</p>
      </div>
      <VisitForm patientId={patientId} doctors={doctors} />
    </div>
  )
}