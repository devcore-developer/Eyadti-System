"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BookingDetailsDrawer } from "./booking-details-drawer"
import { Phone, Calendar, Clock, User, RefreshCw } from "lucide-react"
import { getActiveOnlineBookings } from "@/lib/actions/booking"

type Booking = {
  id: string
  status: string
  createdAt: Date
  branchId: string | null
  patient: { fullName: string; phone: string; gender: string; dateOfBirth: Date; id: string }
  doctor: { name: string; image?: string | null; specialty?: string | null }
  appointment: {
    dateTime: Date | null
    status: string
    id: string
    notes: string | null
    visit: { id: string; status: string; checkedInAt: Date | null } | null
  } | null
  branch: { name: string } | null
}

const statusBadge: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  PENDING:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500" },
  CONFIRMED: { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500" },
  COMPLETED: { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200",    dot: "bg-cyan-500" },
  CANCELLED: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500" },
  NO_SHOW:   { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500" },
}

function getBadgeKey(b: Booking): string {
  if (b.status === "COMPLETED" && b.appointment?.visit) return "COMPLETED"
  return b.status
}

function getBadgeLabel(b: Booking): string {
  if (b.status === "COMPLETED" && b.appointment?.visit) return "Checked In"
  return b.status.charAt(0) + b.status.slice(1).toLowerCase()
}

export function OnlineBookingsClient({ bookings: initialBookings, clinicId }: { bookings: Booking[]; clinicId: string }) {
  const router = useRouter()
  const [bookings, setBookings] = useState(initialBookings)
  const [selected, setSelected] = useState<Booking | null>(null)

  // ✅ Real-time Polling Mechanism
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const result = await getActiveOnlineBookings()
        if (result.success && result.data) {
          setBookings(prev => {
            const prevIds = new Set(prev.map(b => b.id))
            const newIds = new Set((result.data as Booking[]).map(b => b.id))
            
            // تحديث الـ State فقط إذا تمت إضافة أو إزالة حجز
            if (prevIds.size !== newIds.size || [...newIds].some(id => !prevIds.has(id))) {
              return result.data as Booking[]
            }
            return prev
          })
        }
      } catch (error) {
        console.error("Polling error:", error)
      }
    }, 10000) // فحص كل 10 ثوانٍ

    return () => clearInterval(pollInterval)
  }, [])

  function refresh() { router.refresh() }

  function handleStatusUpdate(bookingId: string, newStatus: string) {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))
    if (newStatus === "COMPLETED") {
      setBookings(prev => prev.filter(b => b.id !== bookingId))
    }
  }

  if (bookings.length === 0) return null

  const pendingCount = bookings.filter(b => b.status === "PENDING").length

  return (
    <>
      <div className="space-y-4">
        {/* Summary Bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-slate-500">
            Total: <span className="font-bold text-slate-900">{bookings.length}</span>
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-bold">{pendingCount}</span> Pending
            </span>
          )}
          <button onClick={refresh} className="ml-auto text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bookings.map((b) => {
            const bk = getBadgeKey(b)
            const badge = statusBadge[bk] || statusBadge.PENDING
            const label = getBadgeLabel(b)

            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="text-left p-5 rounded-[20px] bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Top: Status + Time */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${bk === "PENDING" ? "animate-pulse" : ""}`} />
                    {label}
                  </span>
                  {b.appointment?.dateTime && (
                    <span className="text-[11px] text-slate-400">
                      {new Date(b.appointment.dateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                {/* Patient */}
                <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{b.patient.fullName}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {b.patient.phone}
                </p>

                {/* Doctor + Date */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Dr. {b.doctor.name}
                  </span>
                  {b.appointment?.dateTime && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(b.appointment.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Branch */}
                {b.branch && (
                  <p className="text-[11px] text-slate-400 mt-2">{b.branch.name}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <BookingDetailsDrawer
          booking={selected}
          clinicId={clinicId}
          onClose={() => setSelected(null)}
          onUpdated={refresh}
          onStatusUpdated={handleStatusUpdate}
        />
      )}
    </>
  )
}