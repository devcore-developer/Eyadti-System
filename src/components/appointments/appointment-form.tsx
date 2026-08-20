"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createAppointment, updateAppointment } from "@/actions/appointments"
import { PreVisitPaymentDialog } from "@/components/appointments/pre-visit-payment-dialog"
import type { ActionResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormGrid, FormFullWidth } from "@/components/ui/form-grid"
import { FormSection } from "@/components/ui/form-section"
import { toast } from "sonner"

type PatientOption = { id: string; fullName: string }
type DoctorOption = { id: string; name: string }

type AppointmentData = {
  id?: string
  patientId: string
  doctorId: string
  dateTime: Date
  notes?: string | null
}

type Props = {
  patients: PatientOption[]
  doctors: DoctorOption[]
  appointment?: AppointmentData
  clinicId?: string
  branchId?: string
}

function toLocalDateString(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function toLocalTimeString(date: Date): string {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function AppointmentForm({ patients, doctors, appointment, clinicId, branchId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // ═══ Payment Dialog State ═══
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<{
  appointmentId: string
  patientId: string
  patientName: string
  policy: string
  allowZeroPayment?: boolean
} | null>(null)

  const isEdit = !!appointment?.id

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      setFieldErrors(result.fieldErrors || {})
      toast.error(result.error || "Something went wrong")
      return
    }

    // ═══ Check if pre-visit payment is required ═══
    if (result.requiresPayment && result.appointmentId) {
      const selectedPatient = patients.find(p => p.id === (appointment?.patientId || ""))
      setPendingPayment({
        appointmentId: result.appointmentId,
        patientId: appointment?.patientId || "",
        patientName: selectedPatient?.fullName || "Patient",
        policy: result.paymentPolicy || "PAY_BEFORE_VISIT",
        allowZeroPayment: result.paymentPolicy === "SPLIT_PAYMENT",
      })
      setShowPaymentDialog(true)
      return
    }

    // No payment required — redirect normally
    toast.success(isEdit ? "Appointment updated successfully" : "Appointment scheduled successfully")
    router.push("/appointments")
    router.refresh()
  }

  function handlePaymentComplete(success: boolean) {
    setShowPaymentDialog(false)
    setPendingPayment(null)
    if (success) {
      toast.success("Payment recorded — appointment confirmed")
      router.push("/appointments")
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      if (isEdit && appointment?.id) {
        const result = await updateAppointment(appointment.id, formData)
        handleResult(result)
      } else {
        const result = await createAppointment(formData)
        handleResult(result)
      }
    })
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name]?.[0]
  }

  const premiumSelectClasses = "flex h-10 w-full rounded-xl border border-input bg-white/90 dark:bg-[#223247]/50 backdrop-blur-sm px-4 py-2 text-sm shadow-sm ring-offset-background transition-all focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_4px_rgba(107,156,255,0.12)] hover:border-muted-foreground/30 appearance-none cursor-pointer disabled:opacity-50"

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8 pb-28 md:pb-0 animate-fade-in-up">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-start gap-3 shadow-sm">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <FormSection title="Appointment Details" description="Select the patient, doctor, and preferred schedule." variant="patient">
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient <span className="text-destructive">*</span></Label>
            <select
              id="patientId"
              name="patientId"
              defaultValue={appointment?.patientId ?? ""}
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

          <div className="space-y-2">
            <Label htmlFor="doctorId">Doctor <span className="text-destructive">*</span></Label>
            <select
              id="doctorId"
              name="doctorId"
              defaultValue={appointment?.doctorId ?? ""}
              required
              className={premiumSelectClasses}
              aria-invalid={!!fieldError("doctorId")}
            >
              <option value="" disabled>Select Doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {fieldError("doctorId") && <p className="text-xs font-medium text-destructive mt-1">{fieldError("doctorId")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={appointment ? toLocalDateString(appointment.dateTime) : ""}
              required
              aria-invalid={!!fieldError("date")}
            />
            {fieldError("date") && <p className="text-xs font-medium text-destructive mt-1">{fieldError("date")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time <span className="text-destructive">*</span></Label>
            <Input
              id="time"
              name="time"
              type="time"
              defaultValue={appointment ? toLocalTimeString(appointment.dateTime) : ""}
              required
              aria-invalid={!!fieldError("time")}
            />
            {fieldError("time") && <p className="text-xs font-medium text-destructive mt-1">{fieldError("time")}</p>}
          </div>

          <FormFullWidth className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={appointment?.notes ?? ""}
              placeholder="Any specific details or symptoms..."
            />
            {fieldError("notes") && <p className="text-xs font-medium text-destructive mt-1">{fieldError("notes")}</p>}
          </FormFullWidth>
        </FormSection>

        <div className="sticky-form-footer bg-white/80 dark:bg-[#17212F]/80 border-t border-border p-4 -mx-4 sm:-mx-6 sm:px-6 -mb-4 sm:-mb-6 md:static md:bg-transparent md:border-0 md:p-0 flex items-center gap-3 rounded-b-[24px] md:rounded-none">
          <Button type="submit" disabled={isPending} isLoading={isPending} className="flex-1 md:flex-none shadow-[0_4px_12px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
            {isEdit ? "Update Appointment" : "Schedule Appointment"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 md:flex-none rounded-xl border-border bg-white dark:bg-[#223247]">Cancel</Button>
        </div>
      </form>

      {/* ═══ Pre-Visit Payment Dialog ═══ */}
      {pendingPayment && (
        <PreVisitPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          appointmentId={pendingPayment.appointmentId}
          patientId={pendingPayment.patientId}
          patientName={pendingPayment.patientName}
          clinicId={clinicId || ""}
          branchId={branchId}
          paymentPolicy={pendingPayment.policy}
        />
      )}
    </>
  )
}