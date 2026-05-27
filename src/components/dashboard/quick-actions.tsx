import { UserPlus, CalendarPlus, Receipt, Pill } from "lucide-react"
import Link from "next/link"

const actions = [
  { label: "New Patient", icon: UserPlus, href: "/patients/new" },
  { label: "New Appointment", icon: CalendarPlus, href: "/appointments/new" },
  { label: "New Invoice", icon: Receipt, href: "/invoices/new" },
  { label: "New Prescription", icon: Pill, href: "/patients" },
]

export function QuickActions() {
  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_40px_rgba(100,116,139,0.15)] -translate-y-2 animate-fade">
      <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Link 
            key={index}
            href={action.href}
            className="group flex flex-col items-center justify-center p-5 rounded-[16px] text-white shadow-[0_12px_30px_rgba(107,156,255,.25)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(107,156,255,.30)]"
            style={{ background: 'linear-gradient(135deg, #5BC0BE, #6B9CFF)' }}
          >
            <action.icon className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-xs font-semibold text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}