import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PrescriptionForm } from "@/components/prescriptions/prescription-form"

export default async function NewPrescriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ visitId?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  // ✅ أضفنا SUPER_ADMIN عشان يقدر يدخل الصفحة
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) {
    redirect("/patients")
  }

  // ✅ لو المستخدم ماعندوش clinicId (زي السوبر أدمن أحياناً)، منعش الكود يكسر من تحت
  if (!session.user.clinicId) {
    return (
      <div className="p-6 text-center text-red-600">
        You are not assigned to a clinic. Please assign a clinic to your account first.
      </div>
    )
  }

  const { id: patientId } = await params
  const { visitId } = await searchParams

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

  if (!patient) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/patients/${patientId}/prescriptions`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Prescriptions
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Prescription</h1>
        <p className="text-sm text-muted-foreground mt-1">For {patient.fullName}</p>
      </div>
      <PrescriptionForm patientId={patientId} doctors={doctors} visitId={visitId} />
    </div>
  )
}