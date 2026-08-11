"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createInvoice } from "@/actions/invoices"
import { createVisitInvoice } from "@/actions/visit-billing"
import type { ActionResult } from "@/types"
import { InvoiceItems } from "./invoice-items"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormSection } from "@/components/ui/form-section"
import { toast } from "sonner"
import { CreditCard } from "lucide-react"

type PatientOption = { id: string; fullName: string }

type Props = {
  patients: PatientOption[]
  preselectedPatientId?: string
  visitId?: string
  doctorId?: string
  appointmentId?: string
}

export function InvoiceForm({ patients, preselectedPatientId, visitId, doctorId, appointmentId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const isFromWaitingRoom = !!visitId

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      setFieldErrors(result.fieldErrors || {})
      toast.error(result.error || "Something went wrong")
    } else {
      toast.success(isFromWaitingRoom ? "Visit completed & payment recorded" : "Invoice created successfully")
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
      let result: ActionResult

      if (isFromWaitingRoom && visitId) {
        // ═══ Waiting Room Flow: use createVisitInvoice ═══
        // This delegates to completePostVisitPayment which:
        // - Blocks PAY_BEFORE_VISIT clinics
        // - Adds to existing invoice for SPLIT_PAYMENT
        // - Creates new invoice for PAY_AFTER_VISIT
        // - Completes the visit and appointment
        formData.set("visitId", visitId)
        formData.set("patientId", preselectedPatientId || formData.get("patientId") as string)
        formData.set("doctorId", doctorId || "")
        formData.set("appointmentId", appointmentId || "")

        // Set defaults if not provided
        if (!formData.get("totalAmount")) {
          const totalInput = (document.getElementById("totalAmount") as HTMLInputElement)?.value
          if (totalInput) formData.set("totalAmount", totalInput)
        }
        if (!formData.get("paidAmount")) {
          const paidInput = (document.getElementById("paidAmount") as HTMLInputElement)?.value
          if (paidInput) formData.set("paidAmount", paidInput)
        }
        if (!formData.get("paymentMethod")) {
          formData.set("paymentMethod", "CASH")
        }

        result = await createVisitInvoice(formData)
      } else {
        // ═══ Standalone Invoice Flow ═══
        result = await createInvoice(formData)
      }

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

      {/* ═══ Waiting Room Banner ═══ */}
      {isFromWaitingRoom && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
          <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-orange-800 dark:text-orange-200">
              Completing Visit Billing
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
              Recording payment will close the visit and mark the appointment as completed.
              The payment will be associated with the correct appointment.
            </p>
          </div>
        </div>
      )}

      <FormSection title="Invoice Details" description={isFromWaitingRoom ? "Record payment amount for this visit." : "Select the patient and add line items."}>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="patientId">Patient <span className="text-destructive">*</span></Label>
          <select
            id="patientId"
            name="patientId"
            defaultValue={preselectedPatientId || ""}
            required
            disabled={isFromWaitingRoom && !!preselectedPatientId}
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

        {/* ═══ Waiting Room: Amount + Payment Fields ═══ */}
        {isFromWaitingRoom ? (
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount <span className="text-destructive">*</span></Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Now <span className="text-destructive">*</span></Label>
              <Input
                id="paidAmount"
                name="paidAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Method</Label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                defaultValue="CASH"
                className={premiumSelectClasses}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="INSURANCE">Insurance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="sm:col-span-3 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue="Medical Consultation / Procedure"
                placeholder="Consultation / Procedure"
              />
            </div>
          </div>
        ) : (
          /* ═══ Standalone Invoice: Line Items ═══ */
          <div className="md:col-span-2 rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-6 space-y-4">
            <h3 className="text-card-title text-foreground">Items</h3>
            <InvoiceItems />
            {fieldError("items") && <p className="text-xs font-medium text-destructive mt-2">{fieldError("items")}</p>}
          </div>
        )}
      </FormSection>

      <div className="sticky-form-footer bg-white/80 dark:bg-[#17212F]/80 border-t border-border p-4 -mx-4 sm:-mx-6 sm:px-6 -mb-4 sm:-mb-6 md:static md:bg-transparent md:border-0 md:p-0 flex items-center gap-3 rounded-b-[24px] md:rounded-none">
        <Button
          type="submit"
          disabled={isPending}
          isLoading={isPending}
          className="flex-1 md:flex-none shadow-[0_4px_12px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
        >
          {isFromWaitingRoom ? "Record Payment & Complete" : "Create Invoice"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1 md:flex-none rounded-xl border-border bg-white dark:bg-[#223247]"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}