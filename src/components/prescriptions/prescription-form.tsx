"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createPrescription, updatePrescription } from "@/lib/actions/prescriptions"
import type { ActionResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { PrescriptionItems, type PrescriptionItemInput } from "./prescription-items"

type DoctorOption = { id: string; name: string }

type PrescriptionData = {
  id?: string
  patientId: string
  doctorId: string
  visitId?: string | null
  items: PrescriptionItemInput[]
}

type Props = {
  patientId: string
  doctors: DoctorOption[]
  visitId?: string
  prescription?: PrescriptionData
}

export function PrescriptionForm({ patientId, doctors, visitId, prescription }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!prescription?.id

  const [items, setItems] = useState<PrescriptionItemInput[]>(
    prescription?.items?.length ? prescription.items : [{ medicationName: "", dosage: "", frequency: "", duration: "", instructions: "" }]
  )

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      toast.error(result.error || "Something went wrong")
    } else {
      toast.success(isEdit ? "Prescription updated" : "Prescription created")
      router.push(`/patients/${patientId}/prescriptions`)
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validItems = items.filter(i => i.medicationName.trim() && i.dosage.trim() && i.frequency.trim() && i.duration.trim())
    if (validItems.length === 0) {
      setError("At least one medication is required")
      toast.error("At least one medication is required")
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set("patientId", patientId)
    formData.set("items", JSON.stringify(validItems))
    if (visitId) formData.set("visitId", visitId)

    startTransition(async () => {
      if (isEdit && prescription?.id) {
        const result = await updatePrescription(prescription.id, formData)
        handleResult(result)
      } else {
        const result = await createPrescription(formData)
        handleResult(result)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doctorId">Prescribing Doctor <span className="text-red-500">*</span></Label>
          <select
            id="doctorId"
            name="doctorId"
            defaultValue={prescription?.doctorId ?? ""}
            required
            className="flex h-10 w-full rounded-lg border border-input bg-white/50 px-3 py-2 text-sm dark:bg-slate-800/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select Doctor...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <PrescriptionItems items={items} setItems={setItems} />

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isPending} className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
          {isPending ? "Saving..." : isEdit ? "Update Prescription" : "Create Prescription"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}