import { Clock, CreditCard, User, RotateCcw } from "lucide-react"
import { formatCurrency } from "@/lib/utils/date-filters"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Payment = {
  id: string
  amount: number
  method: string
  createdAt: Date
  userName: string
  reference?: string | null
  isRefund?: boolean
}

interface PaymentHistoryProps {
  payments: Payment[]
}

export function PaymentHistory({ payments = [] }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
        <h3 className="text-lg font-semibold text-foreground mb-6">Payment History</h3>
        <div className="text-center py-8 text-sm text-muted-foreground">No payments recorded yet.</div>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
      <h3 className="text-lg font-semibold text-foreground mb-6">Payment History</h3>
      
      <div className="space-y-4">
        {payments.map((payment) => (
          <div 
            key={payment.id} 
            className={cn(
              "group flex items-center gap-4 p-4 rounded-[18px] border hover:shadow-md transition-all duration-200",
              payment.isRefund
                ? "bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/30"
                : "bg-white/50 dark:bg-[#1D2A3B]/50 border-[rgba(148,163,184,0.05)]"
            )}
          >
            <div className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              payment.isRefund ? "bg-red-100 dark:bg-red-900/30" : "bg-[#5BC0BE]/10"
            )}>
              {payment.isRefund ? (
                <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <CreditCard className="h-5 w-5 text-[#5BC0BE]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={cn(
                  "text-sm font-semibold",
                  payment.isRefund ? "text-red-600 dark:text-red-400" : "text-foreground"
                )}>
                  {payment.isRefund ? "-" : ""}{formatCurrency(Math.abs(payment.amount))}
                </p>
                <span className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  payment.isRefund
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-[#6B9CFF]/10 text-[#6B9CFF]"
                )}>
                  {payment.isRefund ? "Refund" : payment.method}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><User className="h-3 w-3" /> {payment.userName}</div>
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(payment.createdAt), "MMM d, yyyy h:mm a")}</div>
              </div>
              {payment.reference && (
                <p className="text-[10px] text-muted-foreground mt-1">Ref: {payment.reference}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}