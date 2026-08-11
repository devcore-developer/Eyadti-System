"use client"

import { Badge } from "@/components/ui/badge"
import { AppointmentStatus, AppointmentType } from "@prisma/client"
import { cn } from "@/lib/utils"

type Props = {
  status: AppointmentStatus
  type?: AppointmentType
  isToday?: boolean
  isPast?: boolean
  isOverdue?: boolean
  compact?: boolean
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  [AppointmentStatus.SCHEDULED]: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  },
  [AppointmentStatus.CONFIRMED]: {
    label: "Confirmed",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
  },
  [AppointmentStatus.COMPLETED]: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  },
  [AppointmentStatus.CANCELLED]: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  },
  [AppointmentStatus.NO_SHOW]: {
    label: "Missed",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
  },
}

export function AppointmentStatusBadge({ status, type, isToday, isPast, isOverdue, compact = false }: Props) {
  const config = statusConfig[status]
  const label = status === AppointmentStatus.NO_SHOW ? "Missed" : config.label
  const sizeClass = compact ? "text-[10px] px-1.5 py-0" : "text-[11px] px-2 py-0.5"

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Today indicator */}
      {isToday && status === AppointmentStatus.SCHEDULED && !isOverdue && (
        <Badge variant="outline" className={cn("border-orange-300 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-950", sizeClass)}>
          Today
        </Badge>
      )}

      {/* Overdue indicator (scheduled but past time, no visit) */}
      {isOverdue && (
        <Badge variant="outline" className={cn("border-amber-400 text-amber-700 bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:bg-amber-950/50", sizeClass)}>
          Overdue
        </Badge>
      )}

      {/* Type badge */}
      {type && type !== "SCHEDULED" && (
        <Badge
          variant="outline"
          className={cn(
            type === "EMERGENCY"
              ? "border-red-400 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-950"
              : "border-violet-400 text-violet-700 bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:bg-violet-950",
            sizeClass
          )}
        >
          {type === "EMERGENCY" ? "Emergency" : "Walk-in"}
        </Badge>
      )}

      {/* Status badge */}
      <Badge variant="outline" className={cn(config.className, sizeClass)}>
        {label}
      </Badge>
    </div>
  )
}