"use client"

import { useState, useTransition, useEffect } from "react"
import { createUnifiedAppointment } from "@/actions/unified-appointment"
import { searchPatients } from "@/lib/actions/patients"
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
  preselectedPatientId?: string // ✨ إضافة البروب الجديد
  preselectedType?: string     // ✨ إضافة البروب الجديد
}

// ✨ استايل موحد للـ Select العادي عشان يطابق تصميم Shadcn
const nativeSelectClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

export function UnifiedAppointmentDrawer({ doctors, clinicId, preselectedPatientId, preselectedType }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Patient State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Search Effect
  useEffect(() => {
    if (debouncedSearch && !selectedPatient && !isNewPatient) {
      searchPatients(debouncedSearch, clinicId).then(results => {
        setSearchResults(results as PatientOption[])
      })
    } else {
      setSearchResults([])
    }
  }, [debouncedSearch, clinicId, selectedPatient, isNewPatient])

  // ✨ Pre-select patient if passed via URL (e.g., from Patient Profile)
  useEffect(() => {
    if (isOpen && preselectedPatientId && !selectedPatient) {
      searchPatients(preselectedPatientId, clinicId).then(results => {
        const found = (results as PatientOption[]).find(p => p.id === preselectedPatientId)
        if (found) setSelectedPatient(found)
      })
    }
  }, [isOpen, preselectedPatientId, clinicId, selectedPatient])

  function resetForm() {
    setSelectedPatient(null)
    setIsNewPatient(false)
    setSearchQuery("")
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
      if (result.success) {
        toast.success("Flow created successfully!")
        setIsOpen(false)
        resetForm()
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm() }}>
      <SheetTrigger asChild>
        <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md">
          <Plus className="mr-2 h-4 w-4" /> New Appointment
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">New Appointment</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            
          {/* ━━━ STEP 1: PATIENT INFO ━━━ */}
          <div className="space-y-4 rounded-lg border p-4 bg-gray-50/50">
            <h3 className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4 text-teal-600" /> Patient</h3>
            
            {!selectedPatient && !isNewPatient && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search by Name or Phone..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-40 overflow-y-auto bg-white shadow-sm">
                    {searchResults.map(p => (
                      <button type="button" key={p.id} onClick={() => { setSelectedPatient(p); setSearchQuery("") }} className="w-full text-left px-4 py-2 hover:bg-teal-50 flex justify-between text-sm">
                        <span className="font-medium">{p.fullName}</span>
                        <span className="text-gray-500">{p.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                <Button type="button" variant="outline" size="sm" onClick={() => setIsNewPatient(true)} className="w-full">
                  + Create New Patient
                </Button>
              </div>
            )}

            {selectedPatient && (
              <div className="flex items-center justify-between bg-teal-50 p-3 rounded-md border border-teal-100">
                <div>
                  <p className="font-semibold text-teal-900">{selectedPatient.fullName}</p>
                  <p className="text-xs text-teal-700">{selectedPatient.phone}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedPatient(null)}><X className="h-4 w-4" /></Button>
              </div>
            )}

            {isNewPatient && (
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div className="col-span-2">
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
                <Button type="button" variant="link" size="sm" onClick={() => setIsNewPatient(false)} className="text-red-500 col-span-2 justify-start p-0">Cancel new patient</Button>
              </div>
            )}
          </div>

          {/* ━━━ STEP 2: APPOINTMENT & FLOW ━━━ */}
          {(selectedPatient || isNewPatient) && (
            <div className="space-y-4 rounded-lg border p-4 bg-gray-50/50">
              <h3 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-blue-600" /> Appointment Details</h3>
              
              <div>
                <Label>Appointment Type *</Label>
                {/* ✨ استخدمنا preselectedType كقيمة افتراضية */}
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
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
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

          {/* ━━━ SUBMIT ━━━ */}
          {(selectedPatient || isNewPatient) && (
            <Button type="submit" disabled={isPending} className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
              {isPending ? "Processing..." : "Confirm & Proceed"}
            </Button>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}