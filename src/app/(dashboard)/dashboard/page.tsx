// app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
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
import { CardSkeleton, ChartSkeleton } from "@/components/ui/premium-skeletons"
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
    <div className="space-y-8 animate-pulse">
      <div className="h-[240px] md:h-[280px] rounded-[24px] bg-muted/30" />
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ChartSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

function PremiumKPICard({ title, value, subtitle, icon: Icon, accentColor, iconBg, lightBg, shadow, href, index = 0 }: any) {
  const content = (
    <div 
      className={`group relative overflow-hidden p-5 md:p-6 rounded-2xl md:rounded-[20px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br ${lightBg} dark:from-[#223247] dark:to-[#1D2A3B] ${shadow} dark:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(100,116,139,0.18)] animate-fade-in-up cursor-pointer h-full`}
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/30 dark:bg-white/5 blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm ${iconBg}`}>
          <Icon className={`h-5 w-5 ${accentColor}`} />
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-2xl md:text-[28px] font-extrabold text-foreground tracking-tight truncate">{value}</h3>
        <p className="text-sm font-semibold text-foreground/80 mt-1 truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-2 truncate">{subtitle}</p>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>
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
    <div className="space-y-6 md:space-y-8">
      <SubscriptionBanner />

      <div className="flex flex-col gap-4">
        <HeroWelcome 
          doctorName={doctorName} 
          appointmentsCount={stats.todayAppointments} 
          pendingInvoices={stats.unpaidInvoicesCount} 
        />
        <div className="flex justify-center sm:justify-end z-10 relative">
          <Suspense fallback={null}>
            <DateFilter />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-6 lg:gap-8 xl:grid-cols-4">
        <PremiumKPICard 
          title="Patients"
          value={stats.totalPatients.toLocaleString()}
          subtitle={`${stats.newPatients} new`}
          icon={Users}
          accentColor="text-[#5BC0BE]"
          iconBg="bg-[#5BC0BE]/10"
          lightBg="from-[#F5FFFF] to-[#EAFBF9]"
          shadow="shadow-[0_8px_24px_rgba(91,192,190,0.10)]"
          href="/patients"
          index={0}
        />
        <PremiumKPICard 
          title="Appointments"
          value={stats.todayAppointments.toString()}
          subtitle={`${stats.upcomingAppointments} upcoming`}
          icon={CalendarCheck}
          accentColor="text-[#6B9CFF]"
          iconBg="bg-[#6B9CFF]/10"
          lightBg="from-[#F8FFFF] to-[#EDF9FF]"
          shadow="shadow-[0_8px_24px_rgba(107,156,255,0.10)]"
          href="/appointments"
          index={1}
        />
        <PremiumKPICard 
          title="Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          subtitle={`${formatCurrency(stats.totalRevenue)} total`}
          icon={TrendingUp}
          accentColor="text-[#6B9CFF]"
          iconBg="bg-[#6B9CFF]/10"
          lightBg="from-[#F5F8FF] to-[#EEF3FF]"
          shadow="shadow-[0_8px_24px_rgba(100,116,139,0.08)]"
          href="/invoices"
          index={2}
        />
        <PremiumKPICard 
          title="Unpaid"
          value={stats.unpaidInvoicesCount.toString()}
          subtitle={formatCurrency(stats.unpaidInvoicesAmount)}
          icon={AlertCircle}
          accentColor="text-[#F4B860]"
          iconBg="bg-[#F4B860]/10"
          lightBg="from-[#FFF9EE] to-[#FFF4DD]"
          shadow="shadow-[0_8px_24px_rgba(100,116,139,0.08)]"
          href="/invoices?status=UNPAID"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <AnalyticsCharts data={chartData} />
        </div>
        <div className="space-y-6 md:space-y-8">
          <UpcomingAppointments appointments={recentActivity.appointments.slice(0, 3)} />
          <TopDoctors doctors={doctorAnalytics} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
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