"use client"

import { searchTreatmentTemplates, searchDrugs } from "@/lib/actions/medical-dictionary"
import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input"
import { ClipboardList, Pill, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

type Props = {
  treatmentPlans: string[]
  setTreatmentPlans: React.Dispatch<React.SetStateAction<string[]>>
}

export function TreatmentTemplateSelector({ treatmentPlans, setTreatmentPlans }: Props) {
  const [activeTab, setActiveTab] = useState<"template" | "drug">("drug")

  // ── Template Search ─────────────────────────────
  async function handleTemplateSearch(query: string): Promise<AutocompleteOption[]> {
    const data = await searchTreatmentTemplates(query)
    return data.map((d: any) => ({
      id: d.id,
      label: d.title,
      sublabel: d.specialty || undefined,
      data: d.content,
    }))
  }

  function handleTemplateSelect(option: AutocompleteOption) {
    if (option.data) {
      const lines = (option.data as string).split("\n").filter((l: string) => l.trim() !== "")
      const newPlans = lines.filter((l: string) => !treatmentPlans.includes(l.trim()))
      setTreatmentPlans(prev => [...prev, ...newPlans.map((l: string) => l.trim())])
    }
  }

  // ── Drug Search ─────────────────────────────────
  async function handleDrugSearch(query: string): Promise<AutocompleteOption[]> {
    const data = await searchDrugs(query)
    return data.map((d: any) => ({
      id: d.id,
      label: d.name,
      sublabel: d.genericName,
      detail: `${d.dosage || ""} ${d.form || ""}`.trim() || undefined,
      data: d,
    }))
  }

  function handleDrugSelect(option: AutocompleteOption) {
    const drug = option.data
    if (!drug) return

    // بناء سطر الدواء بالصيغة الطبية
    let drugLine = `${drug.name} ${drug.dosage || ""}`.trim()
    if (drug.form) drugLine += ` (${drug.form})`
    if (drug.notes) drugLine += ` — ${drug.notes}`

    if (!treatmentPlans.includes(drugLine)) {
      setTreatmentPlans(prev => [...prev, drugLine])
    }
  }

  function handleCustomAdd(value: string) {
    if (!treatmentPlans.includes(value)) {
      setTreatmentPlans(prev => [...prev, value])
    }
  }

  function removePlan(index: number) {
    setTreatmentPlans(prev => prev.filter((_, i: number) => i !== index))
  }

  function editPlan(index: number, newValue: string) {
    setTreatmentPlans(prev => {
      const updated = [...prev]
      updated[index] = newValue
      return updated
    })
  }

  function addEmptyPlan() {
    setTreatmentPlans(prev => [...prev, ""])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ClipboardList className="h-4 w-4 text-amber-500" /> Treatment Plan (Rx) <span className="text-red-500">*</span>
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={addEmptyPlan} className="text-xs text-amber-600 hover:text-amber-700">
          <Plus className="h-3 w-3 mr-1" /> Add Line
        </Button>
      </div>

      {/* Tabs: Drug vs Template */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("drug")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeTab === "drug"
              ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pill className="h-3.5 w-3.5" /> Egyptian Drug Search
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("template")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeTab === "template"
              ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" /> Treatment Template
        </button>
      </div>

      {/* Search Input */}
      {activeTab === "drug" ? (
        <AutocompleteInput
          searchFn={handleDrugSearch}
          onSelect={handleDrugSelect}
          onCustomAdd={handleCustomAdd}
          placeholder="Search drug name (e.g. Panadol, Augmentin, Losec)..."
          icon={<Pill className="h-4 w-4" />}
        />
      ) : (
        <AutocompleteInput
          searchFn={handleTemplateSearch}
          onSelect={handleTemplateSelect}
          onCustomAdd={handleCustomAdd}
          placeholder="Search template (e.g. Acute Gastritis)..."
          icon={<ClipboardList className="h-4 w-4" />}
        />
      )}

      {/* Treatment Plan Lines */}
      {treatmentPlans.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border/50 bg-white/30 dark:bg-slate-800/20 p-3">
          {treatmentPlans.map((plan, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground font-mono w-5 text-right shrink-0">{index + 1}.</span>
              <Input
                value={plan}
                onChange={(e) => editPlan(index, e.target.value)}
                className="h-8 text-sm bg-white/50 dark:bg-slate-800/50 border-0 shadow-none focus-visible:ring-1"
                placeholder="Treatment detail..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePlan(index)}
                className="shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}