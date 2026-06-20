import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 1. جلب بيانات العيادات للتقرير
    const clinics = await prisma.clinic.findMany({
      include: {
        subscription: { include: { plan: { select: { name: true, monthlyPrice: true } } } },
        owner: { select: { name: true, email: true } },
        _count: { select: { users: true, patients: true, branches: true, appointments: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    // 2. تحويل البيانات لصيغة CSV
    const headers = [
      "Clinic Name", 
      "Owner Name", 
      "Owner Email", 
      "Plan", 
      "Subscription Status", 
      "Monthly Price (EGP)",
      "Users Count", 
      "Patients Count", 
      "Branches Count",
      "Appointments Count",
      "Created At"
    ]
    
    const csvRows = [headers.join(",")]

    for (const clinic of clinics) {
      const row = [
        `"${clinic.name}"`,
        `"${clinic.owner?.name || "N/A"}"`,
        `"${clinic.owner?.email || "N/A"}"`,
        `"${clinic.subscription?.plan?.name || "No Plan"}"`,
        `"${clinic.subscription?.status || "INACTIVE"}"`,
        `${clinic.subscription?.plan?.monthlyPrice || 0}`,
        `${clinic._count.users}`,
        `${clinic._count.patients}`,
        `${clinic._count.branches}`,
        `${clinic._count.appointments}`,
        `"${new Date(clinic.createdAt).toLocaleDateString()}"`
      ]
      csvRows.push(row.join(","))
    }

    const csvData = csvRows.join("\n")

    // 3. إرسال الملف للمتصفح للتحميل
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="platform-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return new NextResponse("Failed to generate report", { status: 500 })
  }
}