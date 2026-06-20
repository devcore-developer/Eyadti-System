"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard } from "lucide-react"
import { recordPayment } from "@/lib/actions/admin"

export function RecordPaymentDialog({ invoiceId, remainingAmount }: { invoiceId: string, remainingAmount: number }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(remainingAmount.toString())
  const [method, setMethod] = useState("CASH")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await recordPayment(invoiceId, parseFloat(amount), method)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        alert(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl text-xs h-20 flex flex-col gap-1 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-md">
          <CreditCard className="h-4 w-4" /> Record Pay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (EGP)</label>
            <Input 
              type="number" 
              step="0.01"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              required 
            />
            <p className="text-xs text-muted-foreground">Remaining balance: {remainingAmount.toLocaleString()} EGP</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={method} onValueChange={(val) => setMethod(val || "CASH")}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}