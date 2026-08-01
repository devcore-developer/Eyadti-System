import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Stethoscope } from "lucide-react"
import Link from "next/link"
type DoctorAnalyticsProps = {
  doctors: {
    id: string
    name: string
    specialization: string | null
    patientCount: number
    appointmentCount: number
  }[]
}

export function DoctorAnalytics({ doctors }: DoctorAnalyticsProps) {
  const maxAppointments = Math.max(...doctors.map(d => d.appointmentCount), 1)

  return (
    <Card className="bg-white dark:bg-[#223247] border-gray-200/60 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-4 pt-5 px-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#6B9CFF]/[0.08]">
            <Stethoscope className="h-4 w-4 text-[#6B9CFF]" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Top Doctors</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">{doctors.length} active</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-5 space-y-1">
        {doctors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No doctor data available</p>
        ) : (
          doctors.slice(0, 5).map((doctor) => {
            const pct = Math.round((doctor.appointmentCount / maxAppointments) * 100)
            return (
              <Link
                key={doctor.id}
                href="#"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer group"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-[#5BC0BE]/[0.15] to-[#6B9CFF]/[0.15] text-[#6B9CFF] text-[11px] font-bold">
                    {doctor.name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium truncate group-hover:text-[#6B9CFF] transition-colors">{doctor.name}</p>
                    <span className="text-sm font-bold text-foreground tabular-nums pl-2">{doctor.appointmentCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right shrink-0">{doctor.patientCount} pt</span>
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