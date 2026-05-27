import { TrendingUp, Activity, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils/date-filters"

interface InvoiceHeaderProps {
  monthlyRevenue: number
  collectionRate: number
  outstandingBalance: number
}

export function InvoiceHeader({ monthlyRevenue, collectionRate, outstandingBalance }: InvoiceHeaderProps) {
  return (
    <div 
      className="relative overflow-hidden rounded-[28px] p-8 md:p-10 border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_20px_50px_rgba(107,156,255,.15)]"
      style={{ background: 'linear-gradient(135deg, rgba(107,156,255,.10), rgba(91,192,190,.08))' }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Financial Overview</h1>
        <p className="mt-2 text-base text-muted-foreground">Track revenue, collections, and outstanding balances.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-[#223247]/60 backdrop-blur-sm border border-white/50 dark:border-[rgba(255,255,255,0.1)]">
            <div className="p-3 rounded-xl bg-[#6B9CFF]/10">
              <TrendingUp className="h-6 w-6 text-[#6B9CFF]" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Month</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(monthlyRevenue)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-[#223247]/60 backdrop-blur-sm border border-white/50 dark:border-[rgba(255,255,255,0.1)]">
            <div className="p-3 rounded-xl bg-[#5BC0BE]/10">
              <Activity className="h-6 w-6 text-[#5BC0BE]" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collection Rate</p>
              <p className="text-2xl font-bold text-foreground">{collectionRate}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-[#223247]/60 backdrop-blur-sm border border-white/50 dark:border-[rgba(255,255,255,0.1)]">
            <div className="p-3 rounded-xl bg-[#F4B860]/10">
              <AlertCircle className="h-6 w-6 text-[#F4B860]" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(outstandingBalance)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}