"use client"

import { useState } from "react"
import Link from "next/link"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { AppointmentPaymentBadge } from "./appointment-payment-badge"
import { AppointmentRowActions } from "./appointment-row-actions"
import { AppointmentDetailDrawer } from "./appointment-detail-drawer"
import { EmptyState } from "@/components/shared/empty-state"
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react"

type AppointmentRow = {
  id: string
  dateTime: Date
  status: string
  type?: string
  notes: string | null
  isToday: boolean
  isPast: boolean
  isOverdue: boolean
  isFuture?: boolean
  paymentInfo: {
    totalAmount: number
    totalPaid: number
    remaining: number
    status: "NO_INVOICE" | "UNPAID" | "PARTIALLY_PAID" | "PAID"
    hasInvoice: boolean
    paymentCount: number
  } | null
  patient: {
    id: string
    fullName: string
    phone?: string
    gender?: string
    dateOfBirth?: Date
  }
  doctor: { id: string; name: string }
  visit?: { id: string; status: string; queueNumber?: number } | null
}

type Props = {
  appointments: AppointmentRow[]
  role: string
  userId: string
  currentPage: number
  totalPages: number
  searchParams: Record<string, string>
  clinicPaymentPolicy?: string
  clinicId?: string
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
  clinicPaymentPolicy,
  clinicId,
}: Props) {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleRowClick(apt: AppointmentRow, e: React.MouseEvent) {
    const target = e.target as HTMLElement
    if (target.closest("a") || target.closest("button")) return
    setSelectedAppointment(apt)
    setDrawerOpen(true)
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No appointments found"
        description="There are no appointments matching your criteria."
        actionLabel="Book New"
        actionUrl="/appointments/new"
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
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs">Patient</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs">Doctor</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs">Date & Time</th>
                <th className="text-left px-3 py-3.5 font-semibold text-muted-foreground text-xs">Status</th>
                <th className="text-left px-3 py-3.5 font-semibold text-muted-foreground text-xs">Payment</th>
                <th className="text-right px-4 py-3.5 font-semibold text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr
                  key={apt.id}
                  className={`premium-table-row border-b border-border/50 last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                    apt.isOverdue ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                  }`}
                  onClick={(e) => handleRowClick(apt, e)}
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/patients/${apt.patient.id}`}
                      className="text-[#6B9CFF] hover:underline transition-colors font-medium text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {apt.patient.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">{apt.doctor.name}</td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDateTime(apt.dateTime)}
                  </td>
                  <td className="px-3 py-3.5">
                    <AppointmentStatusBadge
                      status={apt.status as any}
                      type={apt.type as any}
                      isToday={apt.isToday}
                      isPast={apt.isPast}
                      isOverdue={apt.isOverdue}
                      compact
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <AppointmentPaymentBadge
                      paymentInfo={apt.paymentInfo}
                      clinicPaymentPolicy={clinicPaymentPolicy}
                      compact
                    />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {/* ═══ تم إيقاف الـ Propagation لمنع فتح الـ Drawer عند الضغط على الأزرار ═══ */}
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <AppointmentRowActions
                        appointmentId={apt.id}
                        status={apt.status as any}
                        doctorId={apt.doctor.id}
                        role={role}
                        userId={userId}
                        patientId={apt.patient.id}
                        patientName={apt.patient.fullName}
                        clinicId={clinicId || ""}
                      />
                    </div>
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
          <MobileCard
            key={apt.id}
            className={`cursor-pointer ${apt.isOverdue ? "border-amber-300 dark:border-amber-700" : ""}`}
            onClick={() => {
              setSelectedAppointment(apt)
              setDrawerOpen(true)
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm text-[#6B9CFF]">{apt.patient.fullName}</span>
              <AppointmentStatusBadge
                status={apt.status as any}
                type={apt.type as any}
                isToday={apt.isToday}
                isPast={apt.isPast}
                isOverdue={apt.isOverdue}
                compact
              />
            </div>
            <MobileCardItem label="Doctor" value={apt.doctor.name} />
            <MobileCardItem label="Date" value={formatDateTime(apt.dateTime)} />
            <div className="mt-2">
              <AppointmentPaymentBadge
                paymentInfo={apt.paymentInfo}
                clinicPaymentPolicy={clinicPaymentPolicy}
                compact
              />
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              <AppointmentRowActions
                appointmentId={apt.id}
                status={apt.status as any}
                doctorId={apt.doctor.id}
                role={role}
                userId={userId}
                patientId={apt.patient.id}
                patientName={apt.patient.fullName}
                clinicId={clinicId || ""}
              />
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href={buildPageUrl(currentPage - 1, searchParams)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage <= 1} className="rounded-xl">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground font-medium">
            {currentPage} / {totalPages}
          </span>
          <Link href={buildPageUrl(currentPage + 1, searchParams)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage >= totalPages} className="rounded-xl">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* ━━━ APPOINTMENT DETAIL DRAWER ━━━ */}
      <AppointmentDetailDrawer
        appointment={selectedAppointment}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        clinicId={clinicId || ""}
        role={role}
        userId={userId}
      />
    </div>
  )
}