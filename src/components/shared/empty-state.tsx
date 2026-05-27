import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-24 px-8 text-center animate-fade",
        className
      )}
    >
      {/* Premium Icon Container with Gradient & Shadow */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F5F8FF] to-[#EAFBF9] dark:from-[#223247] dark:to-[#1D2A3B] mb-6 shadow-[0_10px_25px_rgba(107,156,255,0.10)]">
        <Icon className="h-10 w-10 text-[#6B9CFF] dark:text-[#89D6D2]" />
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <div className="mt-8">
          <Button 
            onClick={onAction}
            className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 text-sm font-semibold"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}