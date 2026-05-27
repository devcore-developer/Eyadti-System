// src/components/invoices/update-invoice-status.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateInvoiceStatus } from "@/actions/invoices"
import { InvoiceStatus } from "@prisma/client"

type Props = {
  invoiceId: string
  currentStatus: InvoiceStatus
}

export function UpdateInvoiceStatus({ invoiceId, currentStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<InvoiceStatus>(currentStatus)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = new FormData()
    formData.append("status", status)

    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, formData)
      if (!result.success) {
        setError(result.error ?? null)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
        disabled={isPending}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value={InvoiceStatus.UNPAID}>Unpaid</option>
        <option value={InvoiceStatus.PARTIAL}>Partially Paid</option>
        <option value={InvoiceStatus.PAID}>Paid</option>
      </select>
      <button
        type="submit"
        disabled={isPending || status === currentStatus}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Updating..." : "Update"}
      </button>
    </form>
  )
}