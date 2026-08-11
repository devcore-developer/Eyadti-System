"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { RotateCcw, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react"
import { processRefund } from "@/lib/actions/invoices"
import { showError, showSuccess } from "@/components/shared/feedback-toast"

interface RefundDialogProps {
  invoiceId: string
  maxRefundAmount: number
  patientName: string
  alreadyRefunded?: number
}

export function RefundDialog({ invoiceId, maxRefundAmount, patientName, alreadyRefunded = 0 }: RefundDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const refundAmount = parseFloat(amount) || 0
  const remainingAfterRefund = maxRefundAmount - alreadyRefunded - refundAmount
  const isError = refundAmount > (maxRefundAmount - alreadyRefunded) || refundAmount <= 0

  const resetAndClose = () => {
    setOpen(false)
    setTimeout(() => {
      setAmount("")
      setReason("")
      setIsSuccess(false)
    }, 200)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isError || !reason.trim()) {
      if (!reason.trim()) showError("Reason Required", "Please provide a reason for the refund.")
      else showError("Invalid Amount", "Please enter a valid refund amount.")
      return
    }

    startTransition(async () => {
      const result = await processRefund(invoiceId, refundAmount, reason.trim())
      if (result.success) {
        setIsSuccess(true)
        showSuccess("Refund Processed", `Refund of ${refundAmount.toFixed(2)} has been recorded.`)
        router.refresh()
        setTimeout(resetAndClose, 1500)
      } else {
        showError("Refund Failed", result.error || "Could not process refund.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full rounded-xl text-xs h-20 flex flex-col gap-1 border-dashed hover:bg-red-50/50 hover:border-red-200 hover:text-red-600 transition-colors">
          <RotateCcw className="h-4 w-4" /> Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="p-4 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Refund Successful</h3>
            <p className="text-sm text-muted-foreground mt-1">The transaction has been recorded.</p>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Process Refund
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                This action will record a financial refund against this invoice. Please verify the amount carefully.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pt-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm border">
                <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{patientName}</span></div>
                <Separator className="my-2"/>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-medium">{maxRefundAmount.toFixed(2)}</span></div>
                {alreadyRefunded > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Already Refunded</span><span className="font-medium text-red-500">-{alreadyRefunded.toFixed(2)}</span></div>}
                <div className="flex justify-between font-semibold"><span>Available to Refund</span><span>{(maxRefundAmount - alreadyRefunded).toFixed(2)}</span></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Refund Amount</Label>
                <div className="relative">
                  <Input
                    id="refund-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxRefundAmount - alreadyRefunded}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className={`pr-12 text-lg font-semibold ${isError && amount ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">EGP</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund <span className="text-destructive">*</span></Label>
                <Textarea
                  id="refund-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Duplicate payment, service cancelled..."
                  rows={3}
                  required
                  className="resize-none"
                />
              </div>

              {amount && !isError && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-3 text-sm animate-fade-in">
                  <div className="flex justify-between text-blue-800 dark:text-blue-200">
                    <span>Remaining Refundable</span>
                    <span className="font-bold">{remainingAfterRefund.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={resetAndClose} disabled={isPending}>Cancel</Button>
                <Button 
                  type="submit" 
                  disabled={isPending || isError || !reason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Refund"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}