import { cn } from "@/lib/utils"

type StatusType = "ACTIVE" | "INACTIVE" | "FOLLOW_UP" | "CRITICAL"

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<StatusType, { label: string, classes: string }> = {
  ACTIVE: { label: "Active", classes: "bg-[#5BC0BE]/10 text-[#5BC0BE] border-[#5BC0BE]/20" },
  INACTIVE: { label: "Inactive", classes: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  FOLLOW_UP: { label: "Follow-up", classes: "bg-[#F4B860]/10 text-[#F4B860] border-[#F4B860]/20" },
  CRITICAL: { label: "Critical", classes: "bg-[#EF6B6B]/10 text-[#EF6B6B] border-[#EF6B6B]/20" }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || statusConfig.ACTIVE

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
      config.classes,
      className
    )}>
      {config.label}
    </span>
  )
}