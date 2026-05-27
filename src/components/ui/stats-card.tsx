import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  className?: string
}

export function StatsCard({ title, value, icon, className }: StatsCardProps) {
  return (
    <div className={cn("glass-card p-5 animate-scale-in", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-small font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        {icon && <div className="text-muted-foreground h-4 w-4">{icon}</div>}
      </div>
      <p className="text-section-title text-foreground tracking-tight">{value}</p>
    </div>
  )
}