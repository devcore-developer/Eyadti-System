import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get("type") || "full"

    if (type === "revenue") {
      return exportRevenueReport()
    }

    return exportFullReport()
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvEscape).join(",") + "\n"
}

async function exportFullReport() {
  const [clinics, plans, subscriptions] = await Promise.all([
    prisma.clinic.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        subscription: { include: { plan: { select: { name: true } } } },
        _count: { select: { users: true, branches: true, patients: true, appointments: true, invoices: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" } }),
    prisma.subscription.findMany({
      include: { plan: { select: { name: true, monthlyPrice: true } }, clinic: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const csv: string[] = []

  // Section 1: Clinics
  csv.push("=== CLINICS ===")
  csv.push(toCsvRow(["Clinic Name", "Owner", "Owner Email", "Plan", "Status", "Users", "Branches", "Patients", "Appointments", "Invoices", "Created"]))
  for (const c of clinics) {
    csv.push(toCsvRow([
      c.name,
      c.owner?.name,
      c.owner?.email,
      c.subscription?.plan?.name || "None",
      c.subscription?.status || "No Subscription",
      c._count.users,
      c._count.branches,
      c._count.patients,
      c._count.appointments,
      c._count.invoices,
      c.createdAt.toISOString().split("T")[0],
    ]))
  }

  csv.push("")

  // Section 2: Plans
  csv.push("=== PLANS ===")
  csv.push(toCsvRow(["Plan Name", "Monthly Price (EGP)", "Yearly Price (EGP)", "Max Doctors", "Max Patients", "Max Branches"]))
  for (const p of plans) {
    csv.push(toCsvRow([
      p.name,
      Number(p.monthlyPrice),
      Number(p.yearlyPrice),
      p.maxDoctors,
      p.maxPatients,
      p.maxBranches,
    ]))
  }

  csv.push("")

  // Section 3: Subscriptions
  csv.push("=== SUBSCRIPTIONS ===")
  csv.push(toCsvRow(["Clinic", "Plan", "Status", "Start Date", "End Date", "Monthly Price"]))
  for (const s of subscriptions) {
    csv.push(toCsvRow([
      s.clinic?.name || "Unknown",
      s.plan?.name || "Unknown",
      s.status,
      s.startDate.toISOString().split("T")[0],
      s.endDate?.toISOString().split("T")[0] || "N/A",
      Number(s.plan?.monthlyPrice || 0),
    ]))
  }

  // Summary
  csv.push("")
  csv.push("=== SUMMARY ===")
  const totalClinics = clinics.length
  const activeClinics = clinics.filter(c => c.subscription?.status === "ACTIVE" || c.subscription?.status === "TRIAL").length
  const suspendedClinics = clinics.filter(c => c.subscription?.status === "SUSPENDED").length
  const totalPatients = clinics.reduce((s, c) => s + c._count.patients, 0)
  const totalUsers = clinics.reduce((s, c) => s + c._count.users, 0)
  const mrr = subscriptions.filter(s => s.status === "ACTIVE").reduce((s, sub) => s + Number(sub.plan?.monthlyPrice || 0), 0)

  csv.push(toCsvRow(["Metric", "Value"]))
  csv.push(toCsvRow(["Total Clinics", totalClinics]))
  csv.push(toCsvRow(["Active Clinics", activeClinics]))
  csv.push(toCsvRow(["Suspended Clinics", suspendedClinics]))
  csv.push(toCsvRow(["Total Patients", totalPatients]))
  csv.push(toCsvRow(["Total Users", totalUsers]))
  csv.push(toCsvRow(["Monthly Recurring Revenue (EGP)", mrr]))
  csv.push(toCsvRow(["Annual Run Rate (EGP)", mrr * 12]))
  csv.push(toCsvRow(["Export Date", new Date().toISOString()]))

  const csvContent = csv.join("")
  const fileName = `nexora-report-${new Date().toISOString().split("T")[0]}.csv`

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}

async function exportRevenueReport() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const invoices = await prisma.invoice.findMany({
    where: { status: "PAID", createdAt: { gte: sixMonthsAgo } },
    include: { clinic: { select: { name: true } }, patient: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  })

  const csv: string[] = []
  csv.push(toCsvRow(["Invoice ID", "Clinic", "Patient", "Amount (EGP)", "Status", "Date"]))
  for (const inv of invoices) {
    csv.push(toCsvRow([
      inv.invoiceNumber || inv.id,
      inv.clinic?.name || "Unknown",
      inv.patient?.fullName || "Unknown",
      Number(inv.amount),
      inv.status,
      inv.createdAt.toISOString().split("T")[0],
    ]))
  }

  const totalRevenue = invoices.reduce((s, inv) => s + Number(inv.amount), 0)
  csv.push("")
  csv.push(toCsvRow(["Total Revenue (EGP)", totalRevenue]))
  csv.push(toCsvRow(["Total Paid Invoices", invoices.length]))
  csv.push(toCsvRow(["Export Date", new Date().toISOString()]))

  const fileName = `nexora-revenue-${new Date().toISOString().split("T")[0]}.csv`

  return new NextResponse(csv.join(""), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}