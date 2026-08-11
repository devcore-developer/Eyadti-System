"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Phone,
  Calendar,
  Clock,
  CreditCard,
  LogIn,
  Pencil,
  XCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { PaymentMethod } from "@prisma/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type PaymentInfoType = {
  totalAmount: number
  totalPaid: number
  remaining: number
  status: string
  hasInvoice: boolean
  paymentCount: number
  invoiceId?: string
}

type AppointmentData = {
  id: string
  dateTime: Date
  status: string
  type?: string
  notes: string | null
  isToday: boolean
  isPast: boolean
  isOverdue: boolean
  isFuture?: boolean
  paymentInfo: PaymentInfoType | null
  patient: {
    id: string
    fullName: string
    phone?: string
    gender?: string
    dateOfBirth?: Date
  }
  doctor: { id: string; name: string }
  visit?: { id: string; status: string; queueNumber?: number | null } | null
}

type Props = {
  appointment: AppointmentData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  clinicId: string
  role: string
  userId: string
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))
}

function formatDOB(dob?: Date): string {
  if (!dob) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dob))
}

function getStatusColor(status: string, isOverdue: boolean): string {
  if (isOverdue) return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
  switch (status) {
    case "SCHEDULED": return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
    case "CONFIRMED": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
    case "COMPLETED": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
    case "CANCELLED": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    case "NO_SHOW": return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
    default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
  }
}

function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "PAID": return "text-emerald-600 dark:text-emerald-400"
    case "PARTIALLY_PAID": return "text-amber-600 dark:text-amber-400"
    case "UNPAID": return "text-red-600 dark:text-red-400"
    default: return "text-slate-500"
  }
}

