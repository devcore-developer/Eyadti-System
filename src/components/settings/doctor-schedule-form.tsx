"use client"

import { useState, useEffect } from "react"
import { getDoctorSchedules, updateDoctorSchedules, updateDoctorCapacity } from "@/lib/actions/settings"
import { type DoctorScheduleInput } from "@/lib/validations/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, CalendarClock, Clock, Users } from "lucide-react"
import { showSuccess, showError } from "@/components/shared/feedback-toast"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

interface Doctor {
  id: string
  name: string
  appointmentDuration?: number | null
  maxDailyAppointments?: number | null
}

interface DoctorScheduleFormProps {
  doctors: Doctor[]
  isReadOnly: boolean
}

export function DoctorScheduleForm({ doctors, isReadOnly }: DoctorScheduleFormProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>(doctors[0]?.id || "")
  const [schedules, setSchedules] = useState<DoctorScheduleInput[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [duration, setDuration] = useState<number>(30)
  const [maxAppointments, setMaxAppointments] = useState<number>(20)

  // ✨ استخراج بيانات الدكتور المختار عشان نعرض اسمه بشكل صحيح في الـ Trigger
  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor)

  useEffect(() => {
    if (selectedDoctor) {
      setIsLoading(true)
      getDoctorSchedules(selectedDoctor).then((data) => {
        setSchedules(data as any)
        setIsLoading(false)
      })
      
      const doc = doctors.find(d => d.id === selectedDoctor)
      setDuration(doc?.appointmentDuration || 30)
      setMaxAppointments(doc?.maxDailyAppointments || 20)
    }
  }, [selectedDoctor, doctors])

  const handleChange = (index: number, field: keyof DoctorScheduleInput, value: any) => {
    const updated = [...schedules]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "isAvailable" && value === false) {
      updated[index].startTime = "00:00"
      updated[index].endTime = "00:00"
    }
    setSchedules(updated)
  }

  const onSubmit = async () => {
    setIsSubmitting(true)
    try {
      const scheduleResult = await updateDoctorSchedules(selectedDoctor, schedules)
      const capacityResult = await updateDoctorCapacity(selectedDoctor, duration, maxAppointments)

      if (scheduleResult.success && capacityResult.success) {
        showSuccess("Schedule Updated", "Doctor schedule and capacity saved successfully.")
      } else {
        showError("Failed to save", scheduleResult.error || capacityResult.error || "An unexpected error occurred.")
      }
    } catch (error) {
      showError("Something went wrong", "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (doctors.length === 0) return null

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[rgba(107,156,255,0.1)]">
            <CalendarClock className="h-5 w-5 text-[#6B9CFF]" />
          </div>
          <div>
            <h2 className="text-card-title text-foreground">Doctor Schedules</h2>
            <p className="text-body text-muted-foreground">Manage individual doctor availability.</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <Label className="text-sm font-semibold">Select Doctor</Label>
          <Select value={selectedDoctor} onValueChange={(val) => setSelectedDoctor(val || "")}>
            <SelectTrigger className="w-full md:w-1/3 mt-2 rounded-xl h-11">
              {/* ✨ الحل: عرض اسم الدكتور صراحة بدل ما نعتمد على الـ Radix Auto-extract */}
              <SelectValue placeholder="Choose a doctor...">
                {selectedDoctorData ? `Dr. ${selectedDoctorData.name}` : "Choose a doctor..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {doctors.map((doc) => (
                <SelectItem key={doc.id} value={doc.id} className="rounded-lg cursor-pointer">
                  Dr. {doc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Premium KPIs for Schedule Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#F5FFFF] dark:bg-[#1D2A3B]/50 border border-[rgba(91,192,190,0.1)] transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-[#5BC0BE]" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration</span>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={isReadOnly}
                className="text-lg font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 shadow-none"
              />
              <span className="text-sm text-muted-foreground font-medium">min</span>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#1D2A3B]/50 border border-[rgba(107,156,255,0.1)] transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#6B9CFF]" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Max Daily</span>
            </div>
            <Input 
              type="number" 
              value={maxAppointments}
              onChange={(e) => setMaxAppointments(Number(e.target.value))}
              disabled={isReadOnly}
              className="text-lg font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 shadow-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-[#6B9CFF]" /></div>
        ) : (
          <div className="space-y-3">
            {schedules.map((day, index) => (
              <div key={day.dayOfWeek} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#223247]/50 border border-[rgba(148,163,184,0.05)] hover:shadow-sm transition-all">
                <div className="w-24 shrink-0">
                  <Label className="font-semibold text-sm">{DAYS[day.dayOfWeek]}</Label>
                </div>
                
                {/* ✨ استبدال الـ Checkbox بـ Premium Switch */}
                <div className="flex items-center gap-2">
                  <Switch
                    id={`dayoff-${day.dayOfWeek}`}
                    checked={!day.isAvailable}
                    onCheckedChange={(checked) => handleChange(index, "isAvailable", !checked)}
                    disabled={isReadOnly}
                    className="data-[state=checked]:bg-[#EF6B6B]"
                  />
                  <Label htmlFor={`dayoff-${day.dayOfWeek}`} className="text-xs text-muted-foreground cursor-pointer">Day Off</Label>
                </div>

                {day.isAvailable ? (
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => handleChange(index, "startTime", e.target.value)}
                      disabled={isReadOnly}
                      className="w-32 rounded-xl h-10"
                    />
                    <span className="text-muted-foreground text-xs font-medium">to</span>
                    <Input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => handleChange(index, "endTime", e.target.value)}
                      disabled={isReadOnly}
                      className="w-32 rounded-xl h-10"
                    />
                  </div>
                ) : (
                  <p className="sm:ml-auto text-xs text-[#EF6B6B] font-semibold bg-[#EF6B6B]/10 px-3 py-1 rounded-full">Day Off</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!isReadOnly && selectedDoctor && (
          <div className="flex justify-end pt-2">
            <Button 
              onClick={onSubmit} 
              disabled={isSubmitting} 
              isLoading={isSubmitting}
              className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white rounded-xl shadow-[0_4px_12px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 px-6"
            >
              <Save className="h-4 w-4" />
              Save Schedule
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}