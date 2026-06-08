import { AppointmentStatus } from "@prisma/client"

type Props = {
  status: AppointmentStatus
  size?: "sm" | "default"
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-800" }, // حسب الألوان اللي عندك
  ARRIVED: { label: "Arrived", className: "bg-teal-100 text-teal-800" }, // ← أضف السطر ده
  IN_PROGRESS: { label: "In Progress", className: "bg-purple-100 text-purple-800" }, // ← أضف السطر ده
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800" },
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