import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { PatientVisitForm } from "@/components/reception/patient-visit-form"
import { AttendancePanel } from "@/components/reception/attendance-panel"
import { PaymentWorkflow } from "@prisma/client"

export default async function NewReceptionPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const params = await searchParams
  const clinicId = session.user.clinicId

  // ═══ GET PAYMENT POLICY ═══
  const settings = await prisma.clinicSettings.findUnique({
    where: { clinicId },
    select: { paymentWorkflow: true }
  })
  const paymentWorkflow = (settings?.paymentWorkflow || PaymentWorkflow.PAY_AFTER_VISIT) as string

  const doctors = await prisma.user.findMany({
    where: { clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  let preselectedPatient = null
  if (params.patientId) {
    preselectedPatient = await prisma.patient.findUnique({
      where: { id: params.patientId, clinicId },
      select: { id: true, fullName: true, phone: true }
    })
  }

  // Get branch for the clinic (if single branch, pass it)
  const branches = await prisma.branch.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true },
    take: 1,
  })

  return (
    <div className="space-y-6">
      <AttendancePanel clinicId={clinicId} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Patient Visit</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Register patient and start visit in one step.
          <span className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md ml-2 font-mono">
            {paymentWorkflow.replace(/_/g, " ")}
          </span>
        </p>
      </div>

      <PatientVisitForm
        clinicId={clinicId}
        branchId={branches[0]?.id}
        doctors={doctors}
        preselectedPatient={preselectedPatient}
        paymentWorkflow={paymentWorkflow}
      />
    </div>
  )
}