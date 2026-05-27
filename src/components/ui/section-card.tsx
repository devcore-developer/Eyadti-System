import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface SectionCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}

export function SectionCard({ title, description, children, className, actions }: SectionCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-[rgba(255,255,255,0.75)] dark:bg-[rgba(34,50,71,0.75)] backdrop-blur-md shadow-[0_10px_25px_rgba(100,116,139,0.08)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.2)] rounded-[20px] border border-[rgba(255,255,255,0.25)] dark:border-[rgba(255,255,255,0.06)] p-6 md:p-8 animate-fade", 
      className
    )}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && <h2 className="text-section-title text-foreground">{title}</h2>}
            {description && <p className="text-body text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}