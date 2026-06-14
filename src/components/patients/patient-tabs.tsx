"use client"

import { cn } from "@/lib/utils"

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "allergies-history", label: "Allergies & History" },
  { id: "visits", label: "Visits" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "attachments", label: "Files" },
  { id: "invoices", label: "Invoices" },
  { id: "timeline", label: "Timeline" },
]

export function PatientTabs({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* ✨ Sticky Tabs مع Backdrop Blur على الموبايل */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-2 bg-white/80 dark:bg-[#17212F]/80 backdrop-blur-xl border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] mb-6 md:mb-8">
        <nav className="flex space-x-1 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
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