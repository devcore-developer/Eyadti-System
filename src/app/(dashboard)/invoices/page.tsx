// src/app/(dashboard)/invoices/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { InvoiceFilters } from "@/components/invoices/invoice-filters"
import { InvoiceHeader } from "@/components/invoices/invoice-header"
import { InvoiceKPIs } from "@/components/invoices/invoice-kpis"
import { InvoiceAnalytics } from "@/components/invoices/invoice-analytics"
import { QuickInvoiceActions } from "@/components/invoices/quick-invoice-actions"
import { ReportsSnapshot } from "@/components/invoices/reports-snapshot"

const PAGE_SIZE = 20
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

// ── Helper: Process 12-Month Chart Data ──────────────────────────
function processMonthlyData(
  invoices: { amount: any; status: string; createdAt: Date }[]
) {
  const now = new Date()
  const months: Record<
    string,
    { revenue: number; outstanding: number; collected: number; invoiceCount: number }
  > = {}

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    months[key] = { revenue: 0, outstanding: 0, collected: 0, invoiceCount: 0 }
  }

  for (const inv of invoices) {
    const d = new Date(inv.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!months[key]) continue

    const amount = Number(inv.amount)
    months[key].invoiceCount++

    if (inv.status === "PAID") {
      months[key].revenue += amount
      months[key].collected += amount
    } else if (inv.status === "OVERDUE") {
      months[key].outstanding += amount
      months[key].revenue += amount
    } else {
      months[key].outstanding += amount
    }
  }

  const monthLabels = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  return Object.entries(months).map(([key, data]) => {
    const monthIndex = parseInt(key.split("-")[1]) - 1
    return {
      name: monthLabels[monthIndex],
      revenue: data.revenue,
      collections: data.collected,
      outstanding: data.outstanding,
      invoices: data.invoiceCount,
    }
  })
}

