// components/dashboard/kpi-cards.tsx
import Link from "next/link"
import { Users, CalendarCheck, DollarSign, Clock, Bell } from "lucide-react"

const kpiData = [
  {
    title: "Total Patients",
    value: "1,245",
    growth: "+12%",
    trend: "up",
    description: "compared to last month",
    icon: Users,
    accent: "text-[#5BC0BE]",
    iconBg: "bg-[#5BC0BE]/10",
    href: "/patients",
    // لا يوجد restrictRole → يظهر للكل
  },
  {
    title: "Appointments",
    value: "184",
    growth: "+5%",
    trend: "up",
    description: "compared to last month",
    icon: CalendarCheck,
    accent: "text-[#6B9CFF]",
    iconBg: "bg-[#6B9CFF]/10",
    href: "/appointments",
  },
  {
    title: "Revenue",
    value: "$12,450",
    growth: "+18%",
    trend: "up",
    description: "compared to last month",
    icon: DollarSign,
    accent: "text-[#6B9CFF]",
    iconBg: "bg-[#6B9CFF]/10",
    href: "/invoices",
    restrictRole: true, // ADMIN فقط
  },
  {
    title: "Pending Invoices",
    value: "23",
    growth: "-3%",
    trend: "down",
    description: "compared to last month",
    icon: Clock,
    accent: "text-[#F4B860]",
    iconBg: "bg-[#F4B860]/10",
    href: "/invoices",
    restrictRole: true, // ADMIN فقط
  },
  {
    title: "New Notifications",
    value: "3",
    growth: "Action required",
    trend: "up",
    description: "Click to view details",
    icon: Bell,
    accent: "text-[#EF6B6B]",
    iconBg: "bg-[#EF6B6B]/10",
    href: "/notifications",
  }
]

interface KPICardsProps {
  userRole?: string
}

export function KPICards({ userRole = "ADMIN" }: KPICardsProps) {
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN"

  const visibleKpis = kpiData.filter(kpi => !kpi.restrictRole || isAdmin)

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 ${isAdmin ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
      {visibleKpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <Link 
            key={index}
            href={kpi.href}
            className="premium-card group relative overflow-hidden p-5 md:p-6 animate-fade-in-up cursor-pointer"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/40 dark:bg-white/5 blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm ${kpi.iconBg}`}>
                <Icon className={`h-5 w-5 ${kpi.accent}`} />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg backdrop-blur-md ${kpi.trend === 'up' ? 'text-[#6BCB77] bg-[#6BCB77]/10' : 'text-[#EF6B6B] bg-[#EF6B6B]/10'}`}>
                {kpi.growth} <span>{kpi.trend === 'up' ? '↑' : '↓'}</span>
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-2xl md:text-[32px] font-extrabold text-foreground tracking-tight drop-shadow-sm">{kpi.value}</h3>
              <p className="text-sm font-semibold text-foreground/80 mt-1">{kpi.title}</p>
              <p className="text-xs text-muted-foreground mt-2">{kpi.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}