import { InvoiceStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

type Props = {
  status: InvoiceStatus | string // Allow string to bypass TS before Prisma generate
  size?: "sm" | "default"
  className?: string
}

// Changed to Record<string, ...> to bypass TS strictness until Prisma is regenerated
const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: {
    label: "Paid",
    className: "bg-[#6BCB77]/10 text-[#6BCB77] border-[#6BCB77]/20 backdrop-blur-sm",
  },
  UNPAID: {
    label: "Pending",
    className: "bg-[#F4B860]/10 text-[#F4B860] border-[#F4B860]/20 backdrop-blur-sm",
  },
  PARTIAL: {
    label: "Partially Paid",
    className: "bg-[#6B9CFF]/10 text-[#6B9CFF] border-[#6B9CFF]/20 backdrop-blur-sm",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-[#EF6B6B]/10 text-[#EF6B6B] border-[#EF6B6B]/20 backdrop-blur-sm",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20 backdrop-blur-sm",
  },
}

export function InvoiceStatusBadge({ status, size = "default", className }: Props) {
  const config = statusConfig[status] || statusConfig.UNPAID

  return (
    <span
      className={cn(
        `inline-flex items-center rounded-full font-semibold border shadow-sm ${
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
        } ${config.className}`,
        className
      )}
    >
      {config.label}
    </span>
  )
}