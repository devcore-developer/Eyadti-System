import { UserPlus, CalendarPlus, Receipt, Pill } from "lucide-react"
import Link from "next/link"

const actions = [
  { label: "New Patient", icon: UserPlus, href: "/patients/new", color: "#5BC0BE", bg: "rgba(91,192,190,0.06)", hoverBg: "rgba(91,192,190,0.12)", border: "rgba(91,192,190,0.12)" },
  { label: "New Appointment", icon: CalendarPlus, href: "/appointments/new", color: "#6B9CFF", bg: "rgba(107,156,255,0.06)", hoverBg: "rgba(107,156,255,0.12)", border: "rgba(107,156,255,0.12)" },
  { label: "New Invoice", icon: Receipt, href: "/invoices/new", color: "#6BCB77", bg: "rgba(107,203,119,0.06)", hoverBg: "rgba(107,203,119,0.12)", border: "rgba(107,203,119,0.12)" },
  { label: "New Prescription", icon: Pill, href: "/patients", color: "#F4B860", bg: "rgba(244,184,96,0.06)", hoverBg: "rgba(244,184,96,0.12)", border: "rgba(244,184,96,0.12)" },
]

export function QuickActions() {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#223247] border border-gray-200/60 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-5">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link 
            key={action.label}
            href={action.href}
            className="group flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            style={{ 
              backgroundColor: action.bg,
              borderColor: action.border
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = action.hoverBg
              e.currentTarget.style.borderColor = action.color + '30'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = action.bg
              e.currentTarget.style.borderColor = action.border
            }}
          >
            <action.icon 
              className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" 
              style={{ color: action.color }} 
            />
            <span className="text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}