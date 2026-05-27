// src/app/(dashboard)/invoices/new/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { InvoiceForm } from "@/components/invoices/invoice-form"

export default async function NewInvoicePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") redirect("/invoices")

  const patients = await prisma.patient.findMany({
    where: { clinicId: session.user.clinicId },
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