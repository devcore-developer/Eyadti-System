// components/appointments/appointment-filters.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SlidersHorizontal } from "lucide-react"

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

const premiumSelectClasses = "flex h-10 w-full rounded-xl border border-input bg-white/90 dark:bg-[#223247]/50 backdrop-blur-sm px-3 py-2 text-sm shadow-sm ring-offset-background transition-all focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_4px_rgba(107,156,255,0.12)] hover:border-[#6B9CFF]/50 appearance-none cursor-pointer disabled:opacity-50"

export function AppointmentFilters({ doctors }: AppointmentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
      setIsSheetOpen(false)
    })
  }

  const FilterControls = () => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <input 
        type="date" 
        value={currentDate}
        onChange={(e) => updateFilter("date", e.target.value)}
        className={`${premiumSelectClasses} cursor-pointer`}
      />

      <select
        value={currentDoctor}
        onChange={(e) => updateFilter("doctorId", e.target.value)}
        disabled={isPending}
        className={premiumSelectClasses}
      >
        <option value="">All Doctors</option>
        {doctors.map((doc) => (
          <option key={doc.id} value={doc.id}>{doc.name}</option>
        ))}
      </select>

      <select
        value={currentStatus}
        onChange={(e) => updateFilter("status", e.target.value)}
        disabled={isPending}
        className={premiumSelectClasses}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <>
      <div className="hidden md:block">
        <FilterControls />
      </div>

      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl h-10 border-dashed">
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {(currentDoctor || currentStatus || currentDate) && (
                <span className="flex h-2 w-2 rounded-full bg-[#6B9CFF]" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[24px] max-h-[60vh] dark:bg-[#1B2838]">
            <SheetHeader className="pb-4 border-b border-border">
              <SheetTitle>Filter Appointments</SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-4">
              <FilterControls />
              <Button variant="outline" className="w-full mt-4 rounded-xl" onClick={() => {
                router.push('/appointments');
                setIsSheetOpen(false);
              }}>Clear Filters</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}