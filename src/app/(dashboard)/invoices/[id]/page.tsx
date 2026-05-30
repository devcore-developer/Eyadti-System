// src/app/(dashboard)/invoices/[id]/page.tsx
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { UpdateInvoiceStatus } from "@/components/invoices/update-invoice-status"
import { InvoiceSummaryCard } from "@/components/invoices/invoice-summary-card"
import { OutstandingBalanceWidget } from "@/components/invoices/outstanding-balance-widget"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, CreditCard, RotateCcw, FileDown } from "lucide-react"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const { id } = await params

  const invoice = await prisma.invoice.findFirst({
    where: { id, clinicId: session.user.clinicId },
    include: {
      patient: { select: { id: true, fullName: true, phone: true, address: true } },
      items: true,
    },
  })

  if (!invoice) notFound()

  const safeAmount = Number(invoice.amount)
  const safeItems = invoice.items.map((item) => ({
    ...item,
    unitPrice: Number(item.unitPrice),
    lineTotal: item.quantity * Number(item.unitPrice),
  }))

  const canUpdateStatus = session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST"

  // Simplified calculation for demo (you should replace with real payment tracking later)
  const paidAmount = invoice.status === "PAID" ? safeAmount : (invoice.status === "PARTIAL" ? safeAmount * 0.5 : 0)
  const remainingAmount = safeAmount - paidAmount

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(date))
  }

  return (
    <div className="space-y-8 animate-fade pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/invoices" className="inline-flex items-center text-sm text-muted-foreground hover:text-[#6B9CFF] transition-colors mb-2">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Invoice #{invoice.id.slice(-5).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Issued on {formatDate(invoice.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <InvoiceStatusBadge status={invoice.status} />
          {canUpdateStatus && (
            <UpdateInvoiceStatus invoiceId={invoice.id} currentStatus={invoice.status} />
          )}
          <Button variant="outline" size="sm" className="rounded-xl border-dashed gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Invoice Details & Items (Printable Area) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Invoice Summary Card */}
          <InvoiceSummaryCard 
            totalAmount={safeAmount}
            paidAmount={paidAmount}
            remainingAmount={remainingAmount}
            status={invoice.status}
          />

          {/* Printable Invoice Content */}
          <div id="printable-invoice" className="premium-card p-8 space-y-8">
            {/* Clinic & Patient Header */}
            <div className="flex justify-between border-b border-[rgba(148,163,184,0.1)] pb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Eyadti Clinic</h2>
                <p className="text-sm text-muted-foreground">Medical Services</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Bill To:</p>
                <p className="text-sm font-semibold text-foreground">{invoice.patient.fullName}</p>
                <p className="text-sm text-muted-foreground">{invoice.patient.phone || ""}</p>
                <p className="text-sm text-muted-foreground">{invoice.patient.address || ""}</p>
              </div>
            </div>

            {/* Services Table */}
            <div>
              <div className="grid grid-cols-4 gap-4 pb-3 border-b border-[rgba(148,163,184,0.1)] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Price</span>
                <span className="text-right">Total</span>
              </div>
              <div className="divide-y divide-[rgba(148,163,184,0.05)]">
                {safeItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-4 gap-4 py-4 hover:bg-muted/30 transition-colors rounded-lg px-2">
                    <span className="text-sm font-medium text-foreground">{item.description}</span>
                    <span className="text-sm text-muted-foreground text-right">{item.quantity}</span>
                    <span className="text-sm text-muted-foreground text-right">{formatCurrency(item.unitPrice)}</span>
                    <span className="text-sm font-semibold text-foreground text-right">{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4 border-t border-[rgba(148,163,184,0.1)]">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(safeAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax (0%)</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between border-t border-[rgba(148,163,184,0.1)] pt-2 text-base font-bold text-foreground">
                  <span>Total Due</span>
                  <span>{formatCurrency(safeAmount)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Widgets & Actions */}
        <div className="space-y-8">
          
          {/* Outstanding Balance Widget */}
          <OutstandingBalanceWidget 
            totalOutstanding={remainingAmount}
            patientCount={1}
            invoiceId={invoice.id}
          />

          {/* Quick Actions */}
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_12px_30px_rgba(100,116,139,0.10)]">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/invoices/new">
                <Button variant="outline" className="w-full rounded-xl text-xs h-20 flex flex-col gap-1 border-dashed hover:bg-muted/50">
                  <FileDown className="h-4 w-4" /> New Invoice
                </Button>
              </Link>
              <Link href={`/invoices/${invoice.id}/pay`}>
                <Button className="w-full rounded-xl text-xs h-20 flex flex-col gap-1 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-md">
                  <CreditCard className="h-4 w-4" /> Record Pay
                </Button>
              </Link>
              <Link href="#">
                <Button variant="outline" className="w-full rounded-xl text-xs h-20 flex flex-col gap-1 border-dashed hover:bg-muted/50">
                  <RotateCcw className="h-4 w-4" /> Refund
                </Button>
              </Link>
              <Link href="#">
                <Button variant="outline" className="w-full rounded-xl text-xs h-20 flex flex-col gap-1 border-dashed hover:bg-muted/50">
                  <Printer className="h-4 w-4" /> Export PDF
                </Button>
              </Link>
            </div>
          </div>

          {/* Payment History Placeholder */}
          <div className="p-6 rounded-[24px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.06)]">
            <h3 className="text-lg font-semibold text-foreground mb-4">Payment History</h3>
            <div className="text-center py-8 text-sm text-muted-foreground">
              No payments recorded yet.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}