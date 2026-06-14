// components/ui/page-header.tsx
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
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up", className)}>
      <div className="min-w-0">
        <h1 className="text-page-title text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-body text-muted-foreground mt-1.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}