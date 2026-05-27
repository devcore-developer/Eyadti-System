import { Clock, CreditCard, User } from "lucide-react"
import { formatCurrency } from "@/lib/utils/date-filters"
import { format } from "date-fns"

type Payment = {
  id: string
  amount: number
  method: string
  createdAt: Date
  userName: string
  reference?: string | null
}

interface PaymentHistoryProps {
  payments: Payment[]
}

export function PaymentHistory({ payments = [] }: PaymentHistoryProps) {
  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
      <h3 className="text-lg font-semibold text-foreground mb-6">Payment History</h3>
      
      {payments.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No payments recorded yet.</div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div 
              key={payment.id} 
              className="group flex items-center gap-4 p-4 rounded-[18px] bg-white/50 dark:bg-[#1D2A3B]/50 border border-[rgba(148,163,184,0.05)] hover:shadow-md transition-all duration-200"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5BC0BE]/10">
                <CreditCard className="h-5 w-5 text-[#5BC0BE]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
                  <span className="text-xs font-medium text-[#6B9CFF] bg-[#6B9CFF]/10 px-2.5 py-1 rounded-full">{payment.method}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><User className="h-3 w-3" /> {payment.userName}</div>
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(payment.createdAt), "MMM d, yyyy")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}