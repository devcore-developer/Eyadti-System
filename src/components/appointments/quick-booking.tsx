"use client"

import { useState } from "react"
import { Plus, CalendarPlus, UserPlus, AlertTriangle, X } from "lucide-react"

export function QuickBooking() {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { label: "New Appointment", icon: CalendarPlus, href: "/appointments/new" },
    { label: "Walk-in Patient", icon: UserPlus, href: "/patients/new?walkin=true" },
    { label: "Emergency Visit", icon: AlertTriangle, href: "/appointments/new?emergency=true" },
  ]

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex flex-col gap-2 animate-slide-up mb-2">
          {actions.map((action, index) => (
            <a 
              key={index}
              href={action.href}
              className="flex items-center gap-3 pl-4 pr-5 py-3 rounded-xl bg-white dark:bg-[#223247] shadow-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] hover:-translate-y-0.5 transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <action.icon className="h-5 w-5 text-[#6B9CFF]" />
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
            </a>
          ))}
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-2xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_12px_30px_rgba(107,156,255,0.30)] hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 flex items-center justify-center ${isOpen ? 'rotate-45' : 'rotate-0'}`}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}