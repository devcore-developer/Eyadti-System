import { getPlatformStats, getAllClinics } from "@/lib/actions/admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuperAdminDashboard } from "@/components/super-admin/dashboard"

export default async function SuperAdminPage() {
  const session = await auth()
  
  // حماية الصفحة: السماح فقط لـ Super Admin
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  // جلب البيانات بشكل متوازي لتسريع الأداء
  const [stats, clinics] = await Promise.all([
    getPlatformStats(),
    getAllClinics()
  ])

  return <SuperAdminDashboard initialStats={stats} initialClinics={clinics} />
}