import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface PageSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function PageSection({ title, description, children, className }: PageSectionProps) {
  return (
    <section className={cn("mb-10 last:mb-0 animate-slide-up", className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-section-title text-foreground">{title}</h2>}
          {description && <p className="text-body text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}