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
    <Card className="bg-white dark:bg-[#223247] border-gray-100 dark:border-white/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[13px] font-semibold">Upcoming</CardTitle>
          <Link href="/appointments">
            <Button variant="ghost" size="sm" className="text-[#6B9CFF] hover:text-[#6B9CFF] hover:bg-[#6B9CFF]/[0.06] text-[11px] font-medium px-2.5 rounded-[8px] h-7">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2.5">
        {appointments.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No upcoming" description="Schedule is clear." className="py-8" />
        ) : (
          appointments.map((apt) => {
            const timeStr = format(new Date(apt.dateTime), "h:mm a")
            const dateStr = format(new Date(apt.dateTime), "MMM d")
            return (
              <Link
                key={apt.id}
                href={`/appointments/${apt.id}`}
                className="block px-4 py-3.5 rounded-xl bg-gray-50/60 dark:bg-white/[0.015] border border-gray-100/80 dark:border-white/[0.03] hover:bg-[#6B9CFF]/[0.03] hover:border-[#6B9CFF]/[0.1] transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <p className="font-semibold text-[13px] text-foreground group-hover:text-[#6B9CFF] transition-colors">{apt.patientName}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#6B9CFF]/[0.07] text-[#6B9CFF] border border-[#6B9CFF]/[0.08] shrink-0 whitespace-nowrap">
                    {apt.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-[#6B9CFF]/50" />
                    <span className="tabular-nums">{timeStr}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="h-3 w-3 text-[#89D6D2]/50" />
                    <span>{apt.doctorName}</span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}