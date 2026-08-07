import { auth } from "@/lib/auth"
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
  CalendarDays, Clock, UserPlus, FileText, Pill
} from "lucide-react"
import { Suspense } from "react"
import { MobileLayout, MobileBottomNav, MobileFab } from "./mobile-layout"
import { MobileDashboard } from "./mobile-dashboard"
import { prisma } from "@/lib/db"
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner"
import { AttendanceKPIs } from "@/components/dashboard/attendance-kpis"
import { getAttendanceStats } from "@/lib/actions/attendance"

export const dynamic = "force-dynamic"

function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-[180px] md:h-[200px] rounded-[24px] bg-muted/20" />
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChartSkeleton /></div>
        <div className="space-y-5"><CardSkeleton /><CardSkeleton /></div>
      </div>
    </div>
  )
}

function PremiumKPICard({ title, value, subtitle, icon: Icon, accentColor, iconBg, tint, href, index = 0 }: any) {
  const content = (
    <div 
      className="group relative overflow-hidden px-5 py-5 md:px-6 md:py-6 rounded-2xl border border-gray-100 dark:border-white/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 cursor-pointer h-full"
      style={{ backgroundColor: tint, animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`h-[18px] w-[18px] ${accentColor}`} />
        </div>
      </div>
      <div>
        <h3 className="text-[1.625rem] md:text-[1.75rem] font-bold text-foreground tracking-tight tabular-nums leading-none truncate">{value}</h3>
        <p className="text-[12px] font-semibold text-foreground/60 mt-1.5 truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">{subtitle}</p>
      </div>
    </div>
  )
  if (href) return <Link href={href} className="block h-full">{content}</Link>
  return content
}

async function DashboardContent({ period }: { period: FilterPeriod }) {
  const session = await auth()
  if (!session?.user?.clinicId) redirect("/login")
  const clinicId = session.user.clinicId

  const [stats, chartData, recentActivity, doctorAnalytics, clinic, attendanceStats] = await Promise.all([
    getDashboardStats(clinicId, period),
    getChartData(clinicId),
    getRecentActivity(clinicId),
    getDoctorAnalytics(clinicId),
    prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true } }),
    getAttendanceStats(clinicId),
  ])

  const doctorName = session.user.name || "Doctor"

  const statsComponent = (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-5 xl:grid-cols-4">
      <PremiumKPICard
        title="Revenue" value={formatCurrency(stats.monthlyRevenue)} subtitle={`${formatCurrency(stats.totalRevenue)} total`}
        icon={TrendingUp} accentColor="text-[#4ADE80]" iconBg="bg-[#4ADE80]/[0.08]"
        tint="rgba(74,222,128,0.03)" href="/invoices" index={0}
      />
      <PremiumKPICard
        title="Patients" value={stats.totalPatients.toLocaleString()} subtitle={`${stats.newPatients} new this period`}
        icon={Users} accentColor="text-[#5BC0BE]" iconBg="bg-[#5BC0BE]/[0.08]"
        tint="rgba(91,192,190,0.03)" href="/patients" index={1}
      />
      <PremiumKPICard
        title="Appointments" value={stats.todayAppointments.toString()} subtitle={`${stats.upcomingAppointments} upcoming`}
        icon={CalendarCheck} accentColor="text-[#6B9CFF]" iconBg="bg-[#6B9CFF]/[0.08]"
        tint="rgba(107,156,255,0.03)" href="/appointments" index={2}
      />
      <PremiumKPICard
        title="Unpaid" value={stats.unpaidInvoicesCount.toString()} subtitle={formatCurrency(stats.unpaidInvoicesAmount)}
        icon={AlertCircle} accentColor="text-[#F4B860]" iconBg="bg-[#F4B860]/[0.08]"
        tint="rgba(244,184,96,0.03)" href="/invoices?status=UNPAID" index={3}
      />
    </div>
  )

  const heroComponent = (
    <HeroWelcome
      doctorName={doctorName}
      appointmentsCount={stats.todayAppointments}
      pendingInvoices={stats.unpaidInvoicesCount}
      monthlyRevenue={stats.monthlyRevenue}
    />
  )
  
  const filterComponent = (
    <div className="flex justify-end">
      <Suspense fallback={null}><DateFilter /></Suspense>
    </div>
  )

  const upcomingComponent = <UpcomingAppointments appointments={recentActivity.appointments.slice(0, 3)} />

  const recentListsComponent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <RecentActivity patients={recentActivity.patients} appointments={recentActivity.appointments} invoices={recentActivity.invoices} />
      </div>
      <div className="hidden lg:block"><TopDoctors doctors={doctorAnalytics} /></div>
    </div>
  )

  return (
    <>
      <AnnouncementBanner />

      {/* 📱 MOBILE */}
      <div className="block md:hidden">
        <MobileLayout>
          <MobileDashboard
            doctorName={doctorName}
            clinicName={clinic?.name || "My Clinic"}
            todayAppointments={stats.todayAppointments}
            pendingInvoices={stats.unpaidInvoicesCount}
            newPatients={stats.newPatients}
            stats={stats}
            chartData={chartData}
            recentActivity={recentActivity}
            attendanceStats={attendanceStats}
            doctorAnalytics={doctorAnalytics}
          />
        </MobileLayout>

        <MobileFab actions={[
          { label: "New Patient", href: "/patients/new", icon: <UserPlus className="h-5 w-5 text-gray-600" /> },
          { label: "Appointment", href: "/appointments/new", icon: <CalendarDays className="h-5 w-5 text-gray-600" /> },
          { label: "Invoice", href: "/invoices/new", icon: <FileText className="h-5 w-5 text-gray-600" /> },
          { label: "Prescription", href: "#", icon: <Pill className="h-5 w-5 text-gray-600" /> },
        ]} />

        <MobileBottomNav links={[
          { label: "Home", href: "/dashboard", active: true, icon: <CalendarDays className="w-[24px] h-[24px]" /> },
          { label: "Patients", href: "/patients", icon: <Users className="w-[24px] h-[24px]" /> },
          { label: "Appts", href: "/appointments", icon: <CalendarDays className="w-[24px] h-[24px]" /> },
          { label: "Queue", href: "/waiting-room", icon: <Clock className="w-[24px] h-[24px]" /> },
        ]} />
      </div>

      {/* 🖥️ DESKTOP */}
      <div className="hidden md:block">
        <div className="space-y-5">
          <SubscriptionBanner />
          <div className="flex flex-col gap-3">
            {heroComponent}
            {filterComponent}
          </div>
          {statsComponent}
          {attendanceStats.totalDoctors > 0 && (
            <AttendanceKPIs stats={attendanceStats} />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-100 dark:border-white/[0.04] bg-white dark:bg-[#223247] shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5">
                <AnalyticsCharts data={chartData} />
              </div>
            </div>
            <div className="space-y-5">
              {upcomingComponent}
              <TopDoctors doctors={doctorAnalytics} />
            </div>
          </div>
          {recentListsComponent}
        </div>
      </div>
    </>
  )
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const resolvedParams = await searchParams
  const period = (resolvedParams.period as FilterPeriod) || "month"

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent period={period} />
    </Suspense>
  )
}