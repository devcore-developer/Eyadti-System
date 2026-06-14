// components/appointments/appointment-table.tsx
import Link from "next/link"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { AppointmentRowActions } from "./appointment-row-actions"
import { EmptyState } from "@/components/shared/empty-state"
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react"

type AppointmentRow = {
  id: string
  dateTime: Date
  status: string
  notes: string | null
  patient: { id: string; fullName: string }
  doctor: { id: string; name: string }
}

type Props = {
  appointments: AppointmentRow[]
  role: string
  userId: string
  currentPage: number
  totalPages: number
  searchParams: Record<string, string>
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))
}

function buildPageUrl(page: number, searchParams: Record<string, string>): string {
  const params = new URLSearchParams(searchParams)
  params.set("page", String(page))
  return `/appointments?${params.toString()}`
}

export function AppointmentTable({
  appointments,
  role,
  userId,
  currentPage,
  totalPages,
  searchParams,
}: Props) {
  if (appointments.length === 0) {
    return (
      <EmptyState 
        icon={CalendarX} 
        title="No appointments found" 
        description="There are no appointments matching your criteria for this day." 
        actionLabel="Book New"
        onAction={() => window.location.href = "/appointments/new"}
      />
    )
  }

  return (
    <div className="space-y-4">
      
      {/* ━━━ DESKTOP TABLE ━━━ */}
      <div className="hidden md:block premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="premium-table-header">
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Patient</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Doctor</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Date & Time</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id} className="premium-table-row border-b border-border/50 last:border-0">
                  <td className="px-6 py-4 font-medium">
                    <Link href={`/patients/${apt.patient.id}`} className="text-[#6B9CFF] hover:underline transition-colors">
                      {apt.patient.fullName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{apt.doctor.name}</td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{formatDateTime(apt.dateTime)}</td>
                  <td className="px-6 py-4">
                    <AppointmentStatusBadge status={apt.status as any} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <AppointmentRowActions
                      appointmentId={apt.id}
                      status={apt.status as any}
                      doctorId={apt.doctor.id}
                      role={role}
                      userId={userId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ━━━ MOBILE CARDS ━━━ */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {appointments.map((apt) => (
          <MobileCard key={apt.id}>
            <div className="flex justify-between items-start mb-2">
              <Link href={`/patients/${apt.patient.id}`} className="font-semibold text-sm text-[#6B9CFF] hover:underline">
                {apt.patient.fullName}
              </Link>
              <AppointmentStatusBadge status={apt.status as any} />
            </div>
            <MobileCardItem label="Doctor" value={apt.doctor.name} />
            <MobileCardItem label="Date" value={formatDateTime(apt.dateTime)} />
            <div className="mt-3 pt-3 border-t border-border flex justify-end">
              <AppointmentRowActions
                appointmentId={apt.id}
                status={apt.status as any}
                doctorId={apt.doctor.id}
                role={role}
                userId={userId}
              />
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href={buildPageUrl(currentPage - 1, searchParams)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage <= 1} className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <span className="text-sm text-muted-foreground font-medium">{currentPage} / {totalPages}</span>
          <Link href={buildPageUrl(currentPage + 1, searchParams)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage >= totalPages} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      )}
    </div>
  )
}