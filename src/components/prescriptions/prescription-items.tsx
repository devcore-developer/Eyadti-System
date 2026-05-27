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

function getSmartDefaults(drug: any): { frequency: string; duration: string } {
  const category = (drug.category || "").toLowerCase()
  const notes = (drug.notes || "").toLowerCase()
  const form = (drug.form || "").toLowerCase()
  const name = (drug.name || "").toLowerCase()

  // Antibiotics
  if (category.includes("antibiotic")) {
    if (category.includes("injection")) return { frequency: "Once or twice daily", duration: "5-7 days" }
    if (name.includes("zithromax") || name.includes("azithromycin")) return { frequency: "Once daily", duration: "3-5 days" }
    if (name.includes("doxymycin") || name.includes("doxycycline")) return { frequency: "Twice daily", duration: "7-10 days" }
    if (name.includes("flagyl") || name.includes("metronidazole")) return { frequency: "Three times daily", duration: "5-7 days" }
    if (name.includes("tavanic") || name.includes("levofloxacin")) return { frequency: "Once daily", duration: "5-7 days" }
    return { frequency: "Twice daily", duration: "7 days" }
  }

  // NSAIDs / Analgesics
  if (category.includes("nsaid") || category.includes("analgesic")) {
    if (category.includes("opioid")) return { frequency: "Every 4-6 hours as needed", duration: "3-5 days" }
    if (name.includes("solpadeine")) return { frequency: "Every 4-6 hours as needed", duration: "3-5 days" }
    if (name.includes("cataflam") || name.includes("voltaren")) return { frequency: "Two to three times daily", duration: "5-7 days" }
    if (name.includes("mobic")) return { frequency: "Once daily", duration: "7-14 days" }
    if (name.includes("celebrex")) return { frequency: "Once or twice daily", duration: "7-14 days" }
    if (name.includes("panadol extra")) return { frequency: "Every 4-6 hours as needed", duration: "3-5 days" }
    if (name.includes("panadol cold")) return { frequency: "Every 4-6 hours as needed", duration: "3-5 days" }
    return { frequency: "Every 6 hours as needed", duration: "5-7 days" }
  }

  // Opioid
  if (category.includes("opioid")) return { frequency: "Every 4-6 hours as needed", duration: "3-5 days" }

  // PPIs
  if (category.includes("ppi")) return { frequency: "Once daily before breakfast", duration: "4-8 weeks" }

  // Anti-emetic
  if (category.includes("anti-emetic")) return { frequency: "Three times daily before meals", duration: "3-5 days" }

  // Antacid
  if (category.includes("antacid")) return { frequency: "After meals and at bedtime", duration: "2 weeks" }

  // Antispasmodic
  if (category.includes("antispasmodic")) return { frequency: "Three times daily before meals", duration: "5-7 days" }

  // Antidiarrheal
  if (category.includes("antidiarrheal")) return { frequency: "After each loose stool", duration: "2-3 days" }

  // Laxative
  if (category.includes("laxative")) return { frequency: "Once daily", duration: "1-2 weeks" }

  // Mucolytic
  if (category.includes("mucolytic")) return { frequency: "Three times daily", duration: "5-7 days" }

  // Antitussive
  if (category.includes("antitussive")) return { frequency: "Three times daily", duration: "3-5 days" }

  // Antifungal
  if (category.includes("antifungal")) {
    if (form.includes("cream")) return { frequency: "Apply twice daily", duration: "2-4 weeks" }
    return { frequency: "As directed", duration: "7-14 days" }
  }

  // Topical Antibiotic
  if (category.includes("topical") && category.includes("antibiotic")) return { frequency: "Apply three times daily", duration: "5-7 days" }

  // Topical Corticosteroid
  if (category.includes("topical") && category.includes("corticosteroid")) return { frequency: "Apply once or twice daily", duration: "1-2 weeks" }

  // Moisturizer
  if (category.includes("moisturizer")) return { frequency: "Apply as needed", duration: "Ongoing" }

  // Anti-acne
  if (category.includes("anti-acne")) {
    if (form.includes("gel")) return { frequency: "Apply at night", duration: "6-8 weeks" }
    return { frequency: "Once daily with food", duration: "4-6 months" }
  }

  // Bronchodilator
  if (category.includes("bronchodilator")) return { frequency: "2 puffs every 4-6 hours as needed", duration: "As needed" }

  // Corticosteroid + Bronchodilator
  if (category.includes("corticosteroid") && category.includes("bronchodilator")) return { frequency: "2 puffs twice daily", duration: "Ongoing" }

  // Corticosteroid
  if (category.includes("corticosteroid")) {
    if (form.includes("nasal")) return { frequency: "2 sprays each nostril once daily", duration: "2-4 weeks" }
    if (form.includes("nebulizer")) return { frequency: "Once or twice daily", duration: "5-7 days" }
    if (form.includes("eye")) return { frequency: "1 drop 4 times daily", duration: "5-7 days" }
    return { frequency: "Once daily", duration: "As directed" }
  }

  // Antihistamine
  if (category.includes("antihistamine")) {
    if (category.includes("decongestant")) return { frequency: "Once daily", duration: "5-7 days" }
    return { frequency: "Once daily", duration: "2-4 weeks" }
  }

  // Cold & Flu
  if (category.includes("cold")) return { frequency: "Every 6 hours as needed", duration: "3-5 days" }

  // Cardiovascular
  if (category.includes("beta blocker")) return { frequency: "Once daily", duration: "Ongoing" }
  if (category.includes("calcium")) return { frequency: "Once daily", duration: "Ongoing" }
  if (category.includes("ace")) return { frequency: "Once daily", duration: "Ongoing" }
  if (category.includes("arb")) return { frequency: "Once daily", duration: "Ongoing" }
  if (category.includes("antiplatelet")) return { frequency: "Once daily after meals", duration: "Ongoing" }
  if (category.includes("diuretic")) return { frequency: "Once daily in the morning", duration: "Ongoing" }
  if (category.includes("vasodilator")) {
    if (form.includes("spray")) return { frequency: "Sublingual for acute chest pain", duration: "As needed" }
    return { frequency: "As directed", duration: "Ongoing" }
  }

  // Antidiabetic
  if (category.includes("antidiabetic")) {
    if (category.includes("insulin")) return { frequency: "As per doctor instructions", duration: "Ongoing" }
    if (name.includes("glucophage")) return { frequency: "Twice daily with meals", duration: "Ongoing" }
    if (name.includes("amaryl")) return { frequency: "Once daily with breakfast", duration: "Ongoing" }
    return { frequency: "Once daily", duration: "Ongoing" }
  }

  // Thyroid
  if (category.includes("thyroid")) return { frequency: "Once daily on empty stomach", duration: "Ongoing" }
  if (category.includes("antithyroid")) return { frequency: "Once or twice daily", duration: "6-18 months" }

  // Neurology
  if (category.includes("anticonvulsant") || category.includes("neuropathic")) return { frequency: "Twice daily", duration: "As directed" }
  if (category.includes("antimigraine")) return { frequency: "At migraine onset", duration: "As needed" }

  // Psychiatry
  if (category.includes("ssri") || category.includes("antidepressant")) return { frequency: "Once daily", duration: "6+ months" }
  if (category.includes("anxiolytic") || category.includes("benzodiazepine")) return { frequency: "As needed", duration: "Short-term only" }
  if (category.includes("hypnotic")) return { frequency: "At bedtime", duration: "2-4 weeks" }

  // Urology
  if (category.includes("alpha")) return { frequency: "Once daily after meal", duration: "Ongoing" }
  if (category.includes("antimuscarinic")) return { frequency: "Once daily", duration: "Ongoing" }

  // Vitamins & Supplements
  if (category.includes("vitamin") || category.includes("supplement") || category.includes("iron")) {
    if (notes.includes("weekly")) return { frequency: "Once weekly", duration: "8 weeks" }
    return { frequency: "Once daily", duration: "1-3 months" }
  }

  // Eye drops
  if (form.includes("eye")) return { frequency: "1-2 drops every 4 hours", duration: "5-7 days" }

  // Artificial tears
  if (category.includes("artificial")) return { frequency: "As needed", duration: "Ongoing" }

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
      label: d.name,
      sublabel: d.genericName,
      detail: `${d.dosage || ""} ${d.form || ""}`.trim() || undefined,
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
      medicationName: drug.name,
      dosage: drug.dosage || "",
      frequency: smartDefaults.frequency,
      duration: smartDefaults.duration,
      instructions: drug.notes || "",
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
                placeholder="Search Egyptian drug (e.g. Panadol, Augmentin, Losec)..."
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