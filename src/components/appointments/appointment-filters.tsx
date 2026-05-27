"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

type Doctor = { id: string; name: string }

interface AppointmentFiltersProps {
  doctors: Doctor[]
}

const statusOptions = [
  { label: "All Statuses", value: "" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
]

export function AppointmentFilters({ doctors }: AppointmentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentDoctor = searchParams.get("doctorId") || ""
  const currentStatus = searchParams.get("status") || ""
  const currentDate = searchParams.get("date") || ""

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    startTransition(() => {
      router.push(`/appointments?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Filter */}
      <input 
        type="date" 
        value={currentDate}
        onChange={(e) => updateFilter("date", e.target.value)}
        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.15)] dark:border-[rgba(255,255,255,0.06)] hover:border-[#6B9CFF]/50 transition-colors shadow-sm focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_3px_rgba(107,156,255,0.1)] appearance-none cursor-pointer disabled:opacity-50"
      />

      {/* Doctor Filter */}
      <select
        value={currentDoctor}
        onChange={(e) => updateFilter("doctorId", e.target.value)}
        disabled={isPending}
        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.15)] dark:border-[rgba(255,255,255,0.06)] hover:border-[#6B9CFF]/50 transition-colors shadow-sm focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_3px_rgba(107,156,255,0.1)] appearance-none cursor-pointer disabled:opacity-50"
      >
        <option value="">All Doctors</option>
        {doctors.map((doc) => (
          <option key={doc.id} value={doc.id}>{doc.name}</option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={currentStatus}
        onChange={(e) => updateFilter("status", e.target.value)}
        disabled={isPending}
        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.15)] dark:border-[rgba(255,255,255,0.06)] hover:border-[#6B9CFF]/50 transition-colors shadow-sm focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_3px_rgba(107,156,255,0.1)] appearance-none cursor-pointer disabled:opacity-50"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}