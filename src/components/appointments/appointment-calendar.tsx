"use client"

import { useState } from "react"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { Clock, User, Stethoscope, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const timeSlots = ["08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "04:00 PM"]

const mockAppointments: any = {
  "09:00 AM": { id: 1, patient: "Ahmed Hassan", doctor: "Dr. Ali", status: "CONFIRMED", type: "Checkup" },
  "10:00 AM": { id: 2, patient: "Sara Mostafa", doctor: "Dr. Sara", status: "SCHEDULED", type: "Follow-up" },
  "01:00 PM": { id: 3, patient: "Mike Ross", doctor: "Dr. Ahmed", status: "COMPLETED", type: "Consultation" },
}

export function AppointmentCalendar() {
  const [view, setView] = useState("daily")

  return (
    <div className="rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] shadow-[0_15px_35px_rgba(100,116,139,0.10)] overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Today's Schedule</h2>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium px-2">Oct 26, 2023</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        
        <div className="flex items-center bg-muted/30 dark:bg-[#1D2A3B]/50 p-1 rounded-xl">
          {["daily", "weekly", "monthly"].map((v) => (
            <button 
              key={v} 
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${view === v ? "bg-white dark:bg-[#223247] text-foreground shadow-sm text-[#6B9CFF]" : "text-muted-foreground hover:text-foreground"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="relative">
          {timeSlots.map((time) => {
            const appointment = mockAppointments[time]
            return (
              <div key={time} className="flex items-start gap-6 min-h-[70px] group">
                {/* Time Label */}
                <div className="w-24 pt-2 text-sm font-medium text-muted-foreground text-right shrink-0">
                  {time}
                </div>
                
                {/* Slot Line & Content */}
                <div className="flex-1 border-t border-dashed border-[rgba(148,163,184,0.2)] dark:border-[rgba(255,255,255,0.05)] relative pt-2 pb-4">
                  {appointment ? (
                    <div className="absolute top-0 left-0 w-full p-4 rounded-[16px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.06)] hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#5BC0BE]" />
                          <span className="text-sm font-semibold text-foreground">{appointment.patient}</span>
                        </div>
                        <AppointmentStatusBadge status={appointment.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {appointment.doctor}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {appointment.type}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full w-full rounded-xl border border-dashed border-transparent group-hover:border-[#6B9CFF]/20 transition-colors cursor-pointer hover:bg-[#6B9CFF]/5" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}