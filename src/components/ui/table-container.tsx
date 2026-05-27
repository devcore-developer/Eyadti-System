import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface TableContainerProps {
  children: ReactNode
  className?: string
}

export function TableContainer({ children, className }: TableContainerProps) {
  return (
    <div className={cn("premium-card overflow-hidden animate-fade rounded-[24px]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    </div>
  )
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn("premium-table-header sticky top-0 z-10", className)}>
      {children}
    </thead>
  )
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn("premium-table-row transition-colors duration-150 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] last:border-0", className)}>
      {children}
    </tr>
  )
}