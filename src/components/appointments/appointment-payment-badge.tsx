"use client"

import { Badge } from "@/components/ui/badge"
import type { PaymentStatusInfo } from "@/lib/actions/payment-workflow"

interface AppointmentPaymentBadgeProps {
  paymentInfo: PaymentStatusInfo | null
  clinicPaymentPolicy?: string
  compact?: boolean
}

export function AppointmentPaymentBadge({
  paymentInfo,
  clinicPaymentPolicy,
  compact = false,
}: AppointmentPaymentBadgeProps) {
  if (!paymentInfo) return null

  const { status, totalAmount, totalPaid, remaining } = paymentInfo

  if (status === "NO_INVOICE") {
    if (clinicPaymentPolicy === "PAY_BEFORE_VISIT" || clinicPaymentPolicy === "SPLIT_PAYMENT") {
      return (
        <Badge variant="destructive" className={compact ? "text-[10px] px-1.5 py-0" : ""}>
          Payment required
        </Badge>
      )
    }
    return null
  }

  switch (status) {
    case "PAID":
      return (
        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
          Paid
        </Badge>
      )
    case "PARTIALLY_PAID":
      return (
        <div className="flex flex-col gap-0.5">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
            Partially paid
          </Badge>
          {!compact && remaining > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Remaining: {remaining.toFixed(2)}
            </span>
          )}
        </div>
      )
    case "UNPAID":
      return (
        <Badge variant="destructive">
          Unpaid
        </Badge>
      )
    default:
      return null
  }
}