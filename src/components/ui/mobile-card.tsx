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
        "md:hidden rounded-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1D2A3B] p-4 shadow-sm active:scale-[0.98] transition-transform",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  )
}

// عنصر جوه الكارت عشان نعرف الـ Title من الـ Value
export function MobileCardItem({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-between items-center gap-4 py-1", className)}>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <span className="text-sm font-medium text-right truncate">{value}</span>
    </div>
  )
}