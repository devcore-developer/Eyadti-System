"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "medical", label: "Medical Records" },
  { id: "visits", label: "Visits" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "attachments", label: "Attachments" },
  { id: "invoices", label: "Invoices" },
  { id: "timeline", label: "Timeline" },
]

export function PatientTabs({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto space-x-2 mb-8 p-1 bg-muted/30 dark:bg-[#1D2A3B]/50 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200",
              activeTab === tab.id 
                ? "bg-white dark:bg-[#223247] text-foreground shadow-sm text-[#6B9CFF]" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-[#223247]/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content (For now, just rendering children. Can be mapped to specific components later) */}
      <div className="animate-fade">
        {children}
      </div>
    </div>
  )
}