// components/patients/patient-form.tsx
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
import { FormGrid, FormFullWidth } from "@/components/ui/form-grid"
import { FormSection } from "@/components/ui/form-section"

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
  medicalHistory?: string[]
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

  function handleAddAllergy(option: AutocompleteOption) { if (!allergies.includes(option.label)) setAllergies([...allergies, option.label]) }
  function handleAddCustomAllergy(value: string) { if (!allergies.includes(value)) setAllergies([...allergies, value]) }
  function handleRemoveAllergy(item: string) { setAllergies(allergies.filter(a => a !== item)) }

  function handleAddSurgery(option: AutocompleteOption) { if (!surgeries.includes(option.label)) setSurgeries([...surgeries, option.label]) }
  function handleAddCustomSurgery(value: string) { if (!surgeries.includes(value)) setSurgeries([...surgeries, value]) }
  function handleRemoveSurgery(item: string) { setSurgeries(surgeries.filter(s => s !== item)) }

  function handleAddMedicalHistory(option: AutocompleteOption) { if (!medicalHistory.includes(option.label)) setMedicalHistory([...medicalHistory, option.label]) }
  function handleAddCustomMedicalHistory(value: string) { if (!medicalHistory.includes(value)) setMedicalHistory([...medicalHistory, value]) }
  function handleRemoveMedicalHistory(item: string) { setMedicalHistory(medicalHistory.filter(m => m !== item)) }

  const premiumSelectClasses = "flex h-10 w-full rounded-xl border border-input bg-white/90 dark:bg-[#223247]/50 backdrop-blur-sm px-4 py-2 text-sm shadow-sm ring-offset-background transition-all focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_4px_rgba(107,156,255,0.12)] hover:border-muted-foreground/30 appearance-none cursor-pointer disabled:opacity-50"

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8 pb-28 md:pb-0 animate-fade-in-up">
      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-start gap-3 shadow-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      <FormSection title="Personal Information" description="Basic patient details and contact information." variant="patient">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
          <Input id="fullName" name="fullName" type="text" placeholder="John Doe" defaultValue={patient?.fullName ?? ""} required aria-invalid={!!fieldError("fullName")} />
          {fieldError("fullName") && <p className="text-xs font-medium text-destructive mt-1">{fieldError("fullName")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
          <Input id="phone" name="phone" type="tel" placeholder="01xxxxxxxxx" defaultValue={patient?.phone ?? ""} required aria-invalid={!!fieldError("phone")} />
          {fieldError("phone") && <p className="text-xs font-medium text-destructive mt-1">{fieldError("phone")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="john@example.com" defaultValue={patient?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={toDateString(patient?.dateOfBirth)} required aria-invalid={!!fieldError("dateOfBirth")} />
          {fieldError("dateOfBirth") && <p className="text-xs font-medium text-destructive mt-1">{fieldError("dateOfBirth")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
          <select id="gender" name="gender" defaultValue={patient?.gender ?? ""} required className={premiumSelectClasses}>
            <option value="" disabled>Select...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <FormFullWidth className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" rows={3} placeholder="123 Main St, City, Country" defaultValue={patient?.address ?? ""} />
        </FormFullWidth>
      </FormSection>

      <FormSection title="Medical History" description="Allergies, past surgeries, and chronic conditions." variant="medical">
        <FormFullWidth className="space-y-3">
          <Label>Allergies</Label>
          <AutocompleteInput searchFn={searchAllergies} onSelect={handleAddAllergy} onCustomAdd={handleAddCustomAllergy} placeholder="Search allergies (e.g., Penicillin)..." allowCustom />
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {allergies.map((allergy) => (
                <span key={allergy} className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20">
                  {allergy}
                  <button type="button" onClick={() => handleRemoveAllergy(allergy)} className="rounded-full hover:bg-destructive/30 p-0.5 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </FormFullWidth>

        <FormFullWidth className="space-y-3">
          <Label>Surgical History</Label>
          <AutocompleteInput searchFn={searchSurgeries} onSelect={handleAddSurgery} onCustomAdd={handleAddCustomSurgery} placeholder="Search surgeries (e.g., Appendectomy)..." allowCustom />
          {surgeries.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {surgeries.map((surgery) => (
                <span key={surgery} className="inline-flex items-center gap-1.5 rounded-full bg-[#6B9CFF]/10 border border-[#6B9CFF]/20 px-3 py-1 text-xs font-medium text-[#6B9CFF] transition-colors hover:bg-[#6B9CFF]/20">
                  {surgery}
                  <button type="button" onClick={() => handleRemoveSurgery(surgery)} className="rounded-full hover:bg-[#6B9CFF]/30 p-0.5 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </FormFullWidth>

        <FormFullWidth className="space-y-3">
          <Label>Past Medical History</Label>
          <AutocompleteInput searchFn={searchMedicalHistory} onSelect={handleAddMedicalHistory} onCustomAdd={handleAddCustomMedicalHistory} placeholder="Search chronic diseases, meds, symptoms..." allowCustom />
          {medicalHistory.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {medicalHistory.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 transition-colors hover:bg-purple-500/20">
                  {item}
                  <button type="button" onClick={() => handleRemoveMedicalHistory(item)} className="rounded-full hover:bg-purple-500/30 p-0.5 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </FormFullWidth>
      </FormSection>

      <div className="sticky-form-footer bg-white/80 dark:bg-[#17212F]/80 border-t border-border p-4 -mx-4 sm:-mx-6 sm:px-6 -mb-4 sm:-mb-6 md:static md:bg-transparent md:border-0 md:p-0 flex items-center gap-3 rounded-b-[24px] md:rounded-none">
        <Button type="submit" disabled={isPending} isLoading={isPending} className="flex-1 md:flex-none shadow-[0_4px_12px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
          {isEdit ? "Update Patient" : "Create Patient"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 md:flex-none rounded-xl border-border bg-white dark:bg-[#223247]">Cancel</Button>
      </div>
    </form>
  )
}