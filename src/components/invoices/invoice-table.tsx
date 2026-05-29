import Link from "next/link"
import { InvoiceStatusBadge } from "./invoice-status-badge"
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
    return <div className="py-12 text-center text-gray-500">No invoices found.</div>
  }

  return (
    <div className="space-y-4">
      
      {/* ━━━ DESKTOP TABLE ━━━ */}
      <div className="hidden md:block rounded-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1D2A3B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-[#223247]/50 border-b border-[rgba(148,163,184,0.1)]">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Invoice ID</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Patient</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-[#223247]/30 transition-colors">
                  <td className="p-4 font-medium font-mono text-xs">#...{inv.id.slice(-5)}</td>
                  <td className="p-4">
                    <Link href={`/patients/${inv.patient.id}`} className="text-blue-600 hover:underline">
                      {inv.patient.fullName}
                    </Link>
                  </td>
                  <td className="p-4 text-right font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="p-4"><InvoiceStatusBadge status={inv.status as any} /></td>
                  <td className="p-4 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                  <td className="p-4 text-right">
                    <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ━━━ MOBILE CARDS ━━━ */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {invoices.map((inv) => (
          <Link key={inv.id} href={`/invoices/${inv.id}`} className="block">
            <MobileCard>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm">{inv.patient.fullName}</h3>
                <InvoiceStatusBadge status={inv.status as any} />
              </div>
              <MobileCardItem label="Amount" value={<span className="font-bold text-foreground">{formatCurrency(inv.amount)}</span>} />
              <MobileCardItem label="Date" value={formatDate(inv.createdAt)} />
              <div className="mt-2 text-right">
                <span className="text-[10px] font-mono text-muted-foreground">ID: ...{inv.id.slice(-5)}</span>
              </div>
            </MobileCard>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Link href={buildPageUrl(currentPage - 1, searchParams)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
          <Link href={buildPageUrl(currentPage + 1, searchParams)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      )}
    </div>
  )
}