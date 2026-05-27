"use client"

import { useState } from "react"
import { searchDrugs } from "@/lib/actions/medical-dictionary"
import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input"
import { Pill, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type PrescriptionItemInput = {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

type Props = {
  items: PrescriptionItemInput[]
  setItems: React.Dispatch<React.SetStateAction<PrescriptionItemInput[]>>
}

const emptyItem: PrescriptionItemInput = {
  medicationName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
}

function getSmartDefaults(med: any): { frequency: string; duration: string } {
  const name = (med.tradeName || "").toLowerCase()
  const form = (med.dosageForm || "").toLowerCase()

  // Antibiotics
  if (name.includes("augmentin") || name.includes("amoxil") || name.includes("keflex")) return { frequency: "Twice daily", duration: "7 days" }
  if (name.includes("zithromax")) return { frequency: "Once daily", duration: "3-5 days" }
  if (name.includes("doxymycin")) return { frequency: "Twice daily", duration: "7-10 days" }
  if (name.includes("flagyl")) return { frequency: "Three times daily", duration: "5-7 days" }
  if (name.includes("tavanic") || name.includes("ciprobay")) return { frequency: "Once daily", duration: "5-7 days" }

  // Analgesics / NSAIDs
  if (name.includes("panadol extra") || name.includes("solpadeine")) return { frequency: "Every 4-6 hours as needed", duration: "3-5 days" }
  if (name.includes("panadol")) return { frequency: "Every 6 hours as needed", duration: "3-5 days" }
  if (name.includes("brufen") || name.includes("cataflam") || name.includes("voltaren")) return { frequency: "Two to three times daily", duration: "5-7 days" }
  if (name.includes("mobic") || name.includes("celebrex")) return { frequency: "Once daily", duration: "7-14 days" }

  // PPIs
  if (name.includes("losec") || name.includes("nexium") || name.includes("controloc")) return { frequency: "Once daily before breakfast", duration: "4-8 weeks" }

  // Antihistamines
  if (name.includes("zyrtec") || name.includes("cetrine") || name.includes("telfast")) return { frequency: "Once daily", duration: "2-4 weeks" }
  if (name.includes("clarinase")) return { frequency: "Once daily", duration: "5-7 days" }

  // Respiratory
  if (name.includes("ventolin")) return { frequency: "2 puffs as needed", duration: "As needed" }
  if (name.includes("symbicort") || name.includes("seretide")) return { frequency: "2 puffs twice daily", duration: "Ongoing" }
  if (name.includes("mucosolvan")) return { frequency: "Three times daily", duration: "5-7 days" }

  // Cardiovascular / Chronic
  if (name.includes("concor") || name.includes("norvasc") || name.includes("amlor") || name.includes("zestril") || name.includes("cozaar")) return { frequency: "Once daily", duration: "Ongoing" }
  if (name.includes("aspirin protect") || name.includes("plavix")) return { frequency: "Once daily", duration: "Ongoing" }

  // Diabetes
  if (name.includes("glucophage") || name.includes("amaryl") || name.includes("januvia") || name.includes("galvus")) return { frequency: "Once or twice daily", duration: "Ongoing" }

  // Dermatology
  if (form.includes("cream") || form.includes("gel") || form.includes("ointment")) return { frequency: "Apply twice daily", duration: "1-2 weeks" }

  // Eye/Ear drops
  if (form.includes("drop")) return { frequency: "1-2 drops three times daily", duration: "5-7 days" }

  // Syrups
  if (form.includes("syrup")) return { frequency: "Three times daily", duration: "5-7 days" }

  // Default
  return { frequency: "As directed", duration: "As directed" }
}

export function PrescriptionItems({ items, setItems }: Props) {
  function addItem() {
    setItems(prev => [...prev, { ...emptyItem }])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function handleChange(index: number, field: keyof PrescriptionItemInput, value: string) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  function clearMedication(index: number) {
    const newItems = [...items]
    newItems[index] = { ...emptyItem }
    setItems(newItems)
  }

  async function handleDrugSearch(query: string): Promise<AutocompleteOption[]> {
    const data = await searchDrugs(query)
    return data.map((d: any) => ({
      id: d.id,
      label: d.tradeName, // تم التعديل لـ tradeName
      sublabel: d.genericName,
      detail: `${d.strength || ""} ${d.dosageForm || ""}`.trim() || undefined,
      data: d,
    }))
  }

  function handleDrugSelect(index: number, option: AutocompleteOption) {
    const drug = option.data
    if (!drug) {
      const newItems = [...items]
      newItems[index] = { ...newItems[index], medicationName: option.label }
      setItems(newItems)
      return
    }

    const smartDefaults = getSmartDefaults(drug)

    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      medicationName: drug.tradeName, // تم التعديل لـ tradeName
      dosage: drug.strength || "", // تم التعديل لـ strength
      frequency: smartDefaults.frequency,
      duration: smartDefaults.duration,
      instructions: "", // تمت إزالة notes من الـ Schema الجديد
    }
    setItems(newItems)
  }

  function handleCustomAdd(index: number, value: string) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], medicationName: value }
    setItems(newItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Pill className="h-4 w-4 text-blue-500" /> Medications <span className="text-red-500">*</span>
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-xs text-blue-600 hover:text-blue-700">
          <Plus className="h-3 w-3 mr-1" /> Add Medication
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border/50 bg-white/30 dark:bg-slate-800/20 p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">Rx #{index + 1}</span>
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Drug Search OR Selected Badge */}
            {item.medicationName ? (
              <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 truncate">
                    {item.medicationName}
                  </span>
                  {item.dosage && (
                    <span className="text-xs text-blue-500 dark:text-blue-400 shrink-0">
                      ({item.dosage})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => clearMedication(index)}
                  className="text-blue-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                  title="Change medication"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <AutocompleteInput
                searchFn={handleDrugSearch}
                onSelect={(option) => handleDrugSelect(index, option)}
                onCustomAdd={(value) => handleCustomAdd(index, value)}
                placeholder="Search medication (e.g. Panadol, Augmentin, Losec)..."
                icon={<Pill className="h-4 w-4" />}
              />
            )}

            {/* Dosage Fields - shown when medication is selected */}
            {item.medicationName && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Dosage</label>
                  <Input
                    value={item.dosage}
                    onChange={(e) => handleChange(index, "dosage", e.target.value)}
                    placeholder="e.g. 500mg, 1 tablet"
                    className="h-8 text-sm bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Frequency</label>
                  <Input
                    value={item.frequency}
                    onChange={(e) => handleChange(index, "frequency", e.target.value)}
                    placeholder="e.g. Twice daily, كل 8 ساعات"
                    className="h-8 text-sm bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Duration</label>
                  <Input
                    value={item.duration}
                    onChange={(e) => handleChange(index, "duration", e.target.value)}
                    placeholder="e.g. 7 days, 3 weeks"
                    className="h-8 text-sm bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Instructions</label>
                  <Input
                    value={item.instructions}
                    onChange={(e) => handleChange(index, "instructions", e.target.value)}
                    placeholder="e.g. After meals"
                    className="h-8 text-sm bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}