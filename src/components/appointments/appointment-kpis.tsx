"use client"

import { Calendar, Clock, CheckCircle2, XCircle, UserX } from "lucide-react"

type Props = {
  today: number
  upcoming: number
  completed: number
  cancelled: number
  noShow?: number
}

const kpis = [
  { key: "today", label: "Today", icon: Calendar, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800" },
  { key: "upcoming", label: "Scheduled", icon: Clock, color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, color: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800 border-gray-200 dark:border-gray-700" },
  { key: "noShow", label: "Missed", icon: UserX, color: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50 border-red-200 dark:border-red-800" },
]

export function AppointmentKPIs({ today, upcoming, completed, cancelled, noShow = 0 }: Props) {
  const values: Record<string, number> = { today, upcoming, completed, cancelled, noShow }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          className={`flex items-center gap-3 rounded-xl border p-3 md:p-4 transition-all hover:shadow-sm ${kpi.color}`}
        >
          <kpi.icon className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-bold leading-none">{values[kpi.key]}</p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 truncate">{kpi.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}