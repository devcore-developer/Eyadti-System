"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { completePreVisitCheckIn } from "@/lib/actions/visits"
import { finalizeWaitingRoomEntry } from "@/lib/actions/payment-workflow"
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
      const result = await completePreVisitCheckIn({
        appointmentId,
        isEmergency,
      })

      if (result.success) {
        toast.success("Patient checked in successfully")
        router.push("/waiting-room")
        router.refresh()
      } 
      // ═══ SPLIT_PAYMENT: Has remaining balance → show dialog ═══
      else if (result.error === "SPLIT_PRE_VISIT_PAYMENT_REQUIRED" && result.splitPaymentData) {
        const { invoiceTotal, totalPaid, remaining } = result.splitPaymentData

        // ═══ If remaining = 0, skip dialog and enter directly ═══
        if (remaining <= 0) {
          const finalizeResult = await finalizeWaitingRoomEntry({
            appointmentId,
            isEmergency,
          })
          if (finalizeResult.success) {
            toast.success("Patient checked in successfully")
            router.push("/waiting-room")
            router.refresh()
          } else {
            toast.error(finalizeResult.error || "Check-in failed")
          }
          return
        }

        setExistingInvoice({
          invoiceId: result.splitPaymentData.invoiceId,
          totalAmount: invoiceTotal,
          totalPaid,
          remaining,
          status: totalPaid > 0 ? "PARTIALLY_PAID" : "UNPAID",
        })
        setPaymentPolicy("SPLIT_PAYMENT")
        setShowPaymentDialog(true)
      } 
      // ═══ PAY_BEFORE_VISIT: unchanged ═══
      else if (result.error === "PAYMENT_REQUIRED") {
        setPaymentPolicy("PAY_BEFORE_VISIT")
        setExistingInvoice(null)
        setShowPaymentDialog(true)
      } 
      else {
        toast.error(result.error || "Check-in failed")
      }
    })
  }

  function handlePaymentComplete(success: boolean) {
    setShowPaymentDialog(false)

    if (success) {
      startTransition(async () => {
        // ═══ SPLIT_PAYMENT: Use finalizeWaitingRoomEntry (NOT completePreVisitCheckIn again) ═══
        if (paymentPolicy === "SPLIT_PAYMENT") {
          const finalizeResult = await finalizeWaitingRoomEntry({
            appointmentId,
            isEmergency,
          })

          if (finalizeResult.success) {
            toast.success("Payment recorded & patient checked in")
            router.push("/waiting-room")
            router.refresh()
          } else {
            toast.error(finalizeResult.error || "Payment recorded but check-in failed")
            router.refresh()
          }
          return
        }

        // ═══ PAY_BEFORE_VISIT: Original logic — unchanged ═══
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
          setPaymentPolicy("PAY_BEFORE_VISIT")
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