export function AppointmentDetailDrawer({
  appointment,
  open,
  onOpenChange,
  clinicId,
  role,
  userId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.CASH)

  // ═══ FIX: Destructure after null check to satisfy TypeScript ═══
  const aptId = appointment?.id ?? ""
  const aptPatientId = appointment?.patient.id ?? ""
  const aptPatientName = appointment?.patient.fullName ?? ""
  const aptStatus = appointment?.status ?? ""
  const aptType = appointment?.type
  const aptIsOverdue = appointment?.isOverdue ?? false
  const aptDateTime = appointment?.dateTime
  const aptDoctorName = appointment?.doctor.name ?? ""
  const aptVisit = appointment?.visit
  const aptPaymentInfo = appointment?.paymentInfo
  const aptPatient = appointment?.patient
  const aptClinicId = clinicId

  const canManage = ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(role)
  const isScheduled = aptStatus === "SCHEDULED"
  const hasUnpaidInvoice = aptPaymentInfo?.hasInvoice && aptPaymentInfo.status !== "PAID"
  const hasNoInvoice = !aptPaymentInfo?.hasInvoice

  async function handleCheckIn() {
    if (hasUnpaidInvoice && aptPaymentInfo) {
      setShowPaymentForm(true)
      setPayAmount(aptPaymentInfo.remaining.toString())
      return
    }
    
    startTransition(async () => {
      const { completePreVisitCheckIn } = await import("@/lib/actions/visits")
      const result = await completePreVisitCheckIn({
        appointmentId: aptId,
        isEmergency: aptType === "EMERGENCY",
      })
      if (result.success) {
        toast.success("Patient checked in")
        onOpenChange(false)
        router.push("/waiting-room")
        router.refresh()
      } else if (result.paymentRequired && result.paymentStatus) {
        // ═══ FIX: Re-open payment form if still not enough ═══
        toast.info("Payment required before check-in")
        if (result.paymentStatus.hasInvoice && result.paymentStatus.invoiceId) {
          // Refresh payment info from result
          setPayAmount(result.paymentStatus.remaining.toString())
        }
        setShowPaymentForm(true)
      } else {
        toast.error(result.error || "Check-in failed")
      }
    })
  }

  async function handleRecordPayment() {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }

    startTransition(async () => {
      let result: { success: boolean; error?: string; paymentRequired?: boolean; paymentStatus?: any } | undefined

      if (hasUnpaidInvoice && aptPaymentInfo?.invoiceId) {
        const { addPaymentToExistingInvoice } = await import("@/lib/actions/payment-workflow")
        result = await addPaymentToExistingInvoice({
          invoiceId: aptPaymentInfo.invoiceId,
          amount,
          paymentMethod: payMethod,
          clinicId: aptClinicId,
          branchId: undefined, // ← تم التعديل هنا
          notes: "Payment during check-in",
        })
      } else {
        const { createPreVisitPayment } = await import("@/lib/actions/payment-workflow")
        result = await createPreVisitPayment({
          appointmentId: aptId,
          patientId: aptPatientId,
          amount,
          paidAmount: amount,
          paymentMethod: payMethod,
          description: "Consultation fee",
          clinicId: aptClinicId,
          branchId: undefined, // ← تم التعديل هنا
        })
      }

      if (result?.success) {
        toast.success("Payment recorded")
        setShowPaymentForm(false)
        setPayAmount("")

        // ═══ CRITICAL FIX: Auto check-in after payment ═══
        const { completePreVisitCheckIn } = await import("@/lib/actions/visits")
        const checkInResult = await completePreVisitCheckIn({
          appointmentId: aptId,
          isEmergency: aptType === "EMERGENCY",
        })

        if (checkInResult.success) {
          toast.success("Patient checked in successfully")
          onOpenChange(false)
          router.push("/waiting-room")
        } else if (checkInResult.paymentRequired && checkInResult.paymentStatus) {
          // Partial payment not enough — keep form open with updated remaining
          toast.info("Partial payment recorded. More payment required.")
          setPayAmount(checkInResult.paymentStatus.remaining.toString())
          setShowPaymentForm(true)
          router.refresh()
        } else {
          toast.error(checkInResult.error || "Payment recorded but check-in failed")
          router.refresh()
        }
      } else {
        toast.error(result?.error || "Payment failed")
      }
    })
  }

  async function handleCancel() {
    const { changeAppointmentStatus } = await import("@/actions/appointments")
    const result = await changeAppointmentStatus(aptId, "CANCELLED" as any)
    if (result.success) {
      toast.success("Appointment cancelled")
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to cancel")
    }
  }

  if (!appointment) return null

  const { patient, doctor, paymentInfo, isOverdue } = appointment

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1a2e] border-b border-slate-200 dark:border-slate-700/50 px-6 py-4">
          <SheetHeader>
            <SheetTitle className="text-left">Appointment Details</SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={cn("px-3 py-1 text-xs font-medium", getStatusColor(aptStatus, aptIsOverdue))}>
              {aptIsOverdue ? "Overdue" : aptStatus.replace(/_/g, " ")}
            </Badge>
            {aptType && (
              <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {aptType.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* Patient Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Patient</h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{patient.fullName}</p>
                  <p className="text-[11px] text-slate-500">ID: {patient.id.slice(0, 8)}...</p>
                </div>
              </div>
              {patient.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {patient.phone}
                </div>
              )}
              {patient.gender && (
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <User className="h-4 w-4 text-slate-400" />
                  {patient.gender}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4 text-slate-400" />
                {formatDOB(patient.dateOfBirth)}
              </div>
            </div>
          </div>

          {/* Appointment Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Appointment</h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {aptDateTime ? formatDateTime(aptDateTime) : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">Doctor:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Dr. {aptDoctorName}</span>
              </div>
              {aptVisit && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Queue:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    #{aptVisit.queueNumber ?? "—"} — {aptVisit.status.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment</h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 p-4">
              {paymentInfo?.hasInvoice ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Total</p>
                      <p className="text-sm font-bold">{paymentInfo.totalAmount.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Paid</p>
                      <p className="text-sm font-bold text-emerald-600">{paymentInfo.totalPaid.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Remaining</p>
                      <p className={cn("text-sm font-bold", getPaymentStatusColor(paymentInfo.status))}>
                        {paymentInfo.remaining.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    {paymentInfo.status === "PAID" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={cn("text-xs font-medium", getPaymentStatusColor(paymentInfo.status))}>
                      {paymentInfo.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-sm text-slate-500">
                  No invoice created yet
                </div>
              )}
            </div>
          </div>

          {/* Quick Payment Form */}
          {showPaymentForm && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Record Payment</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Amount (EGP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Method</Label>
                  <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPaymentForm(false)} className="flex-1">Cancel</Button>
                <Button size="sm" onClick={handleRecordPayment} disabled={isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Record
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs justify-start"
                onClick={() => { router.push(`/patients/${patient.id}`); onOpenChange(false) }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View Patient
              </Button>

              {isScheduled && canManage && (
                <Button
                  size="sm"
                  className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleCheckIn}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <LogIn className="h-3.5 w-3.5 mr-1" />
                  )}
                  Check-in
                </Button>
              )}

              {canManage && (hasUnpaidInvoice || hasNoInvoice) && !showPaymentForm && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    if (hasUnpaidInvoice && paymentInfo) setPayAmount(paymentInfo.remaining.toString())
                    setShowPaymentForm(true)
                  }}
                >
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  Record Payment
                </Button>
              )}

              {isScheduled && canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => { router.push(`/appointments/edit/${aptId}`); onOpenChange(false) }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}

              {isScheduled && canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleCancel}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}