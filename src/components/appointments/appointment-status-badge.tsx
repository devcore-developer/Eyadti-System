import { AppointmentStatus } from "@prisma/client"

type Props = {
  status: AppointmentStatus
  size?: "sm" | "default"
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-[#6B9CFF]/10 text-[#6B9CFF] border-[#6B9CFF]/20 backdrop-blur-sm",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-[#6BCB77]/10 text-[#6BCB77] border-[#6BCB77]/20 backdrop-blur-sm",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-[#EF6B6B]/10 text-[#EF6B6B] border-[#EF6B6B]/20 backdrop-blur-sm",
  },
}

export function AppointmentStatusBadge({ status, size = "default" }: Props) {
  const config = statusConfig[status] || statusConfig.SCHEDULED

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border shadow-sm ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      } ${config.className}`}
    >
      {config.label}
    </span>
  )
}