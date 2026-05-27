"use client"

import { searchDiagnoses } from "@/lib/actions/medical-dictionary"
import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input"
import { Stethoscope, X } from "lucide-react"

type Props = {
  diagnoses: string[]
  setDiagnoses: React.Dispatch<React.SetStateAction<string[]>>
}

export function DiagnosisSelector({ diagnoses, setDiagnoses }: Props) {
  async function handleSearch(query: string): Promise<AutocompleteOption[]> {
    const data = await searchDiagnoses(query)
    return data.map(d => ({
      id: d.id,
      label: d.name,
      sublabel: d.icd10Code || undefined, // عرض كود ICD-10 بجانب التشخيص
    }))
  }

  function handleSelect(option: AutocompleteOption) {
    const name = option.label
    if (!diagnoses.includes(name)) {
      setDiagnoses(prev => [...prev, name])
    }
  }

  function handleCustomAdd(value: string) {
    if (!diagnoses.includes(value)) {
      setDiagnoses(prev => [...prev, value])
    }
  }

  function removeDiagnosis(index: number) {
    setDiagnoses(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Stethoscope className="h-4 w-4 text-teal-500" /> Diagnoses <span className="text-red-500">*</span>
      </label>

      <AutocompleteInput
        searchFn={handleSearch}
        onSelect={handleSelect}
        onCustomAdd={handleCustomAdd}
        placeholder="Type diagnosis (e.g. Hypertension)..."
        icon={<Stethoscope className="h-4 w-4" />}
      />

      {/* Selected Diagnoses Tags */}
      {diagnoses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {diagnoses.map((d, index) => (
            <span 
              key={index} 
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-950/30 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-400 ring-1 ring-inset ring-teal-600/20"
            >
              {d}
              <button type="button" onClick={() => removeDiagnosis(index)} className="hover:text-teal-900 dark:hover:text-teal-300">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}