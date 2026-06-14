"use client"

import { useState, useTransition } from "react"
import { createVisitInvoice } from "@/actions/visit-billing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Receipt } from "lucide-react"

type Props = {
  visitId: string
  patientId: string
  doctorId: string
  patientName: string
}

export function QuickBillingDialog({ visitId, patientId, doctorId, patientName }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [total, setTotal] = useState(0)
  const [paid, setPaid] = useState(0)

  const balance = total - paid

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await createVisitInvoice(formData)
      if (result.success) {
        toast.success(`Invoice created for ${patientName}. Visit Completed!`)
        setIsOpen(false)
      } else {
        toast.error(result.error || "Failed to process billing")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
          <Receipt className="h-3 w-3" /> Collect Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-orange-500" /> Quick Billing - {patientName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <input type="hidden" name="visitId" value={visitId} />
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="doctorId" value={doctorId} />

          <div>
            <Label>Description</Label>
            <Input name="description" defaultValue="Medical Services" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Total Amount (EGP) *</Label>
              <Input 
                name="totalAmount" 
                type="number" 
                min="0" 
                step="0.01"
                required 
                onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Paid Now (EGP)</Label>
              <Input 
                name="paidAmount" 
                type="number" 
                min="0" 
                step="0.01"
                defaultValue={0}
                onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {balance > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              Pending Balance: <span className="font-bold">{balance.toFixed(2)} EGP</span>
            </div>
          )}

          <div>
            <Label>Payment Method</Label>
            <Select name="paymentMethod" defaultValue="CASH">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isPending} className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
            {isPending ? "Processing..." : "Confirm & Complete Visit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}