"use client"

import { UserCheck, Clock, UserX, LogOut, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface AttendanceStats {
  totalDoctors: number
  present: number
  late: number
  absent: number
  finished: number
  branchCoverage: { branchId: string; branchName: string; doctorCount: number }[]
}

interface AttendanceKPIsProps {
  stats: AttendanceStats
}

const cards = [
  { key: "present" as const, label: "Present", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/30" },
  { key: "late" as const, label: "Late", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800/30" },
  { key: "absent" as const, label: "Absent", icon: UserX, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700/30" },
  { key: "finished" as const, label: "Checked Out", icon: LogOut, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/30" },
]

export function AttendanceKPIs({ stats }: AttendanceKPIsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-[#5BC0BE]" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Today&apos;s Attendance</h3>
        <span className="text-xs text-muted-foreground">
          {stats.present + stats.late + stats.finished}/{stats.totalDoctors} active
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          const value = stats[card.key]
          return (
            <div
              key={card.key}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                card.bg, card.border
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", card.color)} />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{value}</p>
                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Branch Coverage */}
      {stats.branchCoverage.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.branchCoverage.map((b) => (
            <div
              key={b.branchId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 text-xs"
            >
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium text-foreground">{b.branchName}</span>
              <span className="text-muted-foreground">({b.doctorCount} doctors)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}