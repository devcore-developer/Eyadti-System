"use client"

import { cn } from "@/lib/utils"

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "medical", label: "Medical Records" },
  { id: "visits", label: "Visits" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "attachments", label: "Attachments" },
  { id: "invoices", label: "Invoices" },
  { id: "gallery", label: "Before & After" }, // ✅ التاب الجديد
  { id: "timeline", label: "Timeline" },
]

export function PatientTabs({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Tab Navigation - مجرد أزرار فوق للتنقل البصري */}
      <div className="flex overflow-x-auto space-x-2 mb-8 p-1 bg-muted/30 dark:bg-[#1D2A3B]/50 rounded-2xl">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className="px-5 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-[#223247]/50"
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Tab Content - بيظهر كل الأقسام جوه بعض عشان تقدر تعمل Scroll */}
      <div className="animate-fade">
        {children}
      </div>
    </div>
  )
}