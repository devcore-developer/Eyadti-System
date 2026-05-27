// src/components/dashboard/date-filter.tsx

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type FilterPeriod } from "@/lib/utils/date-filters"

const periods: { label: string; value: FilterPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
]

export function DateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPeriod = (searchParams.get("period") as FilterPeriod) || "month"

  const handlePeriodChange = (period: FilterPeriod) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", period)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-white p-1 shadow-sm">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={currentPeriod === period.value ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePeriodChange(period.value)}
          className="text-xs"
        >
          {period.label}
        </Button>
      ))}
    </div>
  )
}