// src/app/(dashboard)/invoices/new/page.tsx
import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { InvoiceForm } from "@/components/invoices/invoice-form"

export default async function NewInvoicePage() {
  let session;
  try {
    // الأدمن والريسبشنيست بس اللي يقدروا يفتحوا فاتورة
    session = await requireRole("ADMIN", "RECEPTIONIST")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") redirect("/login")
    if (error instanceof AuthorizationError) redirect("/invoices")
    throw error
  }

  const patients = await prisma.patient.findMany({
    where: { clinicId: session.clinicId },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/invoices"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Invoices
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Create New Invoice
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details and add items to the invoice.
        </p>
      </div>
      <InvoiceForm patients={patients} />
    </div>
  )
}