// ── Main Page Component ──────────────────────────────────────────
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const filterStatus = typeof params.status === "string" ? params.status : ""
  const searchQuery = typeof params.search === "string" ? params.search : ""

  const clinicId = session.user.clinicId
  const baseWhere = { clinicId }
  const where: any = { ...baseWhere }
  if (filterStatus) where.status = filterStatus

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  // Use `as any` on status arrays and select objects to bypass strict TS 
  // checks until `npx prisma generate` is run to register the new Enum/Fields
  const [
    rawInvoices,
    total,
    monthlyPaidAgg,
    prevMonthlyPaidAgg,
    prevOutstandingAgg,
    totalPaidAgg,
    outstandingAgg,
    monthlyInvoiceCount,
    totalInvoiceCount,
    chartRawData,
    branchRevenueRaw,
    outstandingInvoices,
    recentPaidWithItems,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, amount: true, method: true, createdAt: true },
        },
      } as any, // ← Bypass TS until Prisma is regenerated
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where: { ...baseWhere, status: "PAID", createdAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { ...baseWhere, status: "PAID", createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { ...baseWhere, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } as any, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { ...baseWhere, status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { ...baseWhere, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } as any },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.count({
      where: { ...baseWhere, createdAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.invoice.count({ where: baseWhere }),
    prisma.invoice.findMany({
      where: { ...baseWhere, createdAt: { gte: twelveMonthsAgo } },
      select: { amount: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invoice.groupBy({
      by: ["branchId"],
      where: { ...baseWhere, status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { ...baseWhere, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } as any },
      select: {
        id: true,
        amount: true,
        status: true,
        dueDate: true,
        createdAt: true,
        patient: { select: { id: true, fullName: true, phone: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, amount: true },
        },
      } as any, // ← Bypass TS until Prisma is regenerated
      orderBy: { amount: "desc" },
      take: 20,
    }),
    prisma.invoice.findMany({
      where: { ...baseWhere, status: "PAID" },
      select: {
        items: {
          select: { description: true, unitPrice: true, quantity: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
  ])

  const branchIds = branchRevenueRaw.map((r) => r.branchId).filter(Boolean) as string[]
  const branches = branchIds.length > 0
    ? await prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true },
      })
    : []
  const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]))

  const invoices = (rawInvoices as any[]).map((inv: any) => ({
    ...inv,
    amount: Number(inv.amount),
    tax: Number(inv.tax || 0),
    discount: Number(inv.discount || 0),
    dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString() : null,
    payments: inv.payments?.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      createdAt: new Date(p.createdAt).toISOString(),
    })) || [],
  }))

  const monthlyRevenue = Number(monthlyPaidAgg._sum?.amount || 0)
  const prevMonthRevenue = Number(prevMonthlyPaidAgg._sum?.amount || 0)
  const totalRevenue = Number(totalPaidAgg._sum?.amount || 0)
  const outstandingBalance = Number(outstandingAgg._sum?.amount || 0)
  const prevOutstanding = Number(prevOutstandingAgg._sum?.amount || 0)
  const totalExpected = totalRevenue + outstandingBalance
  const collectionRate = totalExpected > 0
    ? Math.round((totalRevenue / totalExpected) * 100)
    : 0

  const revenueTrend = prevMonthRevenue > 0
    ? Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : monthlyRevenue > 0 ? 100 : 0

  const monthlyChartData = processMonthlyData(chartRawData)

  const serviceMap = new Map<string, { revenue: number; count: number }>()
  for (const inv of recentPaidWithItems) {
    for (const item of inv.items) {
      const existing = serviceMap.get(item.description) || { revenue: 0, count: 0 }
      existing.revenue += Number(item.unitPrice) * item.quantity
      existing.count += 1
      serviceMap.set(item.description, existing)
    }
  }
  const topServicesData = Array.from(serviceMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const revenueByBranchData = branchRevenueRaw.map((r) => ({
    branchId: r.branchId || null,
    branchName: r.branchId ? branchMap[r.branchId] || "Unknown Branch" : "Main Branch",
    revenue: Number(r._sum.amount || 0),
    invoiceCount: r._count,
  }))

  const patientOutstandingMap = new Map<
    string,
    {
      patientId: string
      patientName: string
      patientPhone: string
      totalDue: number
      invoiceCount: number
      lastPaymentDate: string | null
    }
  >()

  for (const inv of outstandingInvoices as any[]) {
    const patientId = inv.patient?.id || inv.patientId
    const patientName = inv.patient?.fullName || "Unknown"
    const patientPhone = inv.patient?.phone || ""
    
    const existing = patientOutstandingMap.get(patientId) || {
      patientId,
      patientName,
      patientPhone,
      totalDue: 0,
      invoiceCount: 0,
      lastPaymentDate: null as string | null,
    }
    existing.totalDue += Number(inv.amount)
    existing.invoiceCount += 1
    if (inv.payments?.[0]?.createdAt) {
      const payDate = new Date(inv.payments[0].createdAt).toISOString()
      if (!existing.lastPaymentDate || payDate > existing.lastPaymentDate) {
        existing.lastPaymentDate = payDate
      }
    }
    patientOutstandingMap.set(patientId, existing)
  }

  const outstandingPatientsData = Array.from(patientOutstandingMap.values())
    .sort((a, b) => b.totalDue - a.totalDue)
    .slice(0, 10)

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const canCreate = session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST"

  const serializableParams: Record<string, string> = {}
  if (filterStatus) serializableParams.status = filterStatus
  if (searchQuery) serializableParams.search = searchQuery

  return (
    <div className="space-y-8 animate-fade pb-20">
      
      {/* Phase 22E: Financial Overview Hero */}
      <InvoiceHeader 
        monthlyRevenue={monthlyRevenue}
        collectionRate={collectionRate}
        outstandingBalance={outstandingBalance}
      />
      
      {/* Phase 22E: Financial KPI Cards */}
      <InvoiceKPIs 
        monthlyRevenue={monthlyRevenue}
        totalRevenue={totalRevenue}
        outstandingBalance={outstandingBalance}
        collectionRate={collectionRate}
      />

      {/* Phase 22E: Financial Analytics Charts */}
      <InvoiceAnalytics 
        data={monthlyChartData}
      />

      {/* Phase 22E: Reports Snapshot */}
      <ReportsSnapshot />

      {/* Search, Filters & Create Invoice */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Suspense 
          fallback={
            <div className="h-12 w-full max-w-xl bg-muted/50 rounded-2xl animate-pulse" />
          }
        >
          <InvoiceFilters />
        </Suspense>
        
        {canCreate && (
          <Link href="/invoices/new" className="w-full md:w-auto">
            <Button className="w-full md:w-auto gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 rounded-xl px-5 py-3 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Create Invoice
            </Button>
          </Link>
        )}
      </div>

      {/* Premium Invoice Table Container */}
      <div className="overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] shadow-[0_15px_35px_rgba(100,116,139,0.10)] p-6">
        <InvoiceTable
          invoices={invoices}
          currentPage={page}
          totalPages={totalPages}
          searchParams={serializableParams}
        />
      </div>

      {/* Phase 22E: Floating Quick Actions */}
      <QuickInvoiceActions />

    </div>
  )
}