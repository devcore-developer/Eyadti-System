import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge" // أو billing حسب مسمياتك
import { UpdateInvoiceStatus } from "@/components/invoices/update-invoice-status" // أو billing

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let session;
  try {
    session = await requireRole("ADMIN", "DOCTOR", "RECEPTIONIST")
  } catch (error) {
    // استخدام error.name بدل instanceof عشان نتجنب أخطاء الـ Webpack
    if ((error as any)?.name === "AuthenticationError") redirect("/login")
    if ((error as any)?.name === "AuthorizationError") redirect("/dashboard")
    throw error
  }

  const { id } = await params

  const invoice = await prisma.invoice.findFirst({
    where: { id, clinicId: session.clinicId },
    include: {
      patient: { select: { id: true, fullName: true, phone: true, address: true } },
      items: true,
    },
  })

  if (!invoice) notFound()

  // ─── الحل السحري: تحويل الـ Decimal لـ Number ──────────────────────────────
  const safeAmount = Number(invoice.amount)
  const safeItems = invoice.items.map((item) => ({
    ...item,
    unitPrice: Number(item.unitPrice),
    lineTotal: item.quantity * Number(item.unitPrice), // الحساب ده بقى أمن 100%
  }))

  const canUpdateStatus = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST"

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/invoices" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Invoices
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Invoice #{invoice.id.slice(-5).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Issued on {formatDate(invoice.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <InvoiceStatusBadge status={invoice.status} />
          {canUpdateStatus && (
            <UpdateInvoiceStatus invoiceId={invoice.id} currentStatus={invoice.status} />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow">
        <div className="flex justify-between border-b pb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Clinic Name</h2>
            <p className="text-sm text-gray-500">Medical Services</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Bill To:</p>
            <p className="text-sm text-gray-900">{invoice.patient.fullName}</p>
            <p className="text-sm text-gray-500">{invoice.patient.phone || ""}</p>
            <p className="text-sm text-gray-500">{invoice.patient.address || ""}</p>
          </div>
        </div>

        <div className="mt-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                <th className="pb-3 text-right text-xs font-medium uppercase text-gray-500">Qty</th>
                <th className="pb-3 text-right text-xs font-medium uppercase text-gray-500">Price</th>
                <th className="pb-3 text-right text-xs font-medium uppercase text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* استخدام الـ safeItems اللي حولناها بدل invoice.items */}
              {safeItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="py-4 text-right text-sm text-gray-500">{item.quantity}</td>
                  <td className="py-4 text-right text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end border-t pt-6">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(safeAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
              <span>Total Due</span>
              <span>{formatCurrency(safeAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}