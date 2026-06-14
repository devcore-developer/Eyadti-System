// components/ui/mobile-card.tsx
import { cn } from "@/lib/utils"

interface MobileCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "md:hidden rounded-2xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white/90 dark:bg-[#223247]/90 p-4 shadow-[0_2px_8px_rgba(100,116,139,0.06)] transition-all backdrop-blur-sm",
        onClick && "cursor-pointer active:scale-[0.98] active:bg-muted/50 active:shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}

export function MobileCardItem({ label, value, className }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-between items-center gap-4 py-1.5", className)}>
      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5">{label}</span>
      <span className="text-sm font-medium text-right truncate">{value}</span>
    </div>
  )
}