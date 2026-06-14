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
      iconBg: "bg-[#6B9CFF]/10"
    },
    { 
      title: "Total Revenue", 
      value: formatCurrency(totalRevenue), 
      icon: DollarSign, 
      accent: "text-[#5BC0BE]", 
      iconBg: "bg-[#5BC0BE]/10"
    },
    { 
      title: "Outstanding", 
      value: formatCurrency(outstandingBalance), 
      icon: AlertCircle, 
      accent: "text-[#F4B860]", 
      iconBg: "bg-[#F4B860]/10"
    },
    { 
      title: "Collection Rate", 
      value: `${collectionRate}%`, 
      icon: Activity, 
      accent: "text-[#89D6D2]", 
      iconBg: "bg-[#89D6D2]/10"
    }
  ]

  return (
    // ✨ شبكة 2x2 على الموبايل، 4 أعمدة على الـ Desktop
    <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div key={index} className="p-4 md:p-6 rounded-2xl md:rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:from-[#223247] dark:to-[#1D2A3B] dark:bg-gradient-to-br shadow-sm hover:shadow-md transition-all duration-200 animate-scale-in">
            <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${kpi.iconBg} w-fit mb-3 md:mb-4`}>
              <Icon className={`h-4 w-4 md:h-6 md:w-6 ${kpi.accent}`} />
            </div>
            {/* ✨ حجم خط أصغر على الموبايل ليتسع في مساحة 50% */}
            <h3 className="text-xl md:text-[28px] font-bold text-foreground truncate">{kpi.value}</h3>
            <p className="text-xs md:text-sm font-medium text-muted-foreground mt-0.5 md:mt-1 truncate">{kpi.title}</p>
          </div>
        )
      })}
    </div>
  )
}