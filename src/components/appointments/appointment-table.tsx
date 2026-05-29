import Link from "next/link"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { AppointmentRowActions } from "./appointment-row-actions"
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card" // ← الـ Component الجديد
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
    return <div className="py-12 text-center text-gray-500">No appointments found.</div>
  }

  return (
    <div className="space-y-4">
      
      {/* ━━━ DESKTOP TABLE ━━━ */}
      <div className="hidden md:block rounded-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1D2A3B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-[#223247]/50 border-b border-[rgba(148,163,184,0.1)]">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Patient</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Doctor</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date & Time</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-[#223247]/30 transition-colors">
                  <td className="p-4 font-medium">
                    <Link href={`/patients/${apt.patient.id}`} className="text-blue-600 hover:underline">
                      {apt.patient.fullName}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground">{apt.doctor.name}</td>
                  <td className="p-4 text-muted-foreground">{formatDateTime(apt.dateTime)}</td>
                  <td className="p-4">
                    <AppointmentStatusBadge status={apt.status as any} />
                  </td>
                  <td className="p-4 text-right">
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
              <Link href={`/patients/${apt.patient.id}`} className="font-semibold text-sm text-blue-600 hover:underline">
                {apt.patient.fullName}
              </Link>
              <AppointmentStatusBadge status={apt.status as any} />
            </div>
            <MobileCardItem label="Doctor" value={apt.doctor.name} />
            <MobileCardItem label="Date" value={formatDateTime(apt.dateTime)} />
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-end">
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
        <div className="flex items-center justify-center gap-2 pt-4">
          <Link href={buildPageUrl(currentPage - 1, searchParams)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
          <Link href={buildPageUrl(currentPage + 1, searchParams)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      )}
    </div>
  )
}