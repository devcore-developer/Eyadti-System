// components/invoices/invoice-form.tsx
"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createInvoice } from "@/actions/invoices"
import type { ActionResult } from "@/types"
import { InvoiceItems } from "./invoice-items"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FormSection } from "@/components/ui/form-section"
import { toast } from "sonner"

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
      toast.error(result.error || "Something went wrong")
    } else {
      toast.success("Invoice created successfully")
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

  const premiumSelectClasses = "flex h-10 w-full rounded-xl border border-input bg-white/90 dark:bg-[#223247]/50 backdrop-blur-sm px-4 py-2 text-sm shadow-sm ring-offset-background transition-all focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_4px_rgba(107,156,255,0.12)] hover:border-muted-foreground/30 appearance-none cursor-pointer disabled:opacity-50"

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8 pb-28 md:pb-0 animate-fade-in-up">
      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-start gap-3 shadow-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      <FormSection title="Invoice Details" description="Select the patient and add line items.">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="patientId">Patient <span className="text-destructive">*</span></Label>
          <select
            id="patientId"
            name="patientId"
            required
            className={premiumSelectClasses}
            aria-invalid={!!fieldError("patientId")}
          >
            <option value="" disabled>Select Patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
          {fieldError("patientId") && <p className="text-xs font-medium text-destructive mt-1">{fieldError("patientId")}</p>}
        </div>

        <div className="md:col-span-2 rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-6 space-y-4">
          <h3 className="text-card-title text-foreground">Items</h3>
          <InvoiceItems />
          {fieldError("items") && <p className="text-xs font-medium text-destructive mt-2">{fieldError("items")}</p>}
        </div>
      </FormSection>

      <div className="sticky-form-footer bg-white/80 dark:bg-[#17212F]/80 border-t border-border p-4 -mx-4 sm:-mx-6 sm:px-6 -mb-4 sm:-mb-6 md:static md:bg-transparent md:border-0 md:p-0 flex items-center gap-3 rounded-b-[24px] md:rounded-none">
        <Button type="submit" disabled={isPending} isLoading={isPending} className="flex-1 md:flex-none shadow-[0_4px_12px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
          Create Invoice
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 md:flex-none rounded-xl border-border bg-white dark:bg-[#223247]">Cancel</Button>
      </div>
    </form>
  )
}