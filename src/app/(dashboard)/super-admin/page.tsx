import { getPlatformStats, getAllClinics, getDashboardSparklines, getRealSystemHealth } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuperAdminDashboard } from "@/components/super-admin/dashboard"

export default async function SuperAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const [stats, clinics, sparklines, health] = await Promise.all([
    getPlatformStats(),
    getAllClinics(),
    getDashboardSparklines(),
    getRealSystemHealth()
  ])

  return <SuperAdminDashboard initialStats={stats} initialClinics={clinics} initialSparklines={sparklines} initialHealth={health} />
}