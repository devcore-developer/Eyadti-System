import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { QueueCard } from "@/components/waiting-room/queue-card"
import { VisitStatus, PaymentMethod, PaymentWorkflow } from "@prisma/client"
import type { PaymentStatusInfo } from "@/lib/actions/payment-workflow"

// ══════════════════════════════════════════════════════
// Helper: Get payment info for a single appointment
// ══════════════════════════════════════════════════
async function getAppointmentPaymentStatus(appointmentId: string): Promise<PaymentStatusInfo> {
  const invoice = await prisma.invoice.findFirst({
    where: { appointmentId },
    include: { payments: { where: { method: { not: PaymentMethod.REFUND } } } }
  })

  if (!invoice) {
    return { hasInvoice: false, status: "NO_INVOICE", totalAmount: 0, totalPaid: 0, remaining: 0, paymentCount: 0 }
  }

  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Math.max(0, Number(invoice.amount) - totalPaid)

  let status: PaymentStatusInfo["status"]
  if (totalPaid >= Number(invoice.amount)) status = "PAID"
  else if (totalPaid > 0) status = "PARTIALLY_PAID"
  else status = "UNPAID"

  return { hasInvoice: true, invoiceId: invoice.id, status, invoiceStatus: invoice.status, totalAmount: Number(invoice.amount), totalPaid, remaining, paymentCount: invoice.payments.length }
}

