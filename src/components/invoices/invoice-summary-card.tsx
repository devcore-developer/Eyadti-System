import { formatCurrency } from "@/lib/utils/date-filters"
import { InvoiceStatusBadge } from "./invoice-status-badge"
import { InvoiceStatus } from "@prisma/client"

interface InvoiceSummaryCardProps {
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: InvoiceStatus
}

export function InvoiceSummaryCard({ totalAmount, paidAmount, remainingAmount, status }: InvoiceSummaryCardProps) {
  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  return (
    <div 
      className="relative overflow-hidden rounded-[24px] p-8 border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_20px_50px_rgba(107,156,255,.10)]"
      style={{ background: 'linear-gradient(135deg, rgba(107,156,255,.06), rgba(91,192,190,.04))' }}
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Invoice Summary</h2>
          <InvoiceStatusBadge status={status} />
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-[#6BCB77] mt-1">{formatCurrency(paidAmount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold text-[#F4B860] mt-1">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted/50 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] h-2.5 rounded-full transition-all duration-700" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">{Math.round(progress)}% collected</p>
      </div>
    </div>
  )
}