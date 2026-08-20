"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { completePostVisitPayment, addPaymentToExistingInvoice } from "@/lib/actions/payment-workflow"
import { updateVisitStatus } from "@/actions/unified-appointment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaymentMethod } from "@prisma/client"
import { CreditCard, X, FileText, AlertTriangle, CircleDollarSign, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ExistingInvoice = {
  invoiceId: string
  totalAmount: number
  totalPaid: number
  remaining: number
  status: string
}

type Props = {
  visitId: string
  patientId: string
  doctorId: string
  patientName: string
  appointmentId?: string | null
  clinicId: string                          // ← NEW
  existingInvoice?: ExistingInvoice         // ← NEW: for SPLIT_PAYMENT
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function QuickBillingDialog({
  visitId,
  patientId,
  doctorId,
  patientName,
  appointmentId,
  clinicId,
  existingInvoice,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open! : internalOpen
  const handleDialogChange = (value: boolean) => {
    if (onOpenChange) onOpenChange(value)
    else setInternalOpen(value)
  }

  const [amount, setAmount] = useState("")
  const [paidAmount, setPaidAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH)
  const [description, setDescription] = useState("Medical Consultation / Procedure")

  const isSplitMode = !!existingInvoice

  const totalNum = parseFloat(amount) || 0
  const paidNum = parseFloat(paidAmount) || 0
  const remaining = Math.max(0, totalNum - paidNum)

  // ═══ Validation ═══
  const isValid = isSplitMode
    ? totalNum > 0 && paidNum >= 0 && paidNum <= remaining
    : totalNum > 0 && paidNum >= 0 && paidNum <= totalNum

  // ═══ Pre-fill when existing invoice ═══
  useEffect(() => {
    if (existingInvoice && dialogOpen) {
      setAmount(existingInvoice.totalAmount.toString())
      setPaidAmount(existingInvoice.remaining.toString())
    }
  }, [existingInvoice, dialogOpen])

  function resetForm() {
    setAmount("")
    setPaidAmount("")
    setDescription("Medical Consultation / Procedure")
    setMethod(PaymentMethod.CASH)
  }

  useEffect(() => {
    if (!dialogOpen) resetForm()
  }, [dialogOpen])

  function handleCancel() {
    handleDialogChange(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValid) return

    startTransition(async () => {
      const result = await completePostVisitPayment({
        appointmentId: appointmentId || null,
        visitId,
        patientId,
        totalAmount: totalNum,
        paidAmount: paidNum,
        paymentMethod: method,
        description: description || "Medical Consultation / Procedure",
        clinicId,                           // ← FIX: was ""
        doctorId,
      })

      if (result.success) {
        toast.success(
          paidNum >= totalNum
            ? "Payment complete — visit closed"
            : paidNum > 0
              ? "Partial payment recorded — visit completed"
              : "Visit completed (invoice pending)"
        )
        handleDialogChange(false)
        resetForm()
        router.refresh()
      } else {
        toast.error(result.error || "Billing failed")
      }
    })
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-[#0f1a2e] shadow-xl rounded-2xl max-h-[90vh] flex flex-col">

        {/* ━━━ Header ━━━ */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-start gap-2.5">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
              isSplitMode ? "bg-amber-100 dark:bg-amber-950/50" : "bg-orange-100 dark:bg-orange-950/50"
            )}>
              <CreditCard className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                Complete Visit & Bill
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Patient: <span className="font-semibold text-slate-700 dark:text-slate-300">{patientName}</span>
                {isSplitMode && " — remaining balance to collect"}
              </DialogDescription>
            </div>
          </div>
          <button type="button" onClick={handleCancel} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors -mt-1 -mr-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ━━━ Existing Invoice Info (SPLIT mode) ━━━ */}
        {isSplitMode && existingInvoice && (
          <div className="mx-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">Pre-Visit Invoice</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                existingInvoice.status === "UNPAID" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                existingInvoice.status === "PARTIALLY_PAID" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                existingInvoice.status === "PAID" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              )}>
                {existingInvoice.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Total</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{existingInvoice.totalAmount.toFixed(0)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Paid</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{existingInvoice.totalPaid.toFixed(0)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Was Due</p>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{existingInvoice.remaining.toFixed(0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ Form ━━━ */}
        <form onSubmit={handleSubmit} className="px-5 pb-4 space-y-3 flex-1 overflow-y-auto min-h-0">

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Description
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Consultation / Procedure"
              className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[13px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {isSplitMode ? "Final Total *" : "Total Amount *"}
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">EGP</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[13px] pl-11 pr-2.5 font-semibold tabular-nums"
                />
              </div>
              {isSplitMode && (
                <p className="text-[10px] text-slate-400 mt-0.5">Include any additional services</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {isSplitMode ? "Pay Now *" : "Paid Now"}
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">EGP</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={isSplitMode ? remaining : undefined}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className={cn(
                    "h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[13px] pl-11 pr-2.5 font-semibold tabular-nums",
                    paidNum > remaining && isSplitMode && "border-red-300 dark:border-red-700"
                  )}
                />
              </div>
            </div>
          </div>

          {/* ━── Remaining warning ━── */}
          {totalNum > 0 && paidNum > 0 && paidNum < totalNum && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 px-3 py-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Remaining after payment: <span className="font-bold">{remaining.toFixed(2)}</span> EGP
              </p>
            </div>
          )}

          {/* ━── Overpaid warning ━── */}
          {paidNum > totalNum && totalNum > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/50 px-3 py-1.5">
              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
              <p className="text-[11px] text-red-700 dark:text-red-300">
                Exceeds total by {(paidNum - totalNum).toFixed(2)} EGP
              </p>
            </div>
          )}

          {/* ━━━ Payment Method ━━━ */}
          <div className="w-full">
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[12px] px-3">
                <CreditCard className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ━━━ Buttons ━━━ */}
          <div className="flex items-center gap-2.5 pt-0.5 shrink-0 border-t border-slate-100 dark:border-slate-700/50 mt-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 h-10 rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !isValid}
              className={cn(
                "flex-1 h-10 rounded-xl text-[13px] font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
                isValid
                  ? "bg-orange-600 text-white hover:bg-orange-700 shadow-sm active:scale-[0.98]"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              )}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  {paidNum === 0 ? "Complete Visit (Unpaid)" : paidNum >= totalNum ? "Complete & Record Payment" : "Record Partial Payment"}
                </span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}