"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Filter } from "lucide-react"

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
    
    params.delete("page") // يرجع للصفحة الأولى لما نغير الفلتر

    startTransition(() => {
      router.push(`/patients?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Gender Filter */}
      <select
        value={currentGender}
        onChange={(e) => updateFilter("gender", e.target.value)}
        disabled={isPending}
        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.15)] dark:border-[rgba(255,255,255,0.06)] hover:border-[#6B9CFF]/50 transition-colors shadow-sm focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_3px_rgba(107,156,255,0.1)] appearance-none cursor-pointer disabled:opacity-50"
      >
        {genderOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Sort Filter */}
      <select
        value={currentSort}
        onChange={(e) => updateFilter("sort", e.target.value)}
        disabled={isPending}
        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.15)] dark:border-[rgba(255,255,255,0.06)] hover:border-[#6B9CFF]/50 transition-colors shadow-sm focus:outline-none focus:border-[#6B9CFF] focus:shadow-[0_0_0_3px_rgba(107,156,255,0.1)] appearance-none cursor-pointer disabled:opacity-50"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}