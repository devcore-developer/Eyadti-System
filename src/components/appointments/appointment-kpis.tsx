import { CalendarCheck, Clock, CheckCircle, XCircle } from "lucide-react"

interface AppointmentKPIsProps {
  today: number
  upcoming: number
  completed: number
  cancelled: number
}

export function AppointmentKPIs({ today, upcoming, completed, cancelled }: AppointmentKPIsProps) {
  const kpiData = [
    { title: "Today's Appointments", value: today, icon: CalendarCheck, accent: "text-[#5BC0BE]", iconBg: "bg-[#5BC0BE]/10", lightBg: "from-[#F5FFFF] to-[#EAFBF9]", shadow: "shadow-[0_15px_35px_rgba(91,192,190,0.12)]" },
    { title: "Upcoming", value: upcoming, icon: Clock, accent: "text-[#6B9CFF]", iconBg: "bg-[#6B9CFF]/10", lightBg: "from-[#F8FFFF] to-[#EDF9FF]", shadow: "shadow-[0_15px_35px_rgba(107,156,255,0.12)]" },
    { title: "Completed", value: completed, icon: CheckCircle, accent: "text-[#6BCB77]", iconBg: "bg-[#6BCB77]/10", lightBg: "from-[#F5FFF5] to-[#EAFFEA]", shadow: "shadow-[0_15px_35px_rgba(107,214,123,0.12)]" },
    { title: "Cancelled", value: cancelled, icon: XCircle, accent: "text-[#EF6B6B]", iconBg: "bg-[#EF6B6B]/10", lightBg: "from-[#FFF5F5] to-[#FFEAEA]", shadow: "shadow-[0_15px_35px_rgba(239,107,107,0.12)]" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div key={index} className={`p-6 rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br ${kpi.lightBg} dark:from-[#223247] dark:to-[#1D2A3B] ${kpi.shadow} transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg animate-scale-in`}>
            <div className={`p-3 rounded-xl ${kpi.iconBg} w-fit mb-4`}>
              <Icon className={`h-6 w-6 ${kpi.accent}`} />
            </div>
            <h3 className="text-[32px] font-bold text-foreground">{kpi.value}</h3>
            <p className="text-sm font-medium text-muted-foreground mt-1">{kpi.title}</p>
          </div>
        )
      })}
    </div>
  )
}