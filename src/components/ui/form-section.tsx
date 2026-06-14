// components/ui/form-section.tsx
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface FormSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  variant?: "patient" | "medical" | "emergency" | "default"
}

const variantStyles = {
  patient: "bg-[rgba(91,192,190,0.04)] dark:bg-[rgba(91,192,190,0.02)] border-[#5BC0BE]/10 dark:border-[#5BC0BE]/5",
  medical: "bg-[rgba(107,156,255,0.04)] dark:bg-[rgba(107,156,255,0.02)] border-[#6B9CFF]/10 dark:border-[#6B9CFF]/5",
  emergency: "bg-[rgba(137,214,210,0.04)] dark:bg-[rgba(137,214,210,0.02)] border-[#89D6D2]/10 dark:border-[#89D6D2]/5",
  default: "bg-transparent border-transparent",
};

export function FormSection({ title, description, children, className, variant = "default" }: FormSectionProps) {
  return (
    <div className={cn(
        "p-6 rounded-[20px] border shadow-[0_2px_12px_rgba(100,116,139,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.1)] animate-fade transition-colors", 
        variantStyles[variant], 
        className
    )}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-card-title text-foreground">{title}</h3>}
          {description && <p className="text-body text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {children}
      </div>
    </div>
  )
}