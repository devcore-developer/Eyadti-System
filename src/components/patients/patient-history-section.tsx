"use client"

import { useState } from "react"
import { HeartPulse, Syringe, AlertTriangle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { MedicalAutocomplete } from "@/components/ui/medical-autocomplete"
import { addAllergy, addMedicalHistory, addSurgicalHistory } from "@/lib/actions/patients"
import { EmptyState } from "@/components/shared/empty-state"

function AddAllergyForm({ patientId }: { patientId: string }) {
  const [selectedAllergy, setSelectedAllergy] = useState<any>(null)

  return (
    <form action={async (formData) => { 
      if (selectedAllergy?.name) formData.set("allergen", selectedAllergy.name)
      await addAllergy(patientId, formData) 
    }} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Allergen *</label>
        <MedicalAutocomplete 
          apiUrl="/api/allergies/search" 
          placeholder="Search allergen (e.g. Penicillin)..."
          onSelect={(item: any) => setSelectedAllergy(item)}
          fieldName="allergen"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Reaction</label>
          <input name="reaction" className="w-full mt-1 px-4 py-2 rounded-xl border dark:bg-[#1D2A3B] dark:border-[rgba(255,255,255,0.06)]" placeholder="e.g. Rash" />
        </div>
        <div>
          <label className="text-sm font-medium">Severity</label>
          <select name="severity" className="w-full mt-1 px-4 py-2 rounded-xl border dark:bg-[#1D2A3B] dark:border-[rgba(255,255,255,0.06)]">
            <option value="MILD">Mild</option>
            <option value="MODERATE">Moderate</option>
            <option value="SEVERE">Severe</option>
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full bg-[#EF6B6B] hover:bg-[#d45d5d] text-white rounded-xl">Save Allergy</Button>
    </form>
  )
}

function AddMedicalHistoryForm({ patientId }: { patientId: string }) {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<any>(null)

  return (
    <form action={async (formData) => { 
      if (selectedDiagnosis?.name) formData.set("condition", selectedDiagnosis.name)
      await addMedicalHistory(patientId, formData) 
    }} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Condition / Disease *</label>
        <MedicalAutocomplete 
          apiUrl="/api/diagnoses/search" 
          placeholder="Search disease (e.g. Diabetes)..."
          onSelect={(item: any) => setSelectedDiagnosis(item)}
          fieldName="condition"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Status</label>
          <select name="status" className="w-full mt-1 px-4 py-2 rounded-xl border dark:bg-[#1D2A3B] dark:border-[rgba(255,255,255,0.06)]">
            <option value="ACTIVE">Active</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Diagnosed Date</label>
          <input type="date" name="diagnosedAt" className="w-full mt-1 px-4 py-2 rounded-xl border dark:bg-[#1D2A3B] dark:border-[rgba(255,255,255,0.06)]" />
        </div>
      </div>
      <Button type="submit" className="w-full bg-[#5BC0BE] hover:bg-[#4aa8a6] text-white rounded-xl">Save Condition</Button>
    </form>
  )
}

function AddSurgicalHistoryForm({ patientId }: { patientId: string }) {
  const [selectedSurgery, setSelectedSurgery] = useState<any>(null)

  return (
    <form action={async (formData) => { 
      if (selectedSurgery?.name) formData.set("procedure", selectedSurgery.name)
      await addSurgicalHistory(patientId, formData) 
    }} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Procedure / Surgery *</label>
        <MedicalAutocomplete 
          apiUrl="/api/surgeries/search" 
          placeholder="Search surgery (e.g. Appendectomy)..."
          onSelect={(item: any) => setSelectedSurgery(item)}
          fieldName="procedure"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Performed Date</label>
        <input type="date" name="performedAt" className="w-full mt-1 px-4 py-2 rounded-xl border dark:bg-[#1D2A3B] dark:border-[rgba(255,255,255,0.06)]" />
      </div>
      <Button type="submit" className="w-full bg-[#6B9CFF] hover:bg-[#5a8be0] text-white rounded-xl">Save Surgery</Button>
    </form>
  )
}

export function PatientHistorySection({ 
  patientId, allergies, medicalHistory, surgicalHistory 
}: { 
  patientId: string; allergies: any[]; medicalHistory: any[]; surgicalHistory: any[] 
}) {
  return (
    <div id="allergies-history" className="space-y-8">
      
      {/* Allergies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#EF6B6B]" /> Allergies
          </h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-dashed border-[#EF6B6B]/50 text-[#EF6B6B] hover:bg-[#EF6B6B]/10">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="dark:bg-[#223247] !overflow-visible"
              onInteractOutside={(e) => {
                // منع إغلاق الـ Dialog لما المستخدم يضغط على القائمة المنسدلة
                if (e.target instanceof HTMLElement && e.target.closest('#medical-autocomplete-portal')) {
                  e.preventDefault()
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Add New Allergy</DialogTitle>
                <DialogDescription className="sr-only">Add a new allergy to the patient profile</DialogDescription>
              </DialogHeader>
              <AddAllergyForm patientId={patientId} />
            </DialogContent>
          </Dialog>
        </div>
        {allergies.length === 0 ? <EmptyState icon={AlertTriangle} title="No allergies recorded" description="This patient has no known allergies." /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allergies.map((a) => (
              <div key={a.id} className="p-4 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EF6B6B]/10">
                  <AlertTriangle className="h-5 w-5 text-[#EF6B6B]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.allergen}</p>
                  <p className="text-xs text-muted-foreground">{a.reaction || "No reaction specified"} • <span className="text-[#EF6B6B]">{a.severity || "N/A"}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Medical History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-[#5BC0BE]" /> Past Medical History
          </h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-dashed border-[#5BC0BE]/50 text-[#5BC0BE] hover:bg-[#5BC0BE]/10">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="dark:bg-[#223247] !overflow-visible"
              onInteractOutside={(e) => {
                if (e.target instanceof HTMLElement && e.target.closest('#medical-autocomplete-portal')) {
                  e.preventDefault()
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Add Medical Condition</DialogTitle>
                <DialogDescription className="sr-only">Add a past medical condition</DialogDescription>
              </DialogHeader>
              <AddMedicalHistoryForm patientId={patientId} />
            </DialogContent>
          </Dialog>
        </div>
        {medicalHistory.length === 0 ? <EmptyState icon={HeartPulse} title="No medical history" description="No past medical conditions recorded." /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {medicalHistory.map((m) => (
              <div key={m.id} className="p-4 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5BC0BE]/10">
                  <HeartPulse className="h-5 w-5 text-[#5BC0BE]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{m.condition}</p>
                  <p className="text-xs text-muted-foreground">{m.status} {m.diagnosedAt ? `• ${new Date(m.diagnosedAt).toLocaleDateString()}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Surgical History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Syringe className="h-5 w-5 text-[#6B9CFF]" /> Past Surgical History
          </h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-dashed border-[#6B9CFF]/50 text-[#6B9CFF] hover:bg-[#6B9CFF]/10">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="dark:bg-[#223247] !overflow-visible"
              onInteractOutside={(e) => {
                if (e.target instanceof HTMLElement && e.target.closest('#medical-autocomplete-portal')) {
                  e.preventDefault()
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Add Surgical Procedure</DialogTitle>
                <DialogDescription className="sr-only">Add a past surgical procedure</DialogDescription>
              </DialogHeader>
              <AddSurgicalHistoryForm patientId={patientId} />
            </DialogContent>
          </Dialog>
        </div>
        {surgicalHistory.length === 0 ? <EmptyState icon={Syringe} title="No surgical history" description="No past surgeries recorded." /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {surgicalHistory.map((s) => (
              <div key={s.id} className="p-4 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B9CFF]/10">
                  <Syringe className="h-5 w-5 text-[#6B9CFF]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.procedure}</p>
                  <p className="text-xs text-muted-foreground">{s.performedAt ? new Date(s.performedAt).toLocaleDateString() : "No date specified"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}