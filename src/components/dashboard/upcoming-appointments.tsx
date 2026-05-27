import { Clock, Stethoscope, CalendarCheck } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"

// 1. تعريف الـ Type بنفس شكل الداتابيز
type Appointment = {
  id: string
  dateTime: Date
  status: string
  patientName: string
  doctorName: string
}

interface UpcomingAppointmentsProps {
  appointments?: Appointment[]
}

export function UpcomingAppointments({ appointments = [] }: UpcomingAppointmentsProps) {
  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_12px_30px_rgba(100,116,139,0.10)] animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Upcoming</h3>
        <button className="text-sm text-[#6B9CFF] hover:underline">View All</button>
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No upcoming appointments" description="Your schedule is clear for now." className="py-8" />
        ) : (
          appointments.map((apt) => (
            <div 
              key={apt.id} 
              className="p-4 rounded-[16px] bg-[rgba(107,156,255,0.05)] hover:bg-[rgba(107,156,255,0.08)] transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-foreground">{apt.patientName}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(107,156,255,0.1)] text-[#6B9CFF]">{apt.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {format(new Date(apt.dateTime), "h:mm a")}
                </div>
                <div className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" /> {apt.doctorName}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}