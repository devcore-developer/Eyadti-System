// src/components/invoices/invoice-filters.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { InvoiceStatus } from "@prisma/client"

export function InvoiceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStatus = searchParams.get("status") || ""

  function applyFilters(newFilters: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete("page")
    startTransition(() => router.push(`/invoices?${params.toString()}`))
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500">Status</label>
        <select
          id="filter-status"
          defaultValue={currentStatus}
          onChange={(e) => applyFilters({ status: e.target.value })}
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value={InvoiceStatus.PAID}>Paid</option>
          <option value={InvoiceStatus.UNPAID}>Unpaid</option>
          <option value={InvoiceStatus.PARTIAL}>Partially Paid</option>
        </select>
      </div>

      {currentStatus && (
        <button
          onClick={() => startTransition(() => router.push("/invoices"))}
          disabled={isPending}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Clear
        </button>
      )}
    </div>
  )
}