"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type FilterPeriod } from "@/lib/utils/date-filters"

const periods: { label: string; value: FilterPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
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
    <div className="inline-flex items-center gap-0.5 rounded-xl border border-gray-200/60 dark:border-white/[0.06] bg-white dark:bg-[#223247] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {periods.map((period) => {
        const isActive = currentPeriod === period.value
        return (
          <Button
            key={period.value}
            variant="ghost"
            size="sm"
            onClick={() => handlePeriodChange(period.value)}
            className={`text-[12px] font-medium rounded-lg h-7 px-3 transition-all duration-150 ${
              isActive
                ? "bg-[#6B9CFF] text-white hover:bg-[#6B9CFF] hover:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            {period.label}
          </Button>
        )
      })}
    </div>
  )
}