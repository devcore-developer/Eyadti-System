"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
      // ═══════════════════════════════════════════════════════════
      // FIX: الـ Backend الآن هو الـ Gatekeeper الوحيد
      // شيلنا استدعاء verifyPreVisitPayment عشان الـ Backend يقرر
      // ═══════════════════════════════════════════════════════════
      const result = await completePreVisitCheckIn({
        appointmentId,
        isEmergency,
      })

      if (result.success) {
        // 1. الحالة العادية: دخل غرفة الانتظار بنجاح (Pay After أو Split مدفوع بالكامل)
        toast.success("Patient checked in successfully")
        router.push("/waiting-room")
        router.refresh()
      } 
      // ═══════════════════════════════════════════════════════════
      // 2. حالة الـ SPLIT PAYMENT الجديدة (فيه فلوس لسه متبقية قبل ما يدخل)
      // ═══════════════════════════════════════════════════════════
      else if (result.error === "SPLIT_PRE_VISIT_PAYMENT_REQUIRED" && result.splitPaymentData) {
        setExistingInvoice({
          invoiceId: result.splitPaymentData.invoiceId,
          totalAmount: result.splitPaymentData.invoiceTotal,
          totalPaid: result.splitPaymentData.totalPaid,
          remaining: result.splitPaymentData.remaining,
          status: result.splitPaymentData.totalPaid > 0 ? "PARTIALLY_PAID" : "UNPAID",
        })
        setPaymentPolicy("SPLIT_PAYMENT")
        setShowPaymentDialog(true)
      } 
      // ═══════════════════════════════════════════════════════════
      // 3. حالة الـ PAY BEFORE VISIT العادية (لم نلمسها)
      // ═══════════════════════════════════════════════════════════
      else if (result.error === "PAYMENT_REQUIRED") {
        setPaymentPolicy("PAY_BEFORE_VISIT")
        setExistingInvoice(null)
        setShowPaymentDialog(true)
      } 
      // 4. أي خطأ آخر
      else {
        toast.error(result.error || "Check-in failed")
      }
    })
  }

  function handlePaymentComplete(success: boolean) {
    setShowPaymentDialog(false)

    if (success) {
      startTransition(async () => {
        // بعد الدفع، نحاول نعمل Check-in تاني
        // الـ Backend هيلاقي المبلغ وصل كامل (أو المتبقي اتصفّر) وهيخلّي المريض يدخل
        const result = await completePreVisitCheckIn({
          appointmentId,
          isEmergency,
        })

        if (result.success) {
          toast.success("Payment recorded & patient checked in")
          router.push("/waiting-room")
          router.refresh()
        } else if (result.paymentRequired && result.paymentStatus) {
          // لو كان دفع جزئي في PAY_BEFORE_VISIT وعايز يكمل
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