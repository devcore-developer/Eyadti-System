"use client"

import { cn } from "@/lib/utils"

// ── Tab definitions with role visibility ──────────────────
interface TabConfig {
  id: string
  label: string
  // Which roles can see this tab
  roles: string[]
}

const tabs: TabConfig[] = [
  { id: "overview", label: "Overview", roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { id: "allergies-history", label: "Allergies & History", roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { id: "visits", label: "Visits", roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { id: "prescriptions", label: "Prescriptions", roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { id: "attachments", label: "Files", roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"] },
  // Invoices: HIDDEN for DOCTOR (financial data)
  { id: "invoices", label: "Invoices", roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"] },
  { id: "timeline", label: "Timeline", roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"] },
]

interface PatientTabsProps {
  children: React.ReactNode
  userRole?: string
}

export function PatientTabs({ children, userRole }: PatientTabsProps) {
  // Filter tabs based on user role
  const visibleTabs = userRole 
    ? tabs.filter((tab) => tab.roles.includes(userRole))
    : tabs

  return (
    <div>
      {/* Sticky Tabs with Backdrop Blur on Mobile */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-2 bg-white/80 dark:bg-[#17212F]/80 backdrop-blur-xl border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] mb-6 md:mb-8">
        <nav className="flex space-x-1 overflow-x-auto hide-scrollbar">
          {visibleTabs.map((tab) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20"
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade">
        {children}
      </div>
    </div>
  )
}