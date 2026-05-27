import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  variant?: "patients" | "revenue" | "appointments" | "pending"
  className?: string
}

const variantStyles = {
  patients: "bg-gradient-to-br from-[#F5FFFF] to-[#EAFBF9] dark:from-[#223247] dark:to-[#223247]",
  revenue: "bg-gradient-to-br from-[#F5F8FF] to-[#EEF3FF] dark:from-[#223247] dark:to-[#223247]",
  appointments: "bg-gradient-to-br from-[#F8FFFF] to-[#EDF9FF] dark:from-[#223247] dark:to-[#223247]",
  pending: "bg-gradient-to-br from-[#FFF9EE] to-[#FFF4DD] dark:from-[#223247] dark:to-[#223247]",
};

export function KPICard({ title, value, change, changeType = "neutral", icon: Icon, variant = "patients", className }: KPICardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-danger",
    neutral: "text-muted-foreground"
  }

  return (
    <div 
      className={cn(
        "premium-card p-6 flex items-start justify-between animate-scale-in border-none shadow-[0_10px_30px_rgba(100,116,139,.14)]",
        variantStyles[variant],
        className
      )}
    >
      <div className="space-y-2">
        <p className="text-small font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-primary-value text-foreground">{value}</p>
        {change && (
          <p className={cn("text-small font-medium", changeColors[changeType])}>
            {change}
          </p>
        )}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 dark:bg-white/10 text-premium-blue">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}