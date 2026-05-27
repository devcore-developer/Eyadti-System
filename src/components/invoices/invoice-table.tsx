// src/components/invoices/invoice-table.tsx
import Link from "next/link"
import { InvoiceStatusBadge } from "./invoice-status-badge"

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD", // غيرها لو عملتك مختلفة
  }).format(amount)
}

function buildPageUrl(page: number, searchParams: Record<string, string>): string {
  const params = new URLSearchParams(searchParams)
  params.set("page", String(page))
  return `/invoices?${params.toString()}`
}

export function InvoiceTable({
  invoices,
  currentPage,
  totalPages,
  searchParams,
}: Props) {
  if (invoices.length === 0) {
    return <div className="py-12 text-center text-gray-500">No invoices found.</div>
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Invoice ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Patient</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  #...{inv.id.slice(-5)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  <Link href={`/patients/${inv.patient.id}`} className="text-blue-600 hover:underline">
                    {inv.patient.fullName}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(inv.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <InvoiceStatusBadge status={inv.status as any} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {formatDate(inv.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={buildPageUrl(currentPage - 1, searchParams)} className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Previous</Link>
            )}
            {currentPage < totalPages && (
              <Link href={buildPageUrl(currentPage + 1, searchParams)} className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Next</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}