"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, X } from "lucide-react"

export function PatientSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get("search") || ""
  const [value, setValue] = useState(currentSearch)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) {
      params.set("search", value.trim())
    } else {
      params.delete("search")
    }
    params.delete("page")
    startTransition(() => {
      router.push(`/patients?${params.toString()}`)
    })
  }

  function clearSearch() {
    setValue("")
    startTransition(() => router.push("/patients"))
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-xl">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by name, phone, national ID, patient ID..."
          className="h-12 w-full rounded-2xl border border-[rgba(148,163,184,0.15)] bg-white dark:bg-[#223247] pl-12 pr-10 text-sm placeholder:text-muted-foreground focus:border-[#6B9CFF] focus:outline-none focus:shadow-[0_0_0_4px_rgba(107,156,255,0.12)] transition-all duration-200"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-2xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 disabled:opacity-50"
      >
        Search
      </button>
      {currentSearch && (
        <button
          type="button"
          onClick={clearSearch}
          className="rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Clear
        </button>
      )}
    </form>
  )
}