export default async function WaitingRoomPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const clinicId = session.user.clinicId

  // ═══════════════════════════════════════════════
  // GET PAYMENT POLICY
  // ══════════════════════════════════════════════════
  const settings = await prisma.clinicSettings.findUnique({
    where: { clinicId },
    select: { paymentWorkflow: true }
  })
  const workflow = (settings?.paymentWorkflow || PaymentWorkflow.PAY_AFTER_VISIT) as PaymentWorkflow

  // ══════════════════════════════════════════════════
  // FETCH ACTIVE VISITS
  // ═══ FIX: Exclude COMPLETED status from active query
  // ══════════════════════════════════════════════════
  const activeVisitStatuses: VisitStatus[] = [
    VisitStatus.WAITING, 
    VisitStatus.WITH_DOCTOR, 
    VisitStatus.PROCEDURE,
  ]

  if (workflow !== PaymentWorkflow.PAY_BEFORE_VISIT) {
    activeVisitStatuses.push(VisitStatus.BILLING)
  }

  const activeVisits = await prisma.visit.findMany({
    where: {
      clinicId,
      status: { in: activeVisitStatuses },
    },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, name: true } },
      appointment: { select: { id: true, type: true, dateTime: true } },
    },
    orderBy: [
      { priority: "desc" },
      { queueNumber: "asc" },
    ],
  })

  // ════════════════════════════════════════════════════
  // CALCULATE WAITING POSITION (before serialization)
  // ══════════════════════════════════════════════
  const waitingQueue = activeVisits
    .filter(v => v.status === VisitStatus.WAITING)
    .sort((a, b) => (a.queueNumber ?? Infinity) - (b.queueNumber ?? Infinity))
  const waitingPositionMap = new Map<string, number>()
  waitingQueue.forEach((v, idx) => {
    waitingPositionMap.set(v.id, idx + 1)
  })

  // ════════════════════════════════════════════════
  // ENRICH WITH PAYMENT CONTEXT (per visit)
  // ════════════════════════════════════════════════
  const serializedVisits = await Promise.all(activeVisits.map(async (v) => {
    let paymentInfo: PaymentStatusInfo | null = null
    let showBillingAction = false
    let billingActionLabel = ""

    if (v.appointmentId) {
      paymentInfo = await getAppointmentPaymentStatus(v.appointmentId)
    }

    if (workflow === PaymentWorkflow.PAY_AFTER_VISIT) {
      if (v.status === VisitStatus.BILLING) {
        showBillingAction = true
        billingActionLabel = "Go to Billing"
      }
    } else if (workflow === PaymentWorkflow.SPLIT_PAYMENT) {
      if (v.status === VisitStatus.BILLING) {
        showBillingAction = true
        if (paymentInfo && paymentInfo.remaining > 0) {
          billingActionLabel = `Complete Payment (${paymentInfo.remaining.toFixed(2)} remaining)`
        } else {
          showBillingAction = false
        }
      }
    } else if (workflow === PaymentWorkflow.PAY_BEFORE_VISIT) {
      showBillingAction = false
    }

    return {
      id: v.id,
      queueNumber: v.queueNumber,
      patientId: v.patientId,
      doctorId: v.doctorId,
      patientName: v.patient.fullName,
      doctorName: v.doctor.name,
      appointmentId: v.appointmentId || null,
      appointmentType: v.appointment?.type || "WALK_IN",
      priority: v.priority,
      status: v.status,
      checkedInAt: v.checkedInAt ? v.checkedInAt.toISOString() : null,
      scheduledTime: v.appointment?.dateTime?.toISOString() || v.visitDate.toISOString(),
      paymentInfo,
      showBillingAction,
      billingActionLabel,
      waitingPosition: waitingPositionMap.get(v.id) ?? null,
    }
  }))

  const waitingCount = serializedVisits.filter(v => v.status === VisitStatus.WAITING).length
  const withDoctorCount = serializedVisits.filter(v => v.status === VisitStatus.WITH_DOCTOR).length
  const procedureCount = serializedVisits.filter(v => v.status === VisitStatus.PROCEDURE).length
  const billingCount = serializedVisits.filter(v => v.status === VisitStatus.BILLING).length

  return (
    <div className="space-y-4 md:space-y-6 animate-fade pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waiting Room</h1>
          <p className="text-sm text-muted-foreground">
            Patients currently inside the clinic
            <span className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md ml-2 font-mono">
              {workflow.replace(/_/g, " ")}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800 rounded-xl px-4 py-2 text-center flex-1 sm:flex-none">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{waitingCount}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Waiting</p>
          </div>
          <div className="bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 rounded-xl px-4 py-2 text-center flex-1 sm:flex-none">
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{withDoctorCount}</p>
            <p className="text-xs text-green-600 dark:text-green-400">With Doctor</p>
          </div>
          {procedureCount > 0 && (
            <div className="bg-purple-50 border border-purple-200 dark:bg-purple-950/30 dark:border-purple-800 rounded-xl px-4 py-2 text-center flex-1 sm:flex-none">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{procedureCount}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Procedure</p>
            </div>
          )}
          {billingCount > 0 && workflow !== PaymentWorkflow.PAY_BEFORE_VISIT && (
            <div className="bg-orange-50 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-800 rounded-xl px-4 py-2 text-center flex-1 sm:flex-none">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{billingCount}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Billing</p>
            </div>
          )}
        </div>
      </div>

      {serializedVisits.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed rounded-2xl bg-white/50 dark:bg-[#223247]/50">
          No patients in the waiting room right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {serializedVisits.map(visit => (
            <QueueCard
              key={visit.id}
              id={visit.id}
              queueNumber={visit.queueNumber}
              patientName={visit.patientName}
              patientId={visit.patientId}
              doctorId={visit.doctorId}
              doctorName={visit.doctorName}
              appointmentType={visit.appointmentType}
              appointmentId={visit.appointmentId}
              priority={visit.priority}
              status={visit.status}
              checkedInAt={visit.checkedInAt ? new Date(visit.checkedInAt) : null}
              scheduledTime={visit.scheduledTime}
              workflow={workflow}
              showBillingAction={visit.showBillingAction}
              billingActionLabel={visit.billingActionLabel}
              paymentInfo={visit.paymentInfo}
              clinicId={clinicId}
              waitingPosition={visit.waitingPosition}
            />
          ))}
        </div>
      )}
    </div>
  )
}