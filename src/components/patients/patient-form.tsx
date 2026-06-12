"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createPatient, updatePatient } from "@/lib/actions/patients"
import type { ActionResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input"
import { searchAllergies, searchSurgeries, searchMedicalHistory } from "@/lib/actions/medical-dictionary"
import { toast } from "sonner"
import { X } from "lucide-react"

type PatientData = {
  id?: string
  fullName: string
  phone: string
  email?: string | null
  gender?: string | null
  dateOfBirth?: Date | null
  address?: string | null
  allergies?: string[]
  surgeries?: string[]
  medicalHistory?: string[] // ← أضفنا الـ PMH
}

type Props = {
  patient?: PatientData
}

function toDateString(date: Date | null | undefined): string {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export function PatientForm({ patient }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // State for Allergies, Surgeries & Medical History
  const [allergies, setAllergies] = useState<string[]>(patient?.allergies || [])
  const [surgeries, setSurgeries] = useState<string[]>(patient?.surgeries || [])
  const [medicalHistory, setMedicalHistory] = useState<string[]>(patient?.medicalHistory || [])

  const isEdit = !!patient?.id

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      setFieldErrors(result.fieldErrors || {})
      toast.error(result.error || "Something went wrong")
    } else {
      toast.success(isEdit ? "Patient updated successfully" : "Patient created successfully")
      router.push("/patients")
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)

    // إضافة الحساسيات والعمليات والـ PMH للـ FormData
    formData.set("allergies", JSON.stringify(allergies.filter(a => a.trim())))
    formData.set("surgeries", JSON.stringify(surgeries.filter(s => s.trim())))
    formData.set("medicalHistory", JSON.stringify(medicalHistory.filter(m => m.trim())))

    startTransition(async () => {
      if (isEdit && patient?.id) {
        const result = await updatePatient(patient.id, formData)
        handleResult(result)
      } else {
        const result = await createPatient(formData)
        handleResult(result)
      }
    })
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name]?.[0]
  }

  // Handlers for Allergies
  function handleAddAllergy(option: AutocompleteOption) {
    if (!allergies.includes(option.label)) setAllergies([...allergies, option.label])
  }
  function handleAddCustomAllergy(value: string) {
    if (!allergies.includes(value)) setAllergies([...allergies, value])
  }
  function handleRemoveAllergy(item: string) {
    setAllergies(allergies.filter(a => a !== item))
  }

  // Handlers for Surgeries
  function handleAddSurgery(option: AutocompleteOption) {
    if (!surgeries.includes(option.label)) setSurgeries([...surgeries, option.label])
  }
  function handleAddCustomSurgery(value: string) {
    if (!surgeries.includes(value)) setSurgeries([...surgeries, value])
  }
  function handleRemoveSurgery(item: string) {
    setSurgeries(surgeries.filter(s => s !== item))
  }

  // Handlers for Medical History
  function handleAddMedicalHistory(option: AutocompleteOption) {
    if (!medicalHistory.includes(option.label)) setMedicalHistory([...medicalHistory, option.label])
  }
  function handleAddCustomMedicalHistory(value: string) {
    if (!medicalHistory.includes(value)) setMedicalHistory([...medicalHistory, value])
  }
  function handleRemoveMedicalHistory(item: string) {
    setMedicalHistory(medicalHistory.filter(m => m !== item))
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
          <Input id="fullName" name="fullName" type="text" placeholder="John Doe" defaultValue={patient?.fullName ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
          <Input id="phone" name="phone" type="tel" placeholder="01xxxxxxxxx" defaultValue={patient?.phone ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="john@example.com" defaultValue={patient?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={toDateString(patient?.dateOfBirth)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
          <select id="gender" name="gender" defaultValue={patient?.gender ?? ""} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" rows={3} placeholder="123 Main St, City, Country" defaultValue={patient?.address ?? ""} />
      </div>

      {/* Medical History Section */}
      <div className="rounded-xl border border-border/50 bg-white/30 dark:bg-slate-800/20 p-6 space-y-6">
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider border-b border-border/30 pb-2">Medical History</h3>
        
        {/* Allergies */}
        <div className="space-y-3">
          <Label>Allergies</Label>
          <AutocompleteInput searchFn={searchAllergies} onSelect={handleAddAllergy} onCustomAdd={handleAddCustomAllergy} placeholder="Search allergies (e.g., Penicillin)..." allowCustom />
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {allergies.map((allergy) => (
                <span key={allergy} className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400 transition-colors hover:bg-red-200">
                  {allergy}
                  <button type="button" onClick={() => handleRemoveAllergy(allergy)} className="rounded-full hover:bg-red-300 p-0.5"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Surgical History */}
        <div className="space-y-3">
          <Label>Surgical History</Label>
          <AutocompleteInput searchFn={searchSurgeries} onSelect={handleAddSurgery} onCustomAdd={handleAddCustomSurgery} placeholder="Search surgeries (e.g., Appendectomy)..." allowCustom />
          {surgeries.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {surgeries.map((surgery) => (
                <span key={surgery} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 transition-colors hover:bg-blue-200">
                  {surgery}
                  <button type="button" onClick={() => handleRemoveSurgery(surgery)} className="rounded-full hover:bg-blue-300 p-0.5"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Past Medical History */}
        <div className="space-y-3">
          <Label>Past Medical History</Label>
          <AutocompleteInput searchFn={searchMedicalHistory} onSelect={handleAddMedicalHistory} onCustomAdd={handleAddCustomMedicalHistory} placeholder="Search chronic diseases, meds, symptoms..." allowCustom />
          {medicalHistory.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {medicalHistory.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 transition-colors hover:bg-purple-200">
                  {item}
                  <button type="button" onClick={() => handleRemoveMedicalHistory(item)} className="rounded-full hover:bg-purple-300 p-0.5"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : isEdit ? "Update Patient" : "Create Patient"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}