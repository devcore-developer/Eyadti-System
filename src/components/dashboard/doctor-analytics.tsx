// src/components/dashboard/doctor-analytics.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Doctor Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {doctors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No doctor data available</p>
          ) : (
            doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card"
              >
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className="bg-teal-50 text-teal-700 text-xs font-semibold">
                    {doctor.name
                      .replace("Dr. ", "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{doctor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doctor.specialization || "General"}
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="text-center">
                    <p className="font-bold text-foreground">{doctor.patientCount}</p>
                    <p>Patients</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">{doctor.appointmentCount}</p>
                    <p>Appts</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}