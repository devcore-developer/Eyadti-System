import { getAllSubscribers } from "@/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuperAdminDashboard } from "@/components/super-admin/dashboard"

export default async function SuperAdminPage() {
  const session = await auth()
  // حماية الصفحة دي
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const subscribers = await getAllSubscribers()

  return <SuperAdminDashboard subscribers={subscribers} />
}