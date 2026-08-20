"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { completePostVisitPayment } from "@/lib/actions/payment-workflow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaymentMethod } from "@prisma/client"
import { CreditCard } from "lucide-react"
import { toast } from "sonner"

type Props = {
  visitId: string
  patientId: string
  doctorId: string
  patientName: string
  appointmentId?: string | null
  // ═══ Controlled mode for QueueCard integration ═══
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function QuickBillingDialog({ visitId, patientId, doctorId, patientName, appointmentId, open, onOpenChange }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ═══ Controlled vs internal state ═══
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

  function resetForm() {
    setAmount("")
    setPaidAmount("")
    setDescription("Medical Consultation / Procedure")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const totalAmount = parseFloat(amount)
    const totalPaid = parseFloat(paidAmount)

    if (!totalAmount || totalAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (isNaN(totalPaid) || totalPaid < 0) {
      toast.error("Please enter a valid paid amount")
      return
    }
    if (totalPaid > totalAmount) {
      toast.error("Paid amount cannot exceed total amount")
      return
    }

    startTransition(async () => {
      const result = await completePostVisitPayment({
        appointmentId: appointmentId || null,
        visitId,
        patientId,
        totalAmount,
        paidAmount: totalPaid,
        paymentMethod: method,
        description: description || "Medical Consultation / Procedure",
        clinicId: "",
        doctorId,
      })

      if (result.success) {
        toast.success(totalPaid >= totalAmount ? "Payment complete — visit closed" : "Payment recorded")
        handleDialogChange(false)
        resetForm()
        router.refresh()
      } else {
        toast.error(result.error || "Billing failed")
      }
    })
  }

  function handleCancel() {
    handleDialogChange(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="w-full gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white h-10 sm:h-9 hover:from-orange-600 hover:to-amber-600"
          >
            <CreditCard className="h-4 w-4" /> Complete & Bill
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Complete Visit & Bill</DialogTitle>
          <DialogDescription>
            Patient: <span className="font-semibold">{patientName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qb-description">Description</Label>
            <Input
              id="qb-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Consultation / Procedure"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qb-amount">Total Amount</Label>
              <Input
                id="qb-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qb-paid">Paid Now</Label>
              <Input
                id="qb-paid"
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {amount && paidAmount && parseFloat(paidAmount) < parseFloat(amount) && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Remaining: <span className="font-bold">{(parseFloat(amount) - parseFloat(paidAmount)).toFixed(2)}</span> EGP
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Invoice will be marked as partially paid</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
              {isPending ? "Processing..." : "Complete & Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}