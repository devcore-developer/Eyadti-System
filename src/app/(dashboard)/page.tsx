// src/app/(dashboard)/page.tsx

import { HeroWelcome } from "@/components/dashboard/hero-welcome"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments"
import { TopDoctors } from "@/components/dashboard/top-doctors"
import { QuickActions } from "@/components/dashboard/quick-actions"

export default function DashboardPage() {
  const mockActivityData = {
    patients: [],
    appointments: [],
    invoices: []
  };

  return (
    <div className="space-y-8 animate-fade">
      <HeroWelcome 
        doctorName="Ahmed" 
        clinicName="Eyadti Clinic" 
        branchName="Main Branch" 
        appointmentsCount={18} 
        pendingInvoices={3} 
      />

      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnalyticsCharts />
        </div>

        <div className="space-y-8">
          <UpcomingAppointments />
          {/* تم تمرير doctors كـ Array فاضي عشان يحل الـ TypeScript Error */}
          <TopDoctors doctors={[]} />
        </div>
      </div>

      <RecentActivity {...mockActivityData} />

      <QuickActions />
    </div>
  )
}