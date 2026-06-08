"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createPatientVisit } from "@/lib/actions/visits"
import { searchPatients } from "@/lib/actions/patients"
import type { ActionResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ComplaintSelector } from "@/components/visits/complaint-selector"
import { DiagnosisSelector } from "@/components/visits/diagnosis-selector"
import { TreatmentTemplateSelector } from "@/components/visits/treatment-template-selector"
import { Search, UserPlus, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

type DoctorOption = { id: string; name: string }
type PatientOption = { id: string; fullName: string; phone: string }

type Props = {
  clinicId: string
  doctors: DoctorOption[]
  preselectedPatient?: PatientOption | null
}

export function PatientVisitForm({ clinicId, doctors, preselectedPatient }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Patient State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(preselectedPatient || null)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Visit State
  const [complaints, setComplaints] = useState<string[]>([])
  const [diagnoses, setDiagnoses] = useState<string[]>([])
  const [treatmentPlans, setTreatmentPlans] = useState<string[]>([])

  // Search Effect
  useEffect(() => {
    if (debouncedSearch && !selectedPatient) {
      searchPatients(debouncedSearch, clinicId).then(results => {
        setSearchResults(results as PatientOption[])
      })
    } else {
      setSearchResults([])
    }
  }, [debouncedSearch, clinicId, selectedPatient])

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      toast.error(result.error || "Something went wrong")
    } else {
      toast.success("Patient Visit created successfully")
      router.push("/waiting-room") // يروح لغرفة الانتظار مباشرة
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    if (selectedPatient) {
      formData.set("patientId", selectedPatient.id)
      // مسح بيانات المريض الجديد لو موجودة بالغلط
      formData.delete("fullName")
      formData.delete("phone")
      formData.delete("gender")
      formData.delete("dateOfBirth")
    } else if (!isNewPatient) {
      toast.error("Please select an existing patient or create a new one")
      return
    }

    if (complaints.filter(c => c.trim()).length === 0) {
      setError("At least one complaint is required")
      return
    }
    if (diagnoses.filter(d => d.trim()).length === 0) {
      setError("At least one diagnosis is required")
      return
    }

    formData.set("complaints", JSON.stringify(complaints.filter(c => c.trim())))
    formData.set("diagnoses", JSON.stringify(diagnoses.filter(d => d.trim())))
    formData.set("treatmentPlans", JSON.stringify(treatmentPlans.filter(t => t.trim())))

    startTransition(async () => {
      const result = await createPatientVisit(formData)
      handleResult(result)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* ━━━ STEP 1: PATIENT ━━━ */}
      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
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
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-white shadow-lg">
                {searchResults.map(p => (
                  <button type="button" key={p.id} onClick={() => { setSelectedPatient(p); setSearchQuery(""); setSearchResults([]) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between">
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
          <div className="flex items-center justify-between bg-teal-50 p-3 rounded-lg border border-teal-100">
            <div>
              <p className="font-semibold text-teal-900">{selectedPatient.fullName}</p>
              <p className="text-sm text-teal-700">{selectedPatient.phone}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}><X className="h-4 w-4" /></Button>
          </div>
        )}

        {isNewPatient && !selectedPatient && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
            <Input name="fullName" placeholder="Full Name *" required />
            <Input name="phone" placeholder="Phone Number *" required />
            <select name="gender" required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            <Input name="dateOfBirth" type="date" />
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewPatient(false)} className="text-gray-500 sm:col-span-2">Cancel Creation</Button>
          </div>
        )}
      </div>

      {/* ━━━ STEP 2: VISIT ━━━ */}
      {(selectedPatient || isNewPatient) && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Attending Doctor *</Label>
              <select name="doctorId" required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select Doctor...</option>
                {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date & Time *</Label>
              <Input name="visitDate" type="datetime-local" required />
            </div>
          </div>

          <div className="rounded-xl border bg-white/30 p-6 space-y-8">
            <ComplaintSelector complaints={complaints} setComplaints={setComplaints} />
            <DiagnosisSelector diagnoses={diagnoses} setDiagnoses={setDiagnoses} />
            <TreatmentTemplateSelector treatmentPlans={treatmentPlans} setTreatmentPlans={setTreatmentPlans} />
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea name="notes" rows={3} placeholder="Observations..." />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md">
              {isPending ? "Saving..." : "Save Patient Visit"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </>
      )}
    </form>
  )
}