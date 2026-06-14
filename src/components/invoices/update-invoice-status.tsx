// src/components/invoices/update-invoice-status.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateInvoiceStatus } from "@/actions/invoices"
import { InvoiceStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showError, showSuccess } from "@/components/shared/feedback-toast"

type Props = {
  invoiceId: string
  currentStatus: InvoiceStatus
}

export function UpdateInvoiceStatus({ invoiceId, currentStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<InvoiceStatus>(currentStatus)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    startTransition(async () => {
      const formData = new FormData()
      formData.append("status", status)

      const result = await updateInvoiceStatus(invoiceId, formData)
      if (!result.success) {
        showError("Update Failed", result.error || "Could not update invoice status.")
      } else {
        showSuccess("Status Updated", "Invoice status changed successfully.")
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <Select value={status} onValueChange={(val) => setStatus(val as InvoiceStatus)} disabled={isPending}>
        <SelectTrigger className="w-[180px] rounded-xl h-10">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value={InvoiceStatus.UNPAID} className="rounded-lg">Unpaid</SelectItem>
          <SelectItem value={InvoiceStatus.PARTIAL} className="rounded-lg">Partially Paid</SelectItem>
          <SelectItem value={InvoiceStatus.PAID} className="rounded-lg">Paid</SelectItem>
        </SelectContent>
      </Select>

      <Button 
        type="submit" 
        disabled={isPending || status === currentStatus} 
        isLoading={isPending}
        className="rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_4px_12px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
      >
        Update
      </Button>
    </form>
  )
}