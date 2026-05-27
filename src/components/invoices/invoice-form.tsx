// src/components/invoices/invoice-form.tsx
"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createInvoice } from "@/actions/invoices"
import type { ActionResult } from "@/types"
import { InvoiceItems } from "./invoice-items"

type PatientOption = { id: string; fullName: string }

type Props = {
  patients: PatientOption[]
}

export function InvoiceForm({ patients }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      setFieldErrors(result.fieldErrors || {})
    } else {
      router.push("/invoices")
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createInvoice(formData)
      handleResult(result)
    })
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name]?.[0]
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Patient Select */}
      <div>
        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
          Patient <span className="text-red-500">*</span>
        </label>
        <select
          id="patientId"
          name="patientId"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select Patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
        {fieldError("patientId") && <p className="mt-1 text-xs text-red-600">{fieldError("patientId")}</p>}
      </div>

      {/* Items Dynamic Array */}
      <div className="rounded-md border border-gray-200 p-4">
        <InvoiceItems />
        {fieldError("items") && <p className="mt-2 text-xs text-red-600">{fieldError("items")}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Creating Invoice..." : "Create Invoice"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}