"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createPreVisitPayment, addPaymentToExistingInvoice } from "@/lib/actions/payment-workflow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaymentMethod } from "@prisma/client"
import { Receipt, User, CircleDollarSign, CreditCard, X, AlertTriangle, Clock, FileText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ═══ Types for existing invoice ═══
type ExistingInvoice = {
  invoiceId: string
  totalAmount: number
  totalPaid: number
  remaining: number
  status: string
}

interface PreVisitPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentComplete?: (success: boolean) => void
  appointmentId: string
  patientId: string
  patientName: string
  clinicId: string
  branchId?: string
  paymentPolicy: string
  allowZeroPayment?: boolean
  // ═══ NEW: Existing invoice mode (for check-in with unpaid invoice) ═══
  existingInvoice?: ExistingInvoice | null
}

export function PreVisitPaymentDialog({
  open,
  onOpenChange,
  onPaymentComplete,
  appointmentId,
  patientId,
  patientName,
  clinicId,
  branchId,
  paymentPolicy,
  allowZeroPayment = false,
  existingInvoice = null,
}: PreVisitPaymentDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("Examination fee")
  const [amount, setAmount] = useState("")
  const [paidAmount, setPaidAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH)

  const isExistingMode = !!existingInvoice
  const isSplit = paymentPolicy === "SPLIT_PAYMENT"

  const totalNum = isExistingMode ? existingInvoice.totalAmount : (parseFloat(amount) || 0)
  const paidNum = isExistingMode ? existingInvoice.totalPaid : (parseFloat(paidAmount) || 0)
  const payNowNum = isExistingMode ? (parseFloat(paidAmount) || 0) : (parseFloat(paidAmount) || 0)
  const remaining = Math.max(0, totalNum - paidNum)

  // ═══ Validation ═══
  const isValid = useMemo(() => {
    if (isExistingMode) {
      // In existing mode: just need payNow > 0
      return payNowNum > 0 && payNowNum <= remaining
    }
    // In create mode: need total > 0, paid >= 0, paid <= total
    return totalNum > 0 && payNowNum >= 0 && payNowNum <= totalNum
  }, [isExistingMode, payNowNum, remaining, totalNum])

  const submitButtonText = useMemo(() => {
    if (loading) return "Processing"
    if (isExistingMode) return `Pay ${payNowNum.toFixed(2)} EGP`
    if (payNowNum === 0 && allowZeroPayment) return "Schedule as Unpaid"
    if (payNowNum === 0) return "Record as Unpaid"
    return "Record Payment"
  }, [loading, isExistingMode, payNowNum, allowZeroPayment])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setLoading(true)

    try {
      if (isExistingMode && existingInvoice) {
        // ═══ MODE: Add payment to existing invoice ═══
        const result = await addPaymentToExistingInvoice({
          invoiceId: existingInvoice.invoiceId,
          amount: payNowNum,
          paymentMethod: method,
          clinicId,
          branchId: branchId || null,
          notes: "Payment during check-in",
        })

        if (result.success) {
          toast.success("Payment recorded successfully")
          onOpenChange(false)
          onPaymentComplete?.(true)
          router.refresh()
        } else {
          toast.error(result.error || "Payment failed")
          onPaymentComplete?.(false)
        }
      } else {
        // ═══ MODE: Create new invoice ═══
        const result = await createPreVisitPayment({
          appointmentId,
          patientId,
          amount: totalNum,
          paidAmount: payNowNum,
          paymentMethod: method,
          description: description || "Examination fee",
          clinicId,
          branchId: branchId || null,
        })

        if (result.success) {
          toast.success(
            payNowNum === 0
              ? "Appointment scheduled — payment pending"
              : payNowNum >= totalNum
                ? "Payment recorded successfully"
                : "Partial payment recorded"
          )
          onOpenChange(false)
          onPaymentComplete?.(true)
          router.refresh()
        } else {
          toast.error(result.error || "Payment failed")
          onPaymentComplete?.(false)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    onOpenChange(false)
    onPaymentComplete?.(false)
  }

  function resetForm() {
    setDescription("Examination fee")
    setAmount("")
    setPaidAmount("")
    setMethod(PaymentMethod.CASH)
  }

  useEffect(() => {
    if (!open) resetForm()
  }, [open])

  // Pre-fill pay now with remaining in existing mode
  useEffect(() => {
    if (isExistingMode && existingInvoice && open) {
      setPaidAmount(existingInvoice.remaining.toString())
    }
  }, [isExistingMode, existingInvoice, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-[#0f1a2e] shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-2xl max-h-[90vh] flex flex-col">
        
        {/* ━━━ Header ━━━ */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-start gap-2.5">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
              isExistingMode ? "bg-amber-100 dark:bg-amber-950/50" : "bg-slate-100 dark:bg-slate-800"
            )}>
              {isExistingMode 
                ? <FileText className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                : <Receipt className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
              }
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                {isSplit && isExistingMode
                  ? "Remaining Consultation Fee"
                  : isSplit
                    ? "Consultation / Visit Fee"
                    : isExistingMode
                      ? "Complete Outstanding Payment"
                      : "Payment Details"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isSplit && isExistingMode
                  ? "Collect the remaining consultation amount before the patient enters."
                  : isSplit
                    ? "Initial consultation payment. Services will be billed after the visit."
                    : isExistingMode
                      ? "This appointment has an unpaid invoice. Complete the payment to proceed."
                      : allowZeroPayment
                        ? "Enter payment details or leave as 0 to schedule as unpaid."
                        : "Full payment is required before the visit can proceed."}
              </DialogDescription>
            </div>
          </div>
          <button type="button" onClick={handleCancel} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors -mt-1 -mr-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ━━━ Form ━━━ */}
        <form id="pre-payment-form" onSubmit={handleSubmit} className="px-5 pb-4 space-y-3 flex-1 overflow-y-auto min-h-0">
          
          {/* ━━━ Patient Info ━━━ */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 px-3.5 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 shrink-0">
              <User className="h-3 w-3 text-slate-500 dark:text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{patientName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isSplit && isExistingMode
                  ? "Remaining consultation fee"
                  : isSplit
                    ? "Initial consultation payment"
                    : isExistingMode
                      ? "Outstanding payment required"
                      : "Payment before visit"}
              </p>
            </div>
          </div>

          {/* ━━━ EXISTING INVOICE INFO (only in existing mode) ━━━ */}
          {isExistingMode && existingInvoice && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700 dark:text-amber-300 font-medium">Invoice Summary</span>
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
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Remaining</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{existingInvoice.remaining.toFixed(0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ━━━ Description (only in create mode) ━━━ */}
          {!isExistingMode && (
            <div className="space-y-1">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Examination fee"
                className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[13px]"
              />
            </div>
          )}

          {/* ━━━ Amount Fields ━━━ */}
          {isExistingMode ? (
            // Existing mode: Just "Amount to pay now"
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Amount to Pay Now *
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">EGP</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remaining}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={remaining.toFixed(2)}
                  required
                  className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[13px] pl-11 pr-2.5 font-semibold tabular-nums"
                />
              </div>
            </div>
          ) : (
            // Create mode: Total + Paid
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Amount *
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
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Paid Amount {allowZeroPayment && <span className="text-slate-400 normal-case">(0 = Unpaid)</span>}
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">EGP</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={allowZeroPayment ? "0 for unpaid" : "0.00"}
                    required
                    className={cn(
                      "h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[13px] pl-11 pr-2.5 font-semibold tabular-nums",
                      payNowNum > totalNum && totalNum > 0 && "border-red-300 dark:border-red-700"
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ━── Validation: Overpaid (create mode only) ━── */}
          {!isExistingMode && payNowNum > totalNum && totalNum > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/50 px-3 py-1.5">
              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
              <p className="text-[11px] text-red-700 dark:text-red-300">
                Exceeds total by {(payNowNum - totalNum).toFixed(2)} EGP
              </p>
            </div>
          )}

          {/* ━── Info: Zero payment (create mode only) ━── */}
          {!isExistingMode && payNowNum === 0 && totalNum > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 px-3 py-1.5">
              <Clock className="h-3 w-3 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Appointment will be scheduled as unpaid. Remaining: {totalNum.toFixed(2)} EGP
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
              disabled={loading}
              className="flex-1 h-10 rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="pre-payment-form"
              disabled={loading || !isValid}
              className={cn(
                "flex-1 h-10 rounded-xl text-[13px] font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
                isValid
                  ? isExistingMode
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-[0.98]"
                    : payNowNum === 0
                      ? "bg-amber-600 text-white hover:bg-amber-700 shadow-sm active:scale-[0.98]"
                      : "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 shadow-sm active:scale-[0.98]"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  {payNowNum === 0 && !isExistingMode ? <Clock className="h-3.5 w-3.5" /> : <CircleDollarSign className="h-3.5 w-3.5" />}
                  {submitButtonText}
                </span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}