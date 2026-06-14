// components/patients/patient-filters.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

const genderOptions = [
  { label: "All Genders", value: "" },
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
]

const sortOptions = [
  { label: "Newest First", value: "desc" },
  { label: "Oldest First", value: "asc" },
]

export function PatientFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentGender = searchParams.get("gender") || ""
  const currentSort = searchParams.get("sort") || "desc"

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    params.delete("page")

    startTransition(() => {
      router.push(`/patients?${params.toString()}`)
    })
  }

  const selectClasses = "h-10 px-4 py-2 text-sm font-medium rounded-xl bg-white/90 dark:bg-[#223247]/50 backdrop-blur-sm border border-input shadow-sm hover:border-[#6B9CFF]/50 transition-all focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_4px_rgba(107,156,255,0.12)] appearance-none cursor-pointer disabled:opacity-50"

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentGender}
        onChange={(e) => updateFilter("gender", e.target.value)}
        disabled={isPending}
        className={selectClasses}
      >
        {genderOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={currentSort}
        onChange={(e) => updateFilter("sort", e.target.value)}
        disabled={isPending}
        className={selectClasses}
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}