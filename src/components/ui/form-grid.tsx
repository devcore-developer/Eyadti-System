import { cn } from "@/lib/utils"

interface FormGridProps {
  children: React.ReactNode
  className?: string
}

export function FormGrid({ children, className }: FormGridProps) {
  return (
    // ✨ زيادة الـ gap قليلاً على الموبايل لتجنب الضغط
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6", className)}>
      {children}
    </div>
  )
}

// للحقول اللي عايز تاخد عرض الشاشة كلها حتي في الديسكتوب
export function FormFullWidth({ children, className }: FormGridProps) {
  return (
    <div className={cn("md:col-span-2", className)}>
      {children}
    </div>
  )
}