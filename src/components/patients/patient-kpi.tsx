import { Users, UserPlus, Activity, RefreshCw } from "lucide-react"

interface PatientKPIsProps {
  totalPatients: number
  newThisMonth?: number
  activePatients?: number
  followUpPatients?: number
}

export function PatientKPIs({ totalPatients, newThisMonth = 0, activePatients = 0, followUpPatients = 0 }: PatientKPIsProps) {
  const kpiData = [
    {
      title: "Total Patients",
      value: totalPatients.toLocaleString(),
      growth: "",
      description: "All time records",
      icon: Users,
      accent: "text-[#5BC0BE]",
      iconBg: "bg-[#5BC0BE]/10",
      lightBg: "from-[#F5FFFF] to-[#EAFBF9]",
      shadow: "shadow-[0_15px_35px_rgba(91,192,190,0.12)]"
    },
    {
      title: "New This Month",
      value: newThisMonth.toLocaleString(),
      growth: "",
      description: "Registered recently",
      icon: UserPlus,
      accent: "text-[#6B9CFF]",
      iconBg: "bg-[#6B9CFF]/10",
      lightBg: "from-[#F8FFFF] to-[#EDF9FF]",
      shadow: "shadow-[0_15px_35px_rgba(107,156,255,0.12)]"
    },
    {
      title: "Active Patients",
      value: activePatients.toLocaleString(),
      growth: "",
      description: "With recent visits",
      icon: Activity,
      accent: "text-[#6B9CFF]",
      iconBg: "bg-[#6B9CFF]/10",
      lightBg: "from-[#F5F8FF] to-[#EEF3FF]",
      shadow: "shadow-[0_15px_35px_rgba(100,116,139,0.12)]"
    },
    {
      title: "Follow-up Patients",
      value: followUpPatients.toLocaleString(),
      growth: "",
      description: "Require follow-up",
      icon: RefreshCw,
      accent: "text-[#F4B860]",
      iconBg: "bg-[#F4B860]/10",
      lightBg: "from-[#FFFDF6] to-[#FFF7E8]",
      shadow: "shadow-[0_15px_35px_rgba(100,116,139,0.12)]"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div 
            key={index}
            className={`group relative overflow-hidden p-6 rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br ${kpi.lightBg} dark:from-[#223247] dark:to-[#1D2A3B] ${kpi.shadow} dark:shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_20px_45px_rgba(100,116,139,0.18)] animate-scale-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${kpi.iconBg}`}>
                <Icon className={`h-6 w-6 ${kpi.accent}`} />
              </div>
            </div>
            <h3 className="text-[28px] font-bold text-foreground tracking-tight">{kpi.value}</h3>
            <p className="text-sm font-medium text-muted-foreground mt-1">{kpi.title}</p>
            <p className="text-xs text-muted-foreground mt-2">{kpi.description}</p>
          </div>
        )
      })}
    </div>
  )
}