"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createPatientVisit, completePreVisitCheckIn } from "@/lib/actions/visits"
import { createUnifiedAppointment } from "@/actions/unified-appointment"
import { searchPatients } from "@/lib/actions/patients"
import { PreVisitPaymentDialog } from "@/components/appointments/pre-visit-payment-dialog"
import type { ActionResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Search, UserPlus, X, CreditCard } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { finalizeWaitingRoomEntry } from "@/lib/actions/payment-workflow"
type DoctorOption = { id: string; name: string }
type PatientOption = { id: string; fullName: string; phone: string }

type Props = {
  clinicId: string
  branchId?: string
  doctors: DoctorOption[]
  preselectedPatient?: PatientOption | null
  paymentWorkflow?: string
}

export function PatientVisitForm({ clinicId, branchId, doctors, preselectedPatient, paymentWorkflow }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Patient State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(preselectedPatient || null)
  const [isNewPatient, setIsNewPatient] = useState(false)

  // Visit options
  const [addToWaitingRoom, setAddToWaitingRoom] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false)

  // ═══ Payment Dialog State ═══
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<{
    appointmentId: string
    patientId: string
    patientName: string
    policy: string
    isEmergency: boolean
    allowZeroPayment?: boolean
  } | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (isEmergency) setAddToWaitingRoom(true)
  }, [isEmergency])

  useEffect(() => {
    if (debouncedSearch && !selectedPatient) {
      searchPatients(debouncedSearch).then(results => {
        setSearchResults((results as any)?.data || [])
      }).catch(() => setSearchResults([]))
    } else {
      setSearchResults([])
    }
  }, [debouncedSearch, clinicId, selectedPatient])

  // ═══════════════════════════════════════════════════════════
  // ✅ FIX: Only show payment dialog when payment is REQUIRED
  // ═══════════════════════════════════════════════════════════
  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      toast.error(result.error || "Something went wrong")
      return
    }

    // ═══ Only show payment dialog when requiresPayment is true ═══
    // PAY_AFTER_VISIT → requiresPayment = false → skip dialog → go to waiting room
    // PAY_BEFORE_VISIT → requiresPayment = true → show dialog
    // SPLIT_PAYMENT → requiresPayment = true → show dialog
    if (result.appointmentId && result.requiresPayment) {
      setPendingPayment({
        appointmentId: result.appointmentId,
        patientId: result.patientId || selectedPatient?.id || "",
        patientName: selectedPatient?.fullName || "Patient",
        policy: result.paymentPolicy || paymentWorkflow || "PAY_AFTER_VISIT",
        isEmergency: isEmergency,
        allowZeroPayment: result.paymentPolicy === "SPLIT_PAYMENT",
      })
      setShowPaymentDialog(true)
      return
    }

    // No payment required (PAY_AFTER_VISIT, or emergency) → proceed directly
    toast.success(addToWaitingRoom ? "Patient added to Waiting Room" : "Appointment scheduled successfully")
    router.push(addToWaitingRoom ? "/waiting-room" : "/appointments")
    router.refresh()
  }

  // ═══ Handle payment completion with proper routing ═══
  function handlePaymentComplete(success: boolean) {
    setShowPaymentDialog(false)
    if (success && pendingPayment) {
      if (addToWaitingRoom) {
        startTransition(async () => {
          // ═══ SPLIT_PAYMENT: Use finalizeWaitingRoomEntry ═══
          if (pendingPayment.policy === "SPLIT_PAYMENT") {
            const finalizeResult = await finalizeWaitingRoomEntry({
              appointmentId: pendingPayment.appointmentId,
              isEmergency: pendingPayment.isEmergency,
            })
            if (finalizeResult.success) {
              toast.success("Payment recorded & patient added to queue")
              router.push("/waiting-room")
              router.refresh()
            } else {
              toast.error(finalizeResult.error || "Payment recorded but failed to add to waiting room")
              router.push("/appointments")
              router.refresh()
            }
          } else {
            // ═══ PAY_BEFORE_VISIT: Original logic ═══
            const checkInResult = await completePreVisitCheckIn({
              appointmentId: pendingPayment.appointmentId,
              isEmergency: pendingPayment.isEmergency,
            })
            if (checkInResult.success) {
              toast.success("Payment recorded & patient checked in")
              router.push("/waiting-room")
              router.refresh()
            } else {
              toast.error(checkInResult.error || "Payment recorded but check-in failed")
              router.push("/appointments")
              router.refresh()
            }
          }
        })
      } else {
        toast.success("Appointment scheduled successfully")
        router.push("/appointments")
        router.refresh()
      }
    }
    setPendingPayment(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    if (selectedPatient) {
      formData.set("patientId", selectedPatient.id)
      formData.delete("fullName")
      formData.delete("phone")
      formData.delete("gender")
      formData.delete("dateOfBirth")
      formData.delete("nationalId")
    } else if (!isNewPatient) {
      toast.error("Please select an existing patient or create a new one")
      return
    }

    startTransition(async () => {
      let result: ActionResult

      if (addToWaitingRoom) {
        formData.set("isEmergency", isEmergency ? "true" : "false")
        result = await createPatientVisit(formData)
      } else {
        formData.set("appointmentType", "SCHEDULED")
        formData.set("dateTime", formData.get("visitDate") as string)
        formData.set("isNewPatient", isNewPatient ? "true" : "false")
        result = await createUnifiedAppointment(formData)
      }

      handleResult(result)
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        {/* ━━━ STEP 1: PATIENT INFO ━━━ */}
        <div className="space-y-4 rounded-xl border bg-white dark:bg-[#223247] p-6 shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2"><UserPlus className="h-5 w-5 text-teal-600" /> Patient Information</h3>

          {!selectedPatient && !isNewPatient && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Phone or Name..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedPatient(null) }}
                  className="pl-10"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-white dark:bg-[#223247] shadow-lg">
                  {searchResults.map(p => (
                    <button type="button" key={p.id} onClick={() => { setSelectedPatient(p); setSearchQuery(""); setSearchResults([]) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between">
                      <span className="font-medium">{p.fullName}</span>
                      <span className="text-gray-500 text-sm">{p.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewPatient(true)} className="mt-2">
                + New Patient
              </Button>
            </div>
          )}

          {selectedPatient && (
            <div className="flex items-center justify-between bg-teal-50 dark:bg-teal-950/30 p-3 rounded-lg border border-teal-100 dark:border-teal-800">
              <div>
                <p className="font-semibold text-teal-900 dark:text-teal-100">{selectedPatient.fullName}</p>
                <p className="text-sm text-teal-700 dark:text-teal-300">{selectedPatient.phone}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}><X className="h-4 w-4" /></Button>
            </div>
          )}

          {isNewPatient && !selectedPatient && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
              <Input name="fullName" placeholder="Full Name *" required />
              <Input name="phone" placeholder="Phone Number *" required />
              <Input name="nationalId" placeholder="National ID (Optional)" />
              <select name="gender" required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm dark:bg-[#1a2736]">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              <Input name="dateOfBirth" type="date" required />
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewPatient(false)} className="text-gray-500 sm:col-span-2">Cancel Creation</Button>
            </div>
          )}
        </div>

        {/* ━━━ STEP 2: VISIT INFO ━━━ */}
        {(selectedPatient || isNewPatient) && (
          <>
            <div className="space-y-4 rounded-xl border bg-white dark:bg-[#223247] p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Visit Details</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Attending Doctor *</Label>
                  <select name="doctorId" required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm dark:bg-[#1a2736]">
                    <option value="">Select Doctor...</option>
                    {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Visit Type</Label>
                  <select name="visitType" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm dark:bg-[#1a2736]">
                    <option value="EXAMINATION">Examination (كشف)</option>
                    <option value="CONSULTATION">Consultation (استشارة)</option>
                    <option value="FOLLOW_UP">Follow-up (متابعة)</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Date & Time *</Label>
                  <Input name="visitDate" type="datetime-local" required />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t mt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-red-600">Emergency Patient</span>
                    <p className="text-xs text-gray-500">Auto-added to Waiting Room with high priority. Bypasses payment.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 cursor-pointer ${isEmergency ? "opacity-50 pointer-events-none" : ""}`}>
                  <input
                    type="checkbox"
                    checked={addToWaitingRoom}
                    onChange={(e) => setAddToWaitingRoom(e.target.checked)}
                    disabled={isEmergency}
                    className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-0.5"
                  />
                  <div>
                    <span className="font-medium">Add to Waiting Room</span>
                    <p className="text-xs text-gray-500">Check-in immediately instead of scheduling</p>
                  </div>
                </label>
              </div>

              {/* ═══ Payment Policy Notice ═══ */}
              {paymentWorkflow && paymentWorkflow !== "PAY_AFTER_VISIT" && !isEmergency && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mt-4">
                  <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {paymentWorkflow === "PAY_BEFORE_VISIT"
                        ? "Payment required before visit"
                        : "Initial payment required before visit"}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      {paymentWorkflow === "PAY_BEFORE_VISIT"
                        ? "You will be asked to record payment before the appointment is confirmed."
                        : "An initial payment will be collected now. Remaining balance after the visit."}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <Label>Initial Notes (Optional)</Label>
                <Textarea name="notes" rows={2} placeholder="Reason for visit or brief notes..." />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md flex-1 h-12 text-base">
                {isPending ? "Saving..." : (addToWaitingRoom ? "Register & Add to Queue" : "Register & Schedule Appointment")}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="h-12">Cancel</Button>
            </div>
          </>
        )}
      </form>

      {/* ═══ Pre-Visit Payment Dialog ═══ */}
      {pendingPayment && (
        <PreVisitPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onPaymentComplete={handlePaymentComplete}
          appointmentId={pendingPayment.appointmentId}
          patientId={pendingPayment.patientId}
          patientName={pendingPayment.patientName}
          clinicId={clinicId}
          branchId={branchId}
          paymentPolicy={pendingPayment.policy}
        />
      )}
    </>
  )
}