// src/components/settings/working-hours-form.tsx

"use client"

import { useState } from "react"
import { updateWorkingHours } from "@/lib/actions/settings"
import { type WorkingHoursInput } from "@/lib/validations/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Clock } from "lucide-react"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

interface WorkingHoursFormProps {
  clinicId: string
  initialData: WorkingHoursInput[]
  isReadOnly: boolean
}

export function WorkingHoursForm({ clinicId, initialData, isReadOnly }: WorkingHoursFormProps) {
  const [hours, setHours] = useState<WorkingHoursInput[]>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (index: number, field: keyof WorkingHoursInput, value: any) => {
    const updated = [...hours]
    updated[index] = { ...updated[index], [field]: value }
    
    if (field === "isClosed" && value === true) {
      updated[index].startTime = "00:00"
      updated[index].endTime = "00:00"
    }
    setHours(updated)
  }

  const onSubmit = async () => {
    setIsSubmitting(true)
    const result = await updateWorkingHours(clinicId, hours)
    if (result.success) {
      alert("Working hours saved successfully!")
    } else {
      alert(result.error || "Failed to save")
    }
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-teal-600" />
          <div>
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>Define your clinic's operating schedule.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hours.map((day, index) => (
          <div key={day.dayOfWeek} className="flex items-center gap-4 p-3 border rounded-lg bg-card">
            <div className="w-24">
              <Label className="font-semibold text-sm">{DAYS[day.dayOfWeek]}</Label>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Closed?</span>
              <input
                type="checkbox"
                checked={day.isClosed}
                onChange={(e) => handleChange(index, "isClosed", e.target.checked)}
                disabled={isReadOnly}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
            </div>

            {!day.isClosed ? (
              <div className="flex items-center gap-2 ml-auto">
                <Input
                  type="time"
                  value={day.startTime}
                  onChange={(e) => handleChange(index, "startTime", e.target.value)}
                  disabled={isReadOnly}
                  className="w-32"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={day.endTime}
                  onChange={(e) => handleChange(index, "endTime", e.target.value)}
                  disabled={isReadOnly}
                  className="w-32"
                />
              </div>
            ) : (
              <p className="ml-auto text-xs text-red-500 font-medium">Closed</p>
            )}
          </div>
        ))}

        {!isReadOnly && (
          <div className="flex justify-end pt-2">
            <Button onClick={onSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Hours
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}