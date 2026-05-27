import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface AppShellProps {
  sidebar: ReactNode
  children: ReactNode
  className?: string
}

export function AppShell({ sidebar, children, className }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Premium Sidebar with Gradient & Shadow */}
      <aside 
        className="hidden md:flex w-[280px] flex-col border-r bg-gradient-to-b from-white to-[#F7FBFF] dark:bg-[#1B2838] border-sidebar-border shadow-[0_8px_30px_rgba(15,23,42,.08)] dark:shadow-none"
      >
        {sidebar}
      </aside>
      
      <main className={cn("flex-1 overflow-y-auto bg-background-main", className)}>
        <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}