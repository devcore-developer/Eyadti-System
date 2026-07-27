import {
  getPlatformStats, getAllClinics, getDashboardSparklines, getRealSystemHealth,
  getSubscriptionOverview, getClinicOverview, getPriorityAlerts, getSystemMetrics,
  getPlatformAuditLogs, getPlatformBillingData, getAnnouncements
} from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuperAdminDashboard } from "@/components/super-admin/dashboard"

export default async function SuperAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const [
    stats, clinics, sparklines, health,
    subscriptionOverview, clinicOverview, priorityAlerts,
    systemMetrics, auditLogs, billingData, announcements
  ] = await Promise.all([
    getPlatformStats(),
    getAllClinics(),
    getDashboardSparklines(),
    getRealSystemHealth(),
    getSubscriptionOverview(),
    getClinicOverview(),
    getPriorityAlerts(),
    getSystemMetrics(),
    getPlatformAuditLogs(),
    getPlatformBillingData(),
    getAnnouncements()
  ])

  return (
    <SuperAdminDashboard
      initialStats={stats}
      initialClinics={clinics}
      initialSparklines={sparklines}
      initialHealth={health}
      initialSubscriptionOverview={subscriptionOverview}
      initialClinicOverview={clinicOverview}
      initialPriorityAlerts={priorityAlerts}
      initialSystemMetrics={systemMetrics}
      initialAuditLogs={auditLogs}
      initialBillingData={billingData}
      initialAnnouncements={announcements}
    />
  )
}