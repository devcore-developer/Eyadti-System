// components/ui/responsive-table.tsx
"use client"

import { cn } from "@/lib/utils"

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Horizontal scroll container for mobile */}
      <div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
        <div className="min-w-[700px]">
          {children}
        </div>
      </div>
      {/* Fade edge indicator for mobile scroll */}
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/50 dark:from-[#17212F]/50 to-transparent pointer-events-none sm:hidden" />
    </div>
  )
}