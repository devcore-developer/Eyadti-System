import { getPlatformStats, getAllClinics } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuperAdminDashboard } from "@/components/super-admin/dashboard"

export default async function SuperAdminPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const [stats, clinics] = await Promise.all([
    getPlatformStats(),
    getAllClinics()
  ])

  return <SuperAdminDashboard initialStats={stats} initialClinics={clinics} />
}