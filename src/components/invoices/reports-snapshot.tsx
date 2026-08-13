"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Stethoscope, Building2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils/date-filters"
import { EmptyState } from "@/components/shared/empty-state"

interface DoctorRevenueItem {
  name: string
  revenue: number
  invoiceCount: number
}

interface BranchRevenueItem {
  branchId: string | null
  branchName: string
  revenue: number
  invoiceCount: number
}

interface ReportsSnapshotProps {
  revenueByDoctor: DoctorRevenueItem[]
  revenueByBranch: BranchRevenueItem[]
}

export function ReportsSnapshot({ revenueByDoctor, revenueByBranch }: ReportsSnapshotProps) {
  const maxDoctorRevenue = Math.max(...revenueByDoctor.map(d => d.revenue), 1)
  const maxBranchRevenue = Math.max(...revenueByBranch.map(b => b.revenue), 1)

  const hasDoctors = revenueByDoctor.length > 0
  const hasBranches = revenueByBranch.length > 0

  if (!hasDoctors && !hasBranches) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
          <EmptyState icon={Stethoscope} title="No doctor revenue yet" description="Revenue will appear here once paid invoices are linked to doctor appointments." />
        </div>
        <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
          <EmptyState icon={Building2} title="No branch revenue yet" description="Revenue will appear here once paid invoices are recorded." />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Revenue by Doctor */}
      <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
        <div className="flex items-center gap-2 mb-6">
          <Stethoscope className="h-5 w-5 text-[#5BC0BE]" />
          <h3 className="text-lg font-semibold text-foreground">Revenue by Doctor</h3>
        </div>
        {hasDoctors ? (
          <div className="space-y-4">
            {revenueByDoctor.map((doc, index) => {
              const widthPct = Math.max(8, (doc.revenue / maxDoctorRevenue) * 100)
              const initials = doc.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
              return (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <Avatar className="h-9 w-9 border-2 border-[#5BC0BE]/20">
                    <AvatarFallback className="bg-[#5BC0BE]/10 text-[#5BC0BE] font-semibold text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1.5">
                      <div
                        className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-foreground">{formatCurrency(doc.revenue)}</span>
                    <p className="text-[10px] text-muted-foreground">{doc.invoiceCount} invoice{doc.invoiceCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={Stethoscope} title="No doctor revenue yet" description="Revenue appears once paid invoices are linked to appointments." />
        )}
      </div>

      {/* Revenue by Branch */}
      <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-5 w-5 text-[#6B9CFF]" />
          <h3 className="text-lg font-semibold text-foreground">Revenue by Branch</h3>
        </div>
        {hasBranches ? (
          <div className="space-y-4">
            {revenueByBranch.map((branch, index) => {
              const widthPct = Math.max(8, (branch.revenue / maxBranchRevenue) * 100)
              return (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="p-2 rounded-lg bg-[#6B9CFF]/10 shrink-0">
                    <Building2 className="h-5 w-5 text-[#6B9CFF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{branch.branchName}</p>
                    <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1.5">
                      <div
                        className="bg-gradient-to-r from-[#6B9CFF] to-[#89D6D2] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-foreground">{formatCurrency(branch.revenue)}</span>
                    <p className="text-[10px] text-muted-foreground">{branch.invoiceCount} invoice{branch.invoiceCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={Building2} title="No branch revenue yet" description="Revenue appears once paid invoices are recorded." />
        )}
      </div>
    </div>
  )
}