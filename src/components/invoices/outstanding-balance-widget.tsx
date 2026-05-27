import { AlertCircle, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils/date-filters"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface OutstandingBalanceWidgetProps {
  totalOutstanding: number
  patientCount: number
  lastPaymentDate?: string
  invoiceId: string
}

export function OutstandingBalanceWidget({ totalOutstanding, patientCount, lastPaymentDate, invoiceId }: OutstandingBalanceWidgetProps) {
  if (totalOutstanding <= 0) return null

  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#FFF9EE] to-[#FFF4DD] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(244,184,96,0.1)] shadow-[0_15px_35px_rgba(244,184,96,0.10)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-[#F4B860]/10">
          <AlertCircle className="h-5 w-5 text-[#F4B860]" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Outstanding Balance</h3>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount Due</span>
          <span className="text-xl font-bold text-foreground">{formatCurrency(totalOutstanding)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Patients</span>
          <span className="text-sm font-semibold text-foreground">{patientCount}</span>
        </div>
        {lastPaymentDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Payment</span>
            <span className="text-sm font-semibold text-foreground">{lastPaymentDate}</span>
          </div>
        )}
      </div>

      <Link href={`/invoices/${invoiceId}/pay`}>
        <Button className="w-full bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
          <DollarSign className="h-4 w-4 mr-2" /> Collect Payment
        </Button>
      </Link>
    </div>
  )
}