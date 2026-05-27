import { CalendarCheck, FileText, DollarSign, AlertCircle } from "lucide-react"

interface PatientSummaryCardsProps {
  visits: number
  prescriptions: number
  invoices: number
  outstanding: number
}

export function PatientSummaryCards({ visits, prescriptions, invoices, outstanding }: PatientSummaryCardsProps) {
  const summaryData = [
    { title: "Total Visits", value: visits.toString(), icon: CalendarCheck, accent: "text-[#5BC0BE]", iconBg: "bg-[#5BC0BE]/10", lightBg: "from-[#F5FFFF] to-[#EAFBF9]" },
    { title: "Prescriptions", value: prescriptions.toString(), icon: FileText, accent: "text-[#6B9CFF]", iconBg: "bg-[#6B9CFF]/10", lightBg: "from-[#F8FFFF] to-[#EDF9FF]" },
    { title: "Invoices", value: invoices.toString(), icon: DollarSign, accent: "text-[#89D6D2]", iconBg: "bg-[#89D6D2]/10", lightBg: "from-[#F5F8FF] to-[#EEF3FF]" },
    { title: "Outstanding", value: outstanding.toString(), icon: AlertCircle, accent: "text-[#F4B860]", iconBg: "bg-[#F4B860]/10", lightBg: "from-[#FFFDF6] to-[#FFF7E8]" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryData.map((item, index) => {
        const Icon = item.icon
        return (
          <div 
            key={index}
            className={`p-5 rounded-[20px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br ${item.lightBg} dark:from-[#223247] dark:to-[#1D2A3B] transition-all duration-200 hover:-translate-y-1 hover:shadow-md animate-scale-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`p-2.5 rounded-xl ${item.iconBg} w-fit mb-3`}>
              <Icon className={`h-5 w-5 ${item.accent}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">{item.title}</p>
          </div>
        )
      })}
    </div>
  )
}