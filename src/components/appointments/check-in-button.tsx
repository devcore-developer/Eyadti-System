"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { verifyPreVisitPayment, type PaymentStatusInfo } from "@/lib/actions/payment-workflow"
import { completePreVisitCheckIn } from "@/lib/actions/visits"
import { PreVisitPaymentDialog } from "./pre-visit-payment-dialog"
import { Button } from "@/components/ui/button"
import { LogIn, Loader2 } from "lucide-react"
import { toast } from "sonner"

type ExistingInvoice = {
  invoiceId: string
  totalAmount: number
  totalPaid: number
  remaining: number
  status: string
}

type Props = {
  appointmentId: string
  patientId: string
  patientName: string
  clinicId: string
  branchId?: string
  isEmergency?: boolean
}

export function CheckInButton({
  appointmentId,
  patientId,
  patientName,
  clinicId,
  branchId,
  isEmergency = false,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentPolicy, setPaymentPolicy] = useState("")
  const [existingInvoice, setExistingInvoice] = useState<ExistingInvoice | null>(null)

  async function handleCheckIn() {
    startTransition(async () => {
      const verification = await verifyPreVisitPayment(appointmentId)

      if (!verification.allowed) {
        if (verification.paymentStatus?.hasInvoice && verification.paymentStatus.invoiceId) {
          setExistingInvoice({
            invoiceId: verification.paymentStatus.invoiceId,
            totalAmount: verification.paymentStatus.totalAmount,
            totalPaid: verification.paymentStatus.totalPaid,
            remaining: verification.paymentStatus.remaining,
            status: verification.paymentStatus.status,
          })
          setPaymentPolicy(verification.reason?.includes("Initial") ? "SPLIT_PAYMENT" : "PAY_BEFORE_VISIT")
          setShowPaymentDialog(true)
        } else {
          setPaymentPolicy(verification.reason?.includes("Initial") ? "SPLIT_PAYMENT" : "PAY_BEFORE_VISIT")
          setExistingInvoice(null)
          setShowPaymentDialog(true)
        }
        return
      }

      const result = await completePreVisitCheckIn({
        appointmentId,
        isEmergency,
      })

      if (result.success) {
        toast.success("Patient checked in successfully")
        router.push("/waiting-room")
        router.refresh()
      } else {
        toast.error(result.error || "Check-in failed")
      }
    })
  }

  function handlePaymentComplete(success: boolean) {
    setShowPaymentDialog(false)

    if (success) {
      startTransition(async () => {
        const result = await completePreVisitCheckIn({
          appointmentId,
          isEmergency,
        })

        if (result.success) {
          toast.success("Payment recorded & patient checked in")
          router.push("/waiting-room")
          router.refresh()
        } else if (result.paymentRequired && result.paymentStatus) {
          toast.info("Partial payment recorded. More payment required.")
          if (result.paymentStatus.hasInvoice && result.paymentStatus.invoiceId) {
            setExistingInvoice({
              invoiceId: result.paymentStatus.invoiceId,
              totalAmount: result.paymentStatus.totalAmount,
              totalPaid: result.paymentStatus.totalPaid,
              remaining: result.paymentStatus.remaining,
              status: result.paymentStatus.status,
            })
          }
          setShowPaymentDialog(true)
          router.refresh()
        } else {
          toast.error(result.error || "Payment recorded but check-in failed")
          router.refresh()
        }
      })
    }
  }

  return (
    <>
      <Button
        onClick={handleCheckIn}
        disabled={isPending}
        size="sm"
        className="rounded-md bg-teal-100 dark:bg-teal-950/50 px-2 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 h-7"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <LogIn className="h-3 w-3 mr-1" />
        )}
        Check-in
      </Button>

      <PreVisitPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onPaymentComplete={handlePaymentComplete}
        appointmentId={appointmentId}
        patientId={patientId}
        patientName={patientName}
        clinicId={clinicId}
        branchId={branchId}
        paymentPolicy={paymentPolicy}
        existingInvoice={existingInvoice}
      />
    </>
  )
}