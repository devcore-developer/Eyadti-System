import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between mb-8 animate-slide-up", className)}>
      <div>
        <h1 className="text-page-title text-foreground">{title}</h1>
        {description && (
          <p className="text-body text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 mt-4 md:mt-0">{actions}</div>}
    </div>
  )
}