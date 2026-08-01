"use client"

import { useState, useMemo } from "react"
import { CodeCopyButton } from "@/components/admin/code-copy-button"
import { CodeActions } from "@/components/admin/code-actions"
import { format } from "date-fns"
import { Search, Filter, ArrowUpDown, X } from "lucide-react"

interface CodeRecord {
  id: string
  code: string
  type: string
  status: string
  isUsed: boolean
  durationDays: number
  expiresAt: string | null
  createdAt: string
  usedAt: string | null
  plan: { id: string; name: string; slug: string } | null
  usedByClinic: { id: string; name: string } | null
  usedByUser: { id: string; name: string; email: string } | null
  createdByUser: { id: string; name: string; email: string } | null
  usedByEmail: string | null
}

interface Props {
  codes: CodeRecord[]
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "USED", label: "Used" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
]

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "SIGNUP", label: "Signup / Trial" },
  { value: "SUBSCRIPTION", label: "Subscription" },
]

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "durationDays-desc", label: "Longest Duration" },
  { value: "durationDays-asc", label: "Shortest Duration" },
  { value: "status-asc", label: "Status (A→Z)" },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Available",
    className:
      "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800",
  },
  USED: {
    label: "Used",
    className:
      "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800",
  },
  EXPIRED: {
    label: "Expired",
    className:
      "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800",
  },
  REVOKED: {
    label: "Revoked",
    className:
      "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800",
  },
}

export function ActivationCodesClient({ codes }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [sort, setSort] = useState("createdAt-desc")
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters =
    search !== "" || statusFilter !== "ALL" || typeFilter !== "ALL"

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("ALL")
    setTypeFilter("ALL")
  }

  const filteredCodes = useMemo(() => {
    let result = [...codes]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.usedByClinic?.name.toLowerCase().includes(q) ||
          c.usedByUser?.name.toLowerCase().includes(q) ||
          c.usedByUser?.email?.toLowerCase().includes(q) ||
          c.usedByEmail?.toLowerCase().includes(q) ||
          c.createdByUser?.name.toLowerCase().includes(q) ||
          c.createdByUser?.email?.toLowerCase().includes(q) ||
          c.plan?.name.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "ALL") {
      result = result.filter((c) => c.type === typeFilter)
    }

    // Sort
    const [sortField, sortDir] = sort.split("-") as [string, "asc" | "desc"]
    result.sort((a, b) => {
      const aVal = a[sortField as keyof CodeRecord]
      const bVal = b[sortField as keyof CodeRecord]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let comparison = 0
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal)
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal
      }

      return sortDir === "desc" ? -comparison : comparison
    })

    return result
  }, [codes, search, statusFilter, typeFilter, sort])

  return (
    <div className="space-y-4">
      {/* ── Search + Filter Toggle ─────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by code, clinic, email, plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? "border-primary bg-primary/5 text-primary"
              : "border-slate-200 dark:border-slate-700 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {(statusFilter !== "ALL" ? 1 : 0) + (typeFilter !== "ALL" ? 1 : 0)}
            </span>
          )}
        </button>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent pl-9 pr-6 text-sm text-muted-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Filter Dropdowns ────────────────────────────── */}
      {showFilters && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Results Count ───────────────────────────────── */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredCodes.length} of {codes.length} codes
      </div>

      {/* ── Code List ───────────────────────────────────── */}
      {filteredCodes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
          {hasActiveFilters
            ? "No codes match your filters."
            : "No codes found."}
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredCodes.map((code) => {
            const statusInfo = statusConfig[code.status] || statusConfig.AVAILABLE
            return (
              <div
                key={code.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {/* Row 1: Code + Actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {code.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted/50">
                      {code.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {code.status === "AVAILABLE" && (
                      <CodeCopyButton code={code.code} />
                    )}
                    <CodeActions
                      codeId={code.id}
                      status={code.status}
                      isUsed={code.isUsed}
                    />
                  </div>
                </div>

                {/* Row 2: Metadata */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span>{code.plan?.name || "No Plan"}</span>
                  <span>•</span>
                  <span>{code.durationDays} days</span>
                  <span>•</span>
                  <span>
                    Created {format(new Date(code.createdAt), "MMM d, yyyy")}
                  </span>
                  {code.expiresAt && (
                    <>
                      <span>•</span>
                      <span>
                        Expires{" "}
                        {format(new Date(code.expiresAt), "MMM d, yyyy")}
                      </span>
                    </>
                  )}
                </div>

                {/* Row 3: Usage info */}
                {code.status === "USED" && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-muted-foreground">
                    {code.usedByClinic && (
                      <span>
                        Clinic:{" "}
                        <span className="font-medium text-foreground">
                          {code.usedByClinic.name}
                        </span>
                      </span>
                    )}
                    {code.usedByUser && (
                      <span>
                        User:{" "}
                        <span className="font-medium text-foreground">
                          {code.usedByUser.name}
                        </span>
                      </span>
                    )}
                    {code.usedByEmail && (
                      <span>
                        Email:{" "}
                        <span className="font-medium text-foreground">
                          {code.usedByEmail}
                        </span>
                      </span>
                    )}
                    {code.usedAt && (
                      <span>
                        Used:{" "}
                        {format(new Date(code.usedAt), "MMM d, yyyy HH:mm")}
                      </span>
                    )}
                  </div>
                )}

                {/* Row 4: Creator info */}
                {code.createdByUser && (
                  <div className="mt-1.5 text-[11px] text-muted-foreground/70">
                    Created by: {code.createdByUser.name} (
                    {code.createdByUser.email})
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}