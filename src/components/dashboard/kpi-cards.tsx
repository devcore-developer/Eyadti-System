import { Users, CalendarCheck, DollarSign, Clock } from "lucide-react"

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
  }
]

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div 
            key={index}
            className={`group relative overflow-hidden p-6 rounded-[24px] border border-[rgba(255,255,255,0.60)] dark:border-[rgba(255,255,255,0.06)] backdrop-blur-[12px] bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(245,250,255,0.92)] dark:from-[#223247] dark:to-[#1D2A3B] shadow-[0_15px_35px_rgba(100,116,139,0.10)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_20px_45px_rgba(100,116,139,0.15)] animate-scale-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Subtle decorative shape for depth */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/40 dark:bg-white/5 blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm ${kpi.iconBg}`}>
                <Icon className={`h-6 w-6 ${kpi.accent}`} />
              </div>
              <span className={`text-sm font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg backdrop-blur-md ${kpi.trend === 'up' ? 'text-[#6BCB77] bg-[#6BCB77]/10' : 'text-[#EF6B6B] bg-[#EF6B6B]/10'}`}>
                {kpi.growth} <span>{kpi.trend === 'up' ? '↑' : '↓'}</span>
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-[32px] font-extrabold text-foreground tracking-tight drop-shadow-sm">{kpi.value}</h3>
              <p className="text-sm font-semibold text-foreground/80 mt-1">{kpi.title}</p>
              <p className="text-xs text-muted-foreground mt-2">{kpi.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}