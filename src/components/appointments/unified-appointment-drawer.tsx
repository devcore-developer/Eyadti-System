"use client"

import { useState, useTransition, useEffect } from "react"
import { createUnifiedAppointment } from "@/actions/unified-appointment"
import { searchPatients } from "@/lib/actions/patients"
import { PreVisitPaymentDialog } from "@/components/appointments/pre-visit-payment-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"
import { Plus, Search, UserPlus, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

type DoctorOption = { id: string; name: string }
type PatientOption = { id: string; fullName: string; phone: string }

type Props = {
  doctors: DoctorOption[]
  clinicId: string
  preselectedPatientId?: string
  preselectedType?: string
}

const nativeSelectClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

export function UnifiedAppointmentDrawer({ doctors, clinicId, preselectedPatientId, preselectedType }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // ═══ Payment Dialog State ═══
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<{
    appointmentId: string
    patientId: string
    patientName: string
    policy: string
  } | null>(null)

  useEffect(() => {
    if (debouncedSearch && !selectedPatient && !isNewPatient) {
      searchPatients(debouncedSearch).then(results => setSearchResults((results as any)?.data || []))
    } else {
      setSearchResults([])
    }
  }, [debouncedSearch, clinicId, selectedPatient, isNewPatient])

  useEffect(() => {
    if (isOpen && preselectedPatientId && !selectedPatient) {
      searchPatients(preselectedPatientId).then(results => {
        const found = ((results as any)?.data || []).find((p: any) => p.id === preselectedPatientId)
        if (found) setSelectedPatient(found)
      })
    }
  }, [isOpen, preselectedPatientId, clinicId, selectedPatient])

  function resetForm() {
    setSelectedPatient(null)
    setIsNewPatient(false)
    setSearchQuery("")
  }

  // ═══ Handle payment dialog close ═══
  function handlePaymentComplete(success: boolean) {
    setShowPaymentDialog(false)
    if (success) {
      toast.success("Payment recorded — appointment confirmed")
      setIsOpen(false)
      resetForm()
    }
    setPendingPayment(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (selectedPatient) {
      formData.set("patientId", selectedPatient.id)
      formData.set("isNewPatient", "false")
    } else if (isNewPatient) {
      formData.set("isNewPatient", "true")
      formData.delete("patientId")
    } else {
      toast.error("Please select a patient or create a new one")
      return
    }

    startTransition(async () => {
      const result = await createUnifiedAppointment(formData)
      if (!result.success) {
        toast.error(result.error || "Something went wrong")
        return
      }

      // ═══ Check if pre-visit payment is required ═══
      if (result.requiresPayment && result.appointmentId) {
        setPendingPayment({
          appointmentId: result.appointmentId,
          patientId: result.patientId || selectedPatient?.id || "",
          patientName: selectedPatient?.fullName || "Patient",
          policy: result.paymentPolicy || "PAY_BEFORE_VISIT",
        })
        setShowPaymentDialog(true)
        return
      }

      // No payment required
      toast.success(result.visitCreated ? "Patient added to Waiting Room" : "Appointment scheduled successfully")
      setIsOpen(false)
      resetForm()
    })
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm() }}>
        <SheetTrigger asChild>
          <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">New Appointment</span> <span className="sm:hidden">New</span>
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-lg h-full flex flex-col p-0">
          <SheetHeader className="p-4 sm:p-6 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)]">
            <SheetTitle className="text-xl">New Appointment</SheetTitle>
          </SheetHeader>

          <form id="appointment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28 sm:pb-6">

            {/* STEP 1: Patient */}
            <div className="space-y-4 rounded-lg border p-4 bg-gray-50/50 dark:bg-slate-800/20">
              <h3 className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4 text-teal-600" /> Patient</h3>

              {!selectedPatient && !isNewPatient && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by Name or Phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border rounded-md divide-y max-h-40 overflow-y-auto bg-white dark:bg-[#223247] shadow-sm">
                      {searchResults.map(p => (
                        <button type="button" key={p.id} onClick={() => { setSelectedPatient(p); setSearchQuery("") }} className="w-full text-left px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-950/30 flex justify-between text-sm">
                          <span className="font-medium">{p.fullName}</span>
                          <span className="text-gray-500">{p.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <Button type="button" variant="outline" size="sm" onClick={() => setIsNewPatient(true)} className="w-full h-11">+ Create New Patient</Button>
                </div>
              )}

              {selectedPatient && (
                <div className="flex items-center justify-between bg-teal-50 dark:bg-teal-950/30 p-3 rounded-md border border-teal-100 dark:border-teal-800">
                  <div>
                    <p className="font-semibold text-teal-900 dark:text-teal-100">{selectedPatient.fullName}</p>
                    <p className="text-xs text-teal-700 dark:text-teal-300">{selectedPatient.phone}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedPatient(null)}><X className="h-4 w-4" /></Button>
                </div>
              )}

              {isNewPatient && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
                  <div className="sm:col-span-2">
                    <Label>Full Name *</Label>
                    <Input name="fullName" required />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input name="phone" required />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select name="gender" defaultValue="MALE" className={nativeSelectClasses}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input name="dateOfBirth" type="date" />
                  </div>
                  <Button type="button" variant="link" size="sm" onClick={() => setIsNewPatient(false)} className="text-red-500 sm:col-span-2 justify-start p-0">Cancel new patient</Button>
                </div>
              )}
            </div>

            {/* STEP 2: Appointment Details */}
            {(selectedPatient || isNewPatient) && (
              <div className="space-y-4 rounded-lg border p-4 bg-gray-50/50 dark:bg-slate-800/20">
                <h3 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-blue-600" /> Appointment Details</h3>

                <div>
                  <Label>Appointment Type *</Label>
                  <select name="appointmentType" required defaultValue={preselectedType || "SCHEDULED"} className={nativeSelectClasses}>
                    <option value="SCHEDULED">📅 Scheduled (Book & Wait)</option>
                    <option value="WALK_IN">🚶 Walk-In (Auto Check-in)</option>
                    <option value="EMERGENCY">🚨 Emergency (Priority Queue)</option>
                  </select>
                </div>

                <div>
                  <Label>Doctor *</Label>
                  <select name="doctorId" required className={nativeSelectClasses}>
                    <option value="" disabled>Select Doctor...</option>
                    {doctors.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>

                <div>
                  <Label>Date & Time *</Label>
                  <Input name="dateTime" type="datetime-local" required />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea name="notes" rows={2} placeholder="Optional reason for visit..." />
                </div>
              </div>
            )}
          </form>

          {/* Sticky Footer */}
          {(selectedPatient || isNewPatient) && (
            <div className="sticky bottom-0 bg-white dark:bg-[#1B2838] border-t border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] p-4 sm:static sm:border-0 sm:px-6 sm:pb-6 sm:pt-0">
              <Button
                type="submit"
                form="appointment-form"
                disabled={isPending}
                className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
              >
                {isPending ? "Processing..." : "Confirm & Proceed"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══ Pre-Visit Payment Dialog ═══ */}
      {pendingPayment && (
        <PreVisitPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          appointmentId={pendingPayment.appointmentId}
          patientId={pendingPayment.patientId}
          patientName={pendingPayment.patientName}
          clinicId={clinicId}
          paymentPolicy={pendingPayment.policy}
          allowZeroPayment={pendingPayment.policy === "SPLIT_PAYMENT"} // <--- FIX: السماح بصفر في نظام السبليت فقط
        />
      )}
    </>
  )
}