import { TrendingUp, DollarSign, AlertCircle, Activity } from "lucide-react"
import { formatCurrency } from "@/lib/utils/date-filters"

interface InvoiceKPIsProps {
  monthlyRevenue: number
  totalRevenue: number
  outstandingBalance: number
  collectionRate: number
}

export function InvoiceKPIs({ monthlyRevenue, totalRevenue, outstandingBalance, collectionRate }: InvoiceKPIsProps) {
  const kpiData = [
    { 
      title: "Monthly Revenue", 
      value: formatCurrency(monthlyRevenue), 
      icon: TrendingUp, 
      accent: "text-[#6B9CFF]", 
      iconBg: "bg-[#6B9CFF]/10", 
      lightBg: "from-[#F5F8FF] to-[#EEF3FF]", 
      shadow: "shadow-[0_15px_35px_rgba(107,156,255,0.12)]" 
    },
    { 
      title: "Total Revenue", 
      value: formatCurrency(totalRevenue), 
      icon: DollarSign, 
      accent: "text-[#5BC0BE]", 
      iconBg: "bg-[#5BC0BE]/10", 
      lightBg: "from-[#F5FFFF] to-[#EAFBF9]", 
      shadow: "shadow-[0_15px_35px_rgba(91,192,190,0.12)]" 
    },
    { 
      title: "Outstanding Balance", 
      value: formatCurrency(outstandingBalance), 
      icon: AlertCircle, 
      accent: "text-[#F4B860]", 
      iconBg: "bg-[#F4B860]/10", 
      lightBg: "from-[#FFF9EE] to-[#FFF4DD]", 
      shadow: "shadow-[0_15px_35px_rgba(244,184,96,0.12)]" 
    },
    { 
      title: "Collection Rate", 
      value: `${collectionRate}%`, 
      icon: Activity, 
      accent: "text-[#6B9CFF]", 
      iconBg: "bg-[#89D6D2]/10", 
      lightBg: "from-[#F8FBFF] to-[#F2F8FF]", 
      shadow: "shadow-[0_15px_35px_rgba(100,116,139,0.12)]" 
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div key={index} className={`p-6 rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br ${kpi.lightBg} dark:from-[#223247] dark:to-[#1D2A3B] ${kpi.shadow} transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg animate-scale-in`}>
            <div className={`p-3 rounded-xl ${kpi.iconBg} w-fit mb-4`}>
              <Icon className={`h-6 w-6 ${kpi.accent}`} />
            </div>
            <h3 className="text-[28px] font-bold text-foreground">{kpi.value}</h3>
            <p className="text-sm font-medium text-muted-foreground mt-1">{kpi.title}</p>
          </div>
        )
      })}
    </div>
  )
}