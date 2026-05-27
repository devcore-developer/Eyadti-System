import { Clock } from "lucide-react"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { AppointmentStatus } from "@prisma/client"

type Appointment = {
  id: string
  dateTime: Date | string
  status: AppointmentStatus
  patient: { fullName: string }
}

interface TodayTimelineProps {
  appointments: Appointment[]
}

export function TodayTimeline({ appointments = [] }: TodayTimelineProps) {
  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_12px_30px_rgba(100,116,139,0.10)] animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-6">Today's Timeline</h3>
      
      {appointments.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No appointments for today.</div>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#5BC0BE]/30 via-[#6B9CFF]/30 to-transparent" />
          {appointments.map((apt, index) => (
            <div key={apt.id} className="relative flex items-center gap-4 mb-6 last:mb-0 group cursor-pointer">
              <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#223247] border-2 border-[#5BC0BE]/30 group-hover:scale-125 transition-transform">
                <div className="h-2 w-2 rounded-full bg-[#5BC0BE]" />
              </div>
              <div className="flex-1 p-3 rounded-xl bg-white/50 dark:bg-[#1D2A3B]/50 border border-[rgba(148,163,184,0.05)] hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{apt.patient.fullName}</p>
                  <AppointmentStatusBadge status={apt.status} size="sm" />
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> 
                  {/* استخدم الـ timeZone هنا عشان متحصلش فرق ساعة */}
                  {new Date(apt.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: "Africa/Cairo" })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}