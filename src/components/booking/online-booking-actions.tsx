"use client"

import { useTransition, useState } from "react"
import { confirmBooking, cancelBooking } from "@/lib/actions/booking"
import { Check, X, Loader2 } from "lucide-react"

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"

interface Props {
  bookingId: string
  status: BookingStatus
  onUpdated: () => void
}

export function OnlineBookingActions({ bookingId, status, onUpdated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [currentStatus, setCurrentStatus] = useState(status)

  if (currentStatus !== "PENDING") {
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
        currentStatus === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
        currentStatus === "COMPLETED" ? "bg-blue-50 text-blue-700 border border-blue-200" :
        "bg-red-50 text-red-700 border border-red-200"
      }`}>
        {currentStatus}
      </span>
    )
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmBooking(bookingId)
      if (result.success) {
        setCurrentStatus("CONFIRMED")
        onUpdated()
      }
    })
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBooking(bookingId)
      if (result.success) {
        setCurrentStatus("CANCELLED")
        onUpdated()
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
        Pending
      </span>
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        Confirm
      </button>
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
        Cancel
      </button>
    </div>
  )
}