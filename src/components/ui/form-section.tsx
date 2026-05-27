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
  patient: "bg-[rgba(91,192,190,0.05)] dark:bg-[rgba(91,192,190,0.03)]",
  medical: "bg-[rgba(107,156,255,0.05)] dark:bg-[rgba(107,156,255,0.03)]",
  emergency: "bg-[rgba(137,214,210,0.05)] dark:bg-[rgba(137,214,210,0.03)]",
  default: "bg-transparent",
};

export function FormSection({ title, description, children, className, variant = "default" }: FormSectionProps) {
  return (
    <div className={cn(
        "p-6 rounded-[20px] shadow-[0_10px_25px_rgba(100,116,139,0.08)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.2)] animate-fade", 
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