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
        "md:hidden rounded-2xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] p-4 shadow-[0_8px_20px_rgba(100,116,139,0.08)] transition-all",
        onClick && "cursor-pointer active:scale-[0.98] active:shadow-sm",
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
      {/* ✨ تغيير النوع لـ React.ReactNode لدعم الأيقونات بجانب النص */}
      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">{label}</span>
      <span className="text-sm font-medium text-right truncate">{value}</span>
    </div>
  )
}