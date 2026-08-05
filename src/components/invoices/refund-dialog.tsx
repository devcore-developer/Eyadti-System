"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RotateCcw, AlertTriangle } from "lucide-react"
import { processRefund } from "@/lib/actions/invoices"
import { showSuccess, showError } from "@/components/shared/feedback-toast"

interface RefundDialogProps {
  invoiceId: string
  maxRefundAmount: number
  patientName: string
}

export function RefundDialog({ invoiceId, maxRefundAmount, patientName }: RefundDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(maxRefundAmount.toString())
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const refundAmount = parseFloat(amount)
    if (isNaN(refundAmount) || refundAmount <= 0) {
      showError("Invalid Amount", "Please enter a valid refund amount.")
      return
    }
    if (refundAmount > maxRefundAmount) {
      showError("Exceeds Limit", `Maximum refundable amount is ${maxRefundAmount.toLocaleString()}`)
      return
    }
    if (!reason.trim()) {
      showError("Reason Required", "Please provide a reason for the refund.")
      return
    }

    startTransition(async () => {
      const result = await processRefund(invoiceId, refundAmount, reason.trim())
      if (result.success) {
        showSuccess("Refund Processed", `Refund of ${refundAmount.toLocaleString()} has been recorded.`)
        setOpen(false)
        router.refresh()
      } else {
        showError("Refund Failed", result.error || "Could not process refund.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full rounded-xl text-xs h-20 flex flex-col gap-1 border-dashed hover:bg-red-50 hover:border-red-200 hover:text-red-600">
          <RotateCcw className="h-4 w-4" /> Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Process Refund
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">Warning: This action cannot be undone.</p>
          <p className="text-xs mt-1">A refund transaction will be created and the invoice status will be updated.</p>
        </div>

        <div className="text-sm text-muted-foreground">
          Patient: <span className="font-medium text-foreground">{patientName}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Refund Amount</Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxRefundAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Maximum: {maxRefundAmount.toLocaleString()}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason for Refund *</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Patient requested cancellation, duplicate payment, etc."
              rows={3}
              required
            />
          </div>

          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? "Processing..." : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}