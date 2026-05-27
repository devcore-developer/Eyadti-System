"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createVisit, updateVisit } from "@/lib/actions/visits"
import type { ActionResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ComplaintSelector } from "./complaint-selector"
import { DiagnosisSelector } from "./diagnosis-selector"
import { TreatmentTemplateSelector } from "./treatment-template-selector"

type DoctorOption = { id: string; name: string }

type VisitData = {
  id?: string
  patientId: string
  doctorId: string
  visitDate: Date
  notes?: string | null
  complaints: string[]
  diagnoses: string[]
  treatmentPlans: string[]
}

type Props = {
  patientId: string
  doctors: DoctorOption[]
  visit?: VisitData
}

function toLocalDatetimeString(date: Date): string {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function VisitForm({ patientId, doctors, visit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!visit?.id

  const [complaints, setComplaints] = useState<string[]>(visit?.complaints?.length ? visit.complaints : [])
  const [diagnoses, setDiagnoses] = useState<string[]>(visit?.diagnoses?.length ? visit.diagnoses : [])
  const [treatmentPlans, setTreatmentPlans] = useState<string[]>(visit?.treatmentPlans?.length ? visit.treatmentPlans : [])

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      toast.error(result.error || "Something went wrong")
    } else {
      toast.success(isEdit ? "Visit updated successfully" : "Visit created successfully")
      router.push(`/patients/${patientId}/visits`)
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (complaints.filter(c => c.trim()).length === 0) {
      setError("At least one complaint is required")
      toast.error("At least one complaint is required")
      return
    }
    if (diagnoses.filter(d => d.trim()).length === 0) {
      setError("At least one diagnosis is required")
      toast.error("At least one diagnosis is required")
      return
    }
    if (treatmentPlans.filter(t => t.trim()).length === 0) {
      setError("At least one treatment plan is required")
      toast.error("At least one treatment plan is required")
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set("patientId", patientId)
    formData.set("complaints", JSON.stringify(complaints.filter(c => c.trim())))
    formData.set("diagnoses", JSON.stringify(diagnoses.filter(d => d.trim())))
    formData.set("treatmentPlans", JSON.stringify(treatmentPlans.filter(t => t.trim())))

    startTransition(async () => {
      if (isEdit && visit?.id) {
        const result = await updateVisit(visit.id, formData)
        handleResult(result)
      } else {
        const result = await createVisit(formData)
        handleResult(result)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Info Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doctorId">Attending Doctor <span className="text-red-500">*</span></Label>
          <select
            id="doctorId"
            name="doctorId"
            defaultValue={visit?.doctorId ?? ""}
            required
            className="flex h-10 w-full rounded-lg border border-input bg-white/50 px-3 py-2 text-sm dark:bg-slate-800/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select Doctor...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitDate">Date & Time <span className="text-red-500">*</span></Label>
          <Input
            id="visitDate"
            name="visitDate"
            type="datetime-local"
            defaultValue={visit ? toLocalDatetimeString(visit.visitDate) : ""}
            required
            className="bg-white/50 dark:bg-slate-800/50"
          />
        </div>
      </div>

      {/* Clinical Data Sections */}
      <div className="rounded-xl border border-border/50 bg-white/30 dark:bg-slate-800/20 p-6 space-y-8">
        <ComplaintSelector complaints={complaints} setComplaints={setComplaints} />
        <DiagnosisSelector diagnoses={diagnoses} setDiagnoses={setDiagnoses} />
        <TreatmentTemplateSelector treatmentPlans={treatmentPlans} setTreatmentPlans={setTreatmentPlans} />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={visit?.notes ?? ""}
          placeholder="Any additional observations or instructions..."
          className="bg-white/50 dark:bg-slate-800/50"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20 hover:shadow-teal-500/40 transition-all"
        >
          {isPending ? "Saving..." : isEdit ? "Update Visit" : "Save Visit"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}