"use client"

import { useState } from "react"
import { AutocompleteSearch } from "@/components/ui/autocomplete-search"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface SelectedMedication {
  id: string
  tradeName: string
  genericName: string | null
  strength: string | null
  dosageForm: string | null
}

export function MedicationSelector() {
  const [selectedMedication, setSelectedMedication] = useState<SelectedMedication | null>(null)

  const handleAddMedication = () => {
    if (!selectedMedication) return
    
    // هنا تضيف المنطق الخاص بإضافة الدواء لقائمة الأدوية في الوصفة
    console.log("Adding medication to prescription:", selectedMedication)
    
    // إعادة تعيين الحقل بعد الإضافة
    setSelectedMedication(null)
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Add Medication</label>
      <div className="flex gap-2">
        <div className="flex-1">
          <AutocompleteSearch
            endpoint="/api/medications/search"
            placeholder="Search medication (e.g., Panadol, Augmentin)..."
            displayField="tradeName"
            onSelect={(med: SelectedMedication) => setSelectedMedication(med)}
          />
        </div>
        <Button 
          type="button" 
          size="icon" 
          onClick={handleAddMedication}
          disabled={!selectedMedication}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedMedication && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
          Selected: <span className="font-semibold">{selectedMedication.tradeName}</span> 
          {selectedMedication.genericName && ` (${selectedMedication.genericName})`} 
          {selectedMedication.strength && ` - ${selectedMedication.strength}`}
        </div>
      )}
    </div>
  )
}