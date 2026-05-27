// src/app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link" // ← أضفنا الـ Link
import {
  getDashboardStats,
  getChartData,
  getRecentActivity,
  getDoctorAnalytics,
} from "@/lib/queries/dashboard"
import { type FilterPeriod } from "@/lib/utils/date-filters"
import { formatCurrency } from "@/lib/utils/date-filters"
import { DateFilter } from "@/components/dashboard/date-filter"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { SubscriptionBanner } from "@/components/billing/subscription-banner"
import { HeroWelcome } from "@/components/dashboard/hero-welcome"
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts"
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments"
import { TopDoctors } from "@/components/dashboard/top-doctors"
import { QuickActions } from "@/components/dashboard/quick-actions"
import {
  Users,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse p-6">
      <div className="h-[280px] bg-muted/50 rounded-[28px]" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[180px] bg-muted/50 rounded-[24px]" />
        ))}
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 h-[400px] bg-muted/50 rounded-[24px]" />
        <div className="h-[400px] bg-muted/50 rounded-[24px]" />
      </div>
    </div>
  )
}

// ← Updated Premium KPI Card to accept href and become a Link
function PremiumKPICard({ title, value, subtitle, icon: Icon, accentColor, iconBg, lightBg, shadow, href }: any) {
  const content = (
    <div 
      className={`group relative overflow-hidden p-6 rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br ${lightBg} dark:from-[#223247] dark:to-[#1D2A3B] ${shadow} dark:shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_20px_45px_rgba(100,116,139,0.18)] animate-scale-in cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`h-6 w-6 ${accentColor}`} />
        </div>
      </div>
      <h3 className="text-[32px] font-bold text-foreground tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
      <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
    </div>
  )

  // لو فيه رابط، خليه Clickable، لو مفيش خليه Div عادي
  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  return content
}

async function DashboardContent({ period }: { period: FilterPeriod }) {
  const session = await auth()
  if (!session?.user?.clinicId) redirect("/login")
  const clinicId = session.user.clinicId

  const [stats, chartData, recentActivity, doctorAnalytics] = await Promise.all([
    getDashboardStats(clinicId, period),
    getChartData(clinicId),
    getRecentActivity(clinicId),
    getDoctorAnalytics(clinicId),
  ])

  const doctorName = session.user.name || "Doctor"

  return (
    <div className="space-y-8 animate-fade">
      <SubscriptionBanner />

      <div className="flex flex-col gap-4">
        <HeroWelcome 
          doctorName={doctorName} 
          appointmentsCount={stats.todayAppointments} 
          pendingInvoices={stats.unpaidInvoicesCount} 
        />
        <div className="flex justify-end -mt-4 mr-2 z-10 relative">
          <Suspense fallback={null}>
            <DateFilter />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <PremiumKPICard 
          title="Total Patients"
          value={stats.totalPatients.toLocaleString()}
          subtitle={`${stats.newPatients} new this period`}
          icon={Users}
          accentColor="text-[#5BC0BE]"
          iconBg="bg-[#5BC0BE]/10"
          lightBg="from-[#F5FFFF] to-[#EAFBF9]"
          shadow="shadow-[0_15px_35px_rgba(91,192,190,0.12)]"
          href="/patients" // ← الرابط الجديد
        />
        <PremiumKPICard 
          title="Today's Appointments"
          value={stats.todayAppointments.toString()}
          subtitle={`${stats.upcomingAppointments} upcoming`}
          icon={CalendarCheck}
          accentColor="text-[#6B9CFF]"
          iconBg="bg-[#6B9CFF]/10"
          lightBg="from-[#F8FFFF] to-[#EDF9FF]"
          shadow="shadow-[0_15px_35px_rgba(107,156,255,0.12)]"
          href="/appointments" // ← الرابط الجديد
        />
        <PremiumKPICard 
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          subtitle={`${formatCurrency(stats.totalRevenue)} total`}
          icon={TrendingUp}
          accentColor="text-[#6B9CFF]"
          iconBg="bg-[#6B9CFF]/10"
          lightBg="from-[#F5F8FF] to-[#EEF3FF]"
          shadow="shadow-[0_15px_35px_rgba(100,116,139,0.12)]"
          href="/invoices" // ← الرابط الجديد
        />
        <PremiumKPICard 
          title="Unpaid Invoices"
          value={stats.unpaidInvoicesCount.toString()}
          subtitle={formatCurrency(stats.unpaidInvoicesAmount)}
          icon={AlertCircle}
          accentColor="text-[#F4B860]"
          iconBg="bg-[#F4B860]/10"
          lightBg="from-[#FFF9EE] to-[#FFF4DD]"
          shadow="shadow-[0_15px_35px_rgba(100,116,139,0.12)]"
          href="/invoices?status=UNPAID" // ← الرابط الجديد (بيفلتر على طول)
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnalyticsCharts data={chartData} />
        </div>
        <div className="space-y-8">
          <UpcomingAppointments appointments={recentActivity.appointments.slice(0, 3)} />
          <TopDoctors doctors={doctorAnalytics} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentActivity
            patients={recentActivity.patients}
            appointments={recentActivity.appointments}
            invoices={recentActivity.invoices}
          />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const resolvedParams = await searchParams
  const period = (resolvedParams.period as FilterPeriod) || "month"

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent period={period} />
    </Suspense>
  )
}