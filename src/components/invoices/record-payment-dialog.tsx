"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Printer, CheckCircle2 } from "lucide-react"
import { addPaymentToExistingInvoice } from "@/lib/actions/payment-workflow" // تم تصحيح المسار
import { PrintButton } from "./print-button" // سنستخدمه هنا

export function RecordPaymentDialog({ invoiceId, remainingAmount, invoiceData }: { 
  invoiceId: string, 
  remainingAmount: number,
  invoiceData?: any // بيانات الفاتورة للطباعة
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(remainingAmount.toString())
  const [method, setMethod] = useState("CASH")
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      // استخدام الـ Action الصحيح من Payment Workflow
      const result = await addPaymentToExistingInvoice({
        invoiceId,
        amount: parseFloat(amount),
        paymentMethod: method as any,
      })
      
      if (result.success) {
        setIsSuccess(true) // إظهار حالة النجاح بدل إغلاق الـ Dialog فوراً
        router.refresh()
      } else {
        alert(result.error)
      }
    })
  }

  const handleClose = () => {
    setOpen(false)
    if (isSuccess) {
      setTimeout(() => setIsSuccess(false), 200) // Reset state after close
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl text-xs h-20 flex flex-col gap-1 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-md">
          <CreditCard className="h-4 w-4" /> Record Pay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => isSuccess && e.preventDefault()}>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
            <div className="p-4 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Payment Recorded!</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Amount: {parseFloat(amount).toFixed(2)} EGP</p>
            
            <div className="flex items-center gap-3 w-full px-4">
              <Button 
                onClick={handleClose} 
                variant="outline" 
                className="flex-1 rounded-xl"
              >
                Done
              </Button>
              
              {/* زر الطباعة الثانوي كما طلبت */}
              {invoiceData && (
                <PrintButton 
                  invoiceId={invoiceId}
                  invoiceNumber={invoiceData.id?.slice(-5).toUpperCase()}
                  clinicName={invoiceData.clinic?.name}
                  clinicAddress={invoiceData.clinic?.address}
                  clinicPhone={invoiceData.clinic?.phone}
                  patientName={invoiceData.patient?.fullName}
                  patientPhone={invoiceData.patient?.phone}
                  items={invoiceData.items || []}
                  totalAmount={Number(invoiceData.amount)}
                  paidAmount={Number(invoiceData.amount)} // تقريباً لأنه دفع بالكامل أو جزء
                  remainingAmount={0}
                  status="PAID"
                />
              )}
            </div>
          </div>
        ) : (
          <>
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
                <p className="text-xs text-muted-foreground">Remaining balance: {remainingAmount.toFixed(2)} EGP</p>
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
                    <SelectItem value="INSURANCE">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Processing..." : "Confirm Payment"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}