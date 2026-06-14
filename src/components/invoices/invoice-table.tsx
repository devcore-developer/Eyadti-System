// components/invoices/invoice-table.tsx
"use client" // ✨ إضافة ده عشان نحل مشكلة الـ Event handlers Error

import Link from "next/link"
import { InvoiceStatusBadge } from "./invoice-status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react"

type InvoiceRow = {
  id: string
  amount: number
  status: string
  createdAt: Date
  patient: { id: string; fullName: string }
}

type Props = {
  invoices: InvoiceRow[]
  currentPage: number
  totalPages: number
  searchParams: Record<string, string>
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date))
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

function buildPageUrl(page: number, searchParams: Record<string, string>): string {
  const params = new URLSearchParams(searchParams)
  params.set("page", String(page))
  return `/invoices?${params.toString()}`
}

export function InvoiceTable({ invoices, currentPage, totalPages, searchParams }: Props) {
  if (invoices.length === 0) {
    return (
      <EmptyState 
        icon={Receipt} 
        title="No invoices found" 
        description="There are no invoices matching your criteria yet." 
        actionLabel="Create Invoice"
        onAction={() => window.location.href = "/invoices/new"}
      />
    )
  }

  return (
    <div className="space-y-4">
      
      {/* ━━━ DESKTOP TABLE ━━━ */}
      <div className="hidden md:block premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="premium-table-header">
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Invoice ID</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Patient</th>
                <th className="text-right px-6 py-4 font-semibold text-muted-foreground">Amount</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Date</th>
                <th className="text-right px-6 py-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="premium-table-row border-b border-border/50 last:border-0">
                  <td className="px-6 py-4 font-medium font-mono text-xs text-muted-foreground">#...{inv.id.slice(-5)}</td>
                  <td className="px-6 py-4">
                    <Link href={`/patients/${inv.patient.id}`} className="text-[#6B9CFF] hover:underline transition-colors font-medium">
                      {inv.patient.fullName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold tabular-nums">{formatCurrency(inv.amount)}</td>
                  <td className="px-6 py-4"><InvoiceStatusBadge status={inv.status as any} /></td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/invoices/${inv.id}`} className="text-xs font-semibold text-[#6B9CFF] hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ━━━ MOBILE CARDS ━━━ */}
      <div className="grid grid-cols-1 gap-2 md:hidden">
        {invoices.map((inv) => (
          <Link key={inv.id} href={`/invoices/${inv.id}`} className="block">
            <MobileCard className="rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm truncate mr-2">{inv.patient.fullName}</h3>
                <InvoiceStatusBadge status={inv.status as any} />
              </div>
              <MobileCardItem label="Amount" value={<span className="font-bold text-foreground tabular-nums">{formatCurrency(inv.amount)}</span>} />
              <MobileCardItem label="Date" value={formatDate(inv.createdAt)} />
            </MobileCard>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href={buildPageUrl(currentPage - 1, searchParams)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage <= 1} className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <span className="text-sm text-muted-foreground font-medium">{currentPage} / {totalPages}</span>
          <Link href={buildPageUrl(currentPage + 1, searchParams)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage >= totalPages} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      )}
    </div>
  )
}