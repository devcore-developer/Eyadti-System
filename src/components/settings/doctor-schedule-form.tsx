"use client"

import { useState, useEffect } from "react"
import { getDoctorSchedules, updateDoctorSchedules, updateDoctorCapacity } from "@/lib/actions/settings"
import { type DoctorScheduleInput } from "@/lib/validations/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, CalendarClock, Clock, Users } from "lucide-react"

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
  
  // الحقول الجديدة
  const [duration, setDuration] = useState<number>(30)
  const [maxAppointments, setMaxAppointments] = useState<number>(20)

  useEffect(() => {
    if (selectedDoctor) {
      setIsLoading(true)
      getDoctorSchedules(selectedDoctor).then((data) => {
        setSchedules(data as any)
        setIsLoading(false)
      })
      
      // تحديث الحقول الجديدة بناءً على الدكتور المختار
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
      // 1. حفظ جدول المواعيد (الأيام والساعات)
      const scheduleResult = await updateDoctorSchedules(selectedDoctor, schedules)
      
      // 2. حفظ الحد الأقصى والمدة (الـ Action الجديد)
      const capacityResult = await updateDoctorCapacity(selectedDoctor, duration, maxAppointments)

      if (scheduleResult.success && capacityResult.success) {
        alert("Schedule and capacity saved successfully!")
      } else {
        alert(scheduleResult.error || capacityResult.error || "Failed to save")
      }
    } catch (error) {
      alert("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (doctors.length === 0) return null

  return (
    <div className="rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)] overflow-hidden">
      <div className="p-6 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-[#6B9CFF]" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Doctor Schedules</h2>
            <p className="text-sm text-muted-foreground">Manage individual doctor availability.</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <Label>Select Doctor</Label>
          <Select value={selectedDoctor} onValueChange={(val: string | null) => { if (val) setSelectedDoctor(val) }}>
            <SelectTrigger className="w-full md:w-1/3 mt-1.5 rounded-xl">
              <SelectValue placeholder="Choose a doctor..." />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  Dr. {doc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Premium KPIs for Schedule Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-[16px] bg-[#F5FFFF] dark:bg-[#1D2A3B] border border-[rgba(91,192,190,0.1)]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-[#5BC0BE]" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</span>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={isReadOnly}
                className="text-lg font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </div>
          
          <div className="p-4 rounded-[16px] bg-[#F5F8FF] dark:bg-[#1D2A3B] border border-[rgba(107,156,255,0.1)]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#6B9CFF]" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Daily</span>
            </div>
            <Input 
              type="number" 
              value={maxAppointments}
              onChange={(e) => setMaxAppointments(Number(e.target.value))}
              disabled={isReadOnly}
              className="text-lg font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            {schedules.map((day, index) => (
              <div key={day.dayOfWeek} className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] hover:shadow-sm transition-all">
                <div className="w-24">
                  <Label className="font-semibold text-sm">{DAYS[day.dayOfWeek]}</Label>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Day Off?</span>
                  <input
                    type="checkbox"
                    checked={!day.isAvailable}
                    onChange={(e) => handleChange(index, "isAvailable", !e.target.checked)}
                    disabled={isReadOnly}
                    className="h-4 w-4 rounded border-gray-300 text-[#EF6B6B] focus:ring-[#EF6B6B]"
                  />
                </div>

                {day.isAvailable ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <Input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => handleChange(index, "startTime", e.target.value)}
                      disabled={isReadOnly}
                      className="w-32 rounded-xl"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => handleChange(index, "endTime", e.target.value)}
                      disabled={isReadOnly}
                      className="w-32 rounded-xl"
                    />
                  </div>
                ) : (
                  <p className="ml-auto text-xs text-[#EF6B6B] font-medium">Day Off</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!isReadOnly && selectedDoctor && (
          <div className="flex justify-end pt-2">
            <Button onClick={onSubmit} disabled={isSubmitting} className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white rounded-xl shadow-md">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Schedule
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}