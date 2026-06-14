"use client"

import { useState, useTransition } from "react"
import { createVisitInvoice } from "@/actions/visit-billing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Receipt } from "lucide-react"

type Props = {
  visitId: string
  patientId: string
  doctorId: string
  patientName: string
}

const nativeSelectClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

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
        {/* ✨ زر الدفع يأخذ العرض الكامل على الموبايل */}
        <Button size="sm" className="w-full sm:w-auto gap-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white h-10 sm:h-9">
          <Receipt className="h-4 w-4" /> Collect Payment
        </Button>
      </DialogTrigger>
      {/* ✨ الـ Dialog سيفتح تلقائياً كـ Bottom Sheet على الموبايل بفضل تعديلات المرحلة 3 */}
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

          {/* ✨ عمود واحد على الموبايل، وعمودين على الـ Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {/* ✨ استخدام Native Select لضمان عمله داخل الـ Bottom Sheet على الموبايل */}
            <select name="paymentMethod" defaultValue="CASH" className={nativeSelectClasses}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="INSURANCE">Insurance</option>
            </select>
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-12 text-base bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
            {isPending ? "Processing..." : "Confirm & Complete Visit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}