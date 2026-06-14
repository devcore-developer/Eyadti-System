// components/dashboard/upcoming-appointments.tsx
import { Clock, Stethoscope, CalendarCheck } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <Card className="premium-card animate-fade-in-up" style={{ animationDelay: '250ms' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming</CardTitle>
          <Link href="/appointments">
            <Button variant="ghost" size="sm" className="text-[#6B9CFF] hover:text-[#6B9CFF] hover:bg-[#6B9CFF]/10 text-xs font-semibold px-3 rounded-xl">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No upcoming appointments" description="Your schedule is clear for now." className="py-8" />
        ) : (
          appointments.map((apt, index) => (
            <div 
              key={apt.id} 
              className="p-4 rounded-2xl bg-[rgba(107,156,255,0.04)] dark:bg-[rgba(107,156,255,0.02)] border border-[rgba(107,156,255,0.06)] hover:bg-[rgba(107,156,255,0.08)] transition-colors duration-200 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${250 + (index * 50)}ms` }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <p className="font-semibold text-sm text-foreground truncate mr-2">{apt.patientName}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(107,156,255,0.1)] text-[#6B9CFF] border border-[rgba(107,156,255,0.1)]">{apt.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#6B9CFF]" /> {format(new Date(apt.dateTime), "h:mm a")}
                </div>
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-[#89D6D2]" /> {apt.doctorName}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}