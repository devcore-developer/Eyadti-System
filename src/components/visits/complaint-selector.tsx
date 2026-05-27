"use client"

import { searchComplaints } from "@/lib/actions/medical-dictionary"
import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input"
import { HeartPulse, X } from "lucide-react"

type Props = {
  complaints: string[]
  setComplaints: React.Dispatch<React.SetStateAction<string[]>>
}

export function ComplaintSelector({ complaints, setComplaints }: Props) {
  async function handleSearch(query: string): Promise<AutocompleteOption[]> {
    const data = await searchComplaints(query)
    return data.map(d => ({
      id: d.id,
      label: d.name,
    }))
  }

  function handleSelect(option: AutocompleteOption) {
    const name = option.label
    if (!complaints.includes(name)) {
      setComplaints(prev => [...prev, name])
    }
  }

  function handleCustomAdd(value: string) {
    if (!complaints.includes(value)) {
      setComplaints(prev => [...prev, value])
    }
  }

  function removeComplaint(index: number) {
    setComplaints(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <HeartPulse className="h-4 w-4 text-rose-500" /> Chief Complaints (CC) <span className="text-red-500">*</span>
      </label>

      <AutocompleteInput
        searchFn={handleSearch}
        onSelect={handleSelect}
        onCustomAdd={handleCustomAdd}
        placeholder="Type complaint (e.g. Headache)..."
        icon={<HeartPulse className="h-4 w-4" />}
      />

      {/* Selected Complaints Tags */}
      {complaints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {complaints.map((c, index) => (
            <span 
              key={index} 
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 ring-1 ring-inset ring-rose-600/20"
            >
              {c}
              <button type="button" onClick={() => removeComplaint(index)} className="hover:text-rose-900 dark:hover:text-rose-300">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}