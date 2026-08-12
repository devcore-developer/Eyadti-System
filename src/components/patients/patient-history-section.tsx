"use client"

import { useState } from "react"
import { HeartPulse, Syringe, AlertTriangle, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MedicalAutocomplete } from "@/components/ui/medical-autocomplete"
import { addAllergy, addMedicalHistory, addSurgicalHistory, deleteAllergy, deleteMedicalHistory, deleteSurgicalHistory } from "@/lib/actions/patients"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"

type HistoryType = "allergy" | "medical" | "surgical"

type DeleteTarget = {
  type: HistoryType
  id: string
  name: string
}

// ─── Allergy Form ────────────────────────────────────
function AddAllergyForm({ patientId, onSuccess }: { patientId: string; onSuccess: () => void }) {
  const [selectedAllergy, setSelectedAllergy] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    if (selectedAllergy?.name) formData.set("allergen", selectedAllergy.name)

    const result = await addAllergy(patientId, formData)
    setIsPending(false)

    if (result.success) {
      toast.success("Allergy added successfully")
      setSelectedAllergy(null)
      onSuccess()
    } else {
      setError(result.error || "Failed to add allergy")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
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
      <Button type="submit" disabled={isPending} className="w-full bg-[#EF6B6B] hover:bg-[#d45d5d] text-white rounded-xl">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Allergy
      </Button>
    </form>
  )
}

// ─── Medical History Form ────────────────────────────
function AddMedicalHistoryForm({ patientId, onSuccess }: { patientId: string; onSuccess: () => void }) {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    if (selectedDiagnosis?.name) formData.set("condition", selectedDiagnosis.name)

    const result = await addMedicalHistory(patientId, formData)
    setIsPending(false)

    if (result.success) {
      toast.success("Medical history added successfully")
      setSelectedDiagnosis(null)
      onSuccess()
    } else {
      setError(result.error || "Failed to add medical history")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
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
      <Button type="submit" disabled={isPending} className="w-full bg-[#5BC0BE] hover:bg-[#4aa8a6] text-white rounded-xl">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Condition
      </Button>
    </form>
  )
}

// ─── Surgical History Form ───────────────────────────
function AddSurgicalHistoryForm({ patientId, onSuccess }: { patientId: string; onSuccess: () => void }) {
  const [selectedSurgery, setSelectedSurgery] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    if (selectedSurgery?.name) formData.set("procedure", selectedSurgery.name)

    const result = await addSurgicalHistory(patientId, formData)
    setIsPending(false)

    if (result.success) {
      toast.success("Surgical history added successfully")
      setSelectedSurgery(null)
      onSuccess()
    } else {
      setError(result.error || "Failed to add surgical history")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
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
      <Button type="submit" disabled={isPending} className="w-full bg-[#6B9CFF] hover:bg-[#5a8be0] text-white rounded-xl">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Surgery
      </Button>
    </form>
  )
}

// ─── Delete Confirmation Dialog ──────────────────────
function ConfirmDeleteDialog({
  target,
  onConfirm,
  onCancel,
  isPending,
}: {
  target: DeleteTarget
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  const labels: Record<HistoryType, string> = {
    allergy: "allergy",
    medical: "medical history entry",
    surgical: "surgical history entry",
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="dark:bg-[#223247]">
        <DialogHeader>
          <DialogTitle>Remove {labels[target.type]}</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove &ldquo;{target.name}&rdquo; from this patient&rsquo;s record? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────
export function PatientHistorySection({
  patientId, allergies, medicalHistory, surgicalHistory
}: {
  patientId: string; allergies: any[]; medicalHistory: any[]; surgicalHistory: any[]
}) {
  const [openDialog, setOpenDialog] = useState<HistoryType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Delete handler ──
  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)

    let result: { success: boolean; error?: string }

    switch (deleteTarget.type) {
      case "allergy":
        result = await deleteAllergy(deleteTarget.id, patientId)
        break
      case "medical":
        result = await deleteMedicalHistory(deleteTarget.id, patientId)
        break
      case "surgical":
        result = await deleteSurgicalHistory(deleteTarget.id, patientId)
        break
    }

    setIsDeleting(false)

    if (result.success) {
      const messages: Record<HistoryType, string> = {
        allergy: "Allergy removed successfully",
        medical: "Medical history removed successfully",
        surgical: "Surgical history removed successfully",
      }
      toast.success(messages[deleteTarget.type])
      setDeleteTarget(null)
    } else {
      toast.error(result.error || "Failed to remove record")
    }
  }

  // ── Dialog outside-click guard for autocomplete portal ──
  function handleDialogOpenChange(open: boolean) {
    if (!open) setOpenDialog(null)
  }

  const dialogTitles: Record<HistoryType, string> = {
    allergy: "Add New Allergy",
    medical: "Add Medical Condition",
    surgical: "Add Surgical Procedure",
  }

  const dialogDescriptions: Record<HistoryType, string> = {
    allergy: "Add a new allergy to the patient profile",
    medical: "Add a past medical condition",
    surgical: "Add a past surgical procedure",
  }

  function renderForm(type: HistoryType) {
    const onSuccess = () => setOpenDialog(null)

    switch (type) {
      case "allergy": return <AddAllergyForm patientId={patientId} onSuccess={onSuccess} />
      case "medical": return <AddMedicalHistoryForm patientId={patientId} onSuccess={onSuccess} />
      case "surgical": return <AddSurgicalHistoryForm patientId={patientId} onSuccess={onSuccess} />
    }
  }

  return (
    <div id="allergies-history" className="space-y-8">

      {/* ── Allergies ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#EF6B6B]" /> Allergies
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-dashed border-[#EF6B6B]/50 text-[#EF6B6B] hover:bg-[#EF6B6B]/10"
            onClick={() => setOpenDialog("allergy")}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {allergies.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No allergies recorded" description="This patient has no known allergies." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allergies.map((a) => (
              <div key={a.id} className="p-4 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] flex items-center gap-4 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EF6B6B]/10 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-[#EF6B6B]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{a.allergen}</p>
                  <p className="text-xs text-muted-foreground">{a.reaction || "No reaction specified"} • <span className="text-[#EF6B6B]">{a.severity || "N/A"}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ type: "allergy", id: a.id, name: a.allergen })}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all shrink-0"
                  title="Remove allergy"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Past Medical History ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-[#5BC0BE]" /> Past Medical History
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-dashed border-[#5BC0BE]/50 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
            onClick={() => setOpenDialog("medical")}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {medicalHistory.length === 0 ? (
          <EmptyState icon={HeartPulse} title="No medical history" description="No past medical conditions recorded." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {medicalHistory.map((m) => (
              <div key={m.id} className="p-4 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] flex items-center gap-4 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5BC0BE]/10 shrink-0">
                  <HeartPulse className="h-5 w-5 text-[#5BC0BE]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{m.condition}</p>
                  <p className="text-xs text-muted-foreground">{m.status} {m.diagnosedAt ? `• ${new Date(m.diagnosedAt).toLocaleDateString()}` : ""}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ type: "medical", id: m.id, name: m.condition })}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all shrink-0"
                  title="Remove condition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Past Surgical History ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Syringe className="h-5 w-5 text-[#6B9CFF]" /> Past Surgical History
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-dashed border-[#6B9CFF]/50 text-[#6B9CFF] hover:bg-[#6B9CFF]/10"
            onClick={() => setOpenDialog("surgical")}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {surgicalHistory.length === 0 ? (
          <EmptyState icon={Syringe} title="No surgical history" description="No past surgeries recorded." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {surgicalHistory.map((s) => (
              <div key={s.id} className="p-4 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] flex items-center gap-4 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B9CFF]/10 shrink-0">
                  <Syringe className="h-5 w-5 text-[#6B9CFF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{s.procedure}</p>
                  <p className="text-xs text-muted-foreground">{s.performedAt ? new Date(s.performedAt).toLocaleDateString() : "No date specified"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ type: "surgical", id: s.id, name: s.procedure })}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all shrink-0"
                  title="Remove procedure"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Dialog (controlled) ── */}
      <Dialog open={openDialog !== null} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className="dark:bg-[#223247]">
          <DialogHeader>
            <DialogTitle>{openDialog ? dialogTitles[openDialog] : ""}</DialogTitle>
            <DialogDescription className="sr-only">{openDialog ? dialogDescriptions[openDialog] : ""}</DialogDescription>
          </DialogHeader>
          {openDialog && renderForm(openDialog)}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          target={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}
    </div>
  )
}