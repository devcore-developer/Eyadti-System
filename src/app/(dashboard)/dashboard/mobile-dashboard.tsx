"use client"

import { useRouter } from "next/navigation"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils/date-filters"
import {
  CalendarDays, FileText, UserPlus,
  Pill, Users, CalendarCheck, TrendingUp, AlertCircle,
  ChevronRight, UserCheck, Clock, UserX, LogOut, Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
type MobileDashboardProps = {
  doctorName: string
  clinicName: string
  todayAppointments: number
  pendingInvoices: number
  newPatients: number
  stats: {
    totalPatients: number
    todayAppointments: number
    monthlyRevenue: number
    unpaidInvoicesCount: number
    upcomingAppointments: number
    unpaidInvoicesAmount: number
    totalRevenue: number
  }
  chartData: { name: string; revenue: number; patients: number; appointments: number }[]
  recentActivity: {
    patients: any[]
    appointments: any[]
    invoices: any[]
  }
  attendanceStats: {
    totalDoctors: number
    present: number
    late: number
    absent: number
    finished: number
    branchCoverage: { branchId: string; branchName: string; doctorCount: number }[]
  }
  doctorAnalytics: any[]
  userRole: string
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good Morning"
  if (h < 17) return "Good Afternoon"
  return "Good Evening"
}

/* ═══ Hero ═══ */
function MobileHero({ doctorName, clinicName, todayAppointments, pendingInvoices, newPatients, hideFinancial }: any) {
  const heroStats = [
    { label: "Today", value: todayAppointments },
    ...(!hideFinancial ? [{ label: "Pending", value: pendingInvoices }] : []),
    { label: "New", value: newPatients },
  ]

  return (
    <div className="relative overflow-hidden" style={{ borderRadius: 20, padding: 20, background: "linear-gradient(135deg, #2B9E99 0%, #5BC0BE 40%, #6B9CFF 100%)", boxShadow: "0 8px 32px rgba(107,156,255,0.18)" }}>
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)" }} />
      <div className="relative z-10">
        <p className="text-white/60 text-[12px] font-medium">{getGreeting()} 👋</p>
        <h2 className="text-white text-[22px] font-bold leading-tight mt-0.5 truncate">{doctorName}</h2>
        <p className="text-white/50 text-[11px] mt-0.5 truncate">{clinicName}</p>
        <div className="flex gap-2 mt-4">
          {heroStats.map((s: any) => (
            <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="text-white/60 text-[10px] font-medium">{s.label}</span>
              <span className="text-white text-[13px] font-bold tabular-nums">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══ Quick Actions ═══ */
function MobileQuickActions({ hideFinancial }: { hideFinancial: boolean }) {
  const router = useRouter()
  const actions = [
    { icon: UserPlus, label: "Patient", href: "/patients/new", bg: "#5BC0BE", tint: "rgba(91,192,190,0.06)" },
    { icon: CalendarDays, label: "Appointment", href: "/appointments/new", bg: "#6B9CFF", tint: "rgba(107,156,255,0.06)" },
    ...(!hideFinancial ? [
      { icon: FileText, label: "Invoice", href: "/invoices/new", bg: "#6BCB77", tint: "rgba(107,203,119,0.06)" }
    ] : []),
    { icon: Pill, label: "Prescription", href: "#", bg: "#F4B860", tint: "rgba(244,184,96,0.06)" },
  ]

  const gridCols = actions.length === 3 ? "grid-cols-3" : "grid-cols-4"

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {actions.map((action) => (
        <button key={action.label} onClick={() => router.push(action.href)} className="flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform" style={{ padding: "12px 4px", borderRadius: 16, background: action.tint }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${action.bg}15` }}>
            <action.icon className="w-[18px] h-[18px]" style={{ color: action.bg }} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ═══ Stats ═══ */
function MobileStats({ stats, newPatients, hideFinancial }: { stats: MobileDashboardProps["stats"]; newPatients: number; hideFinancial: boolean }) {
  const cards: { icon: any; label: string; value: string; sub: string; bg: string; tint: string }[] = [
    ...(!hideFinancial ? [
      { icon: TrendingUp, label: "Revenue", value: formatCurrency(stats.monthlyRevenue), sub: "this month", bg: "#6BCB77", tint: "rgba(107,203,119,0.03)" },
    ] : []),
    { icon: Users, label: "Patients", value: stats.totalPatients.toLocaleString(), sub: `+${newPatients} new`, bg: "#5BC0BE", tint: "rgba(91,192,190,0.03)" },
    { icon: CalendarCheck, label: "Appointments", value: stats.todayAppointments.toString(), sub: `${stats.upcomingAppointments} upcoming`, bg: "#6B9CFF", tint: "rgba(107,156,255,0.03)" },
    ...(!hideFinancial ? [
      { icon: AlertCircle, label: "Unpaid", value: stats.unpaidInvoicesCount.toString(), sub: formatCurrency(stats.unpaidInvoicesAmount), bg: "#F4B860", tint: "rgba(244,184,96,0.03)" },
    ] : []),
  ]

  if (cards.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="p-4" style={{ borderRadius: 16, background: card.tint, border: `1px solid ${card.bg}10` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${card.bg}12` }}>
            <card.icon className="w-4 h-4" style={{ color: card.bg }} strokeWidth={2} />
          </div>
          <p className="text-gray-900 dark:text-white text-[20px] font-bold tabular-nums leading-none">{card.value}</p>
          <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium mt-1">{card.label}</p>
          <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}

/* ═══ TODAY'S ATTENDANCE ═══ */
function MobileAttendance({ stats }: { stats: MobileDashboardProps["attendanceStats"] }) {
  if (stats.totalDoctors === 0) return null;
  const cards = [
    { key: "present", label: "Present", icon: UserCheck, color: "#10B981", bg: "rgba(16,185,129,0.08)" },
    { key: "late", label: "Late", icon: Clock, color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
    { key: "absent", label: "Absent", icon: UserX, color: "#64748B", bg: "rgba(100,116,139,0.08)" },
    { key: "finished", label: "Checked Out", icon: LogOut, color: "#6B9CFF", bg: "rgba(107,156,255,0.08)" },
  ]

  return (
    <div className="bg-white dark:bg-[#223247] p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#5BC0BE]/[0.08] flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-[#5BC0BE]" strokeWidth={2} />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold text-[14px]">Today&apos;s Attendance</h3>
        </div>
        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
          {stats.present + stats.late + stats.finished}/{stats.totalDoctors} active
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          const value = stats[card.key as keyof typeof stats] as number
          return (
            <div key={card.key} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: card.bg }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color: card.color }} strokeWidth={2} />
              <div>
                <p className="text-gray-900 dark:text-white text-[18px] font-bold leading-none">{value}</p>
                <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium mt-0.5">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══ CHARTS ═══ */
const chartTooltipStyle = {
  borderRadius: 10,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  border: "none",
  padding: "8px 12px",
  fontSize: 12,
  backgroundColor: "var(--card, white)",
  color: "var(--card-foreground, #0F172A)",
}

function MobileChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null
  const isEmpty = data.every(d => d.revenue === 0)

  return (
    <div className="bg-white dark:bg-[#223247] p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#6B9CFF]/[0.08] flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#6B9CFF]" strokeWidth={2} />
        </div>
        <h3 className="text-gray-900 dark:text-white font-semibold text-[14px]">Revenue Trend</h3>
      </div>
      <div style={{ height: 200 }}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-[12px]">No revenue data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="mobGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B9CFF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6B9CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={32} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#6B9CFF" strokeWidth={2} fill="url(#mobGrad)" dot={false} activeDot={{ r: 4, fill: "#6B9CFF", stroke: "white", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function MobilePatientGrowthChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null
  const isEmpty = data.every(d => d.patients === 0)

  return (
    <div className="bg-white dark:bg-[#223247] p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#5BC0BE]/[0.08] flex items-center justify-center">
          <Users className="w-4 h-4 text-[#5BC0BE]" strokeWidth={2} />
        </div>
        <h3 className="text-gray-900 dark:text-white font-semibold text-[14px]">Patient Growth</h3>
      </div>
      <div style={{ height: 200 }}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-[12px]">No growth data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="mobGradPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5BC0BE" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#5BC0BE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} width={32} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [value, "New Patients"]} />
              <Area type="monotone" dataKey="patients" stroke="#5BC0BE" strokeWidth={2} fill="url(#mobGradPatients)" dot={false} activeDot={{ r: 4, fill: "#5BC0BE", stroke: "white", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function MobileAppointmentsActivityChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null
  const isEmpty = data.every(d => d.appointments === 0)

  return (
    <div className="bg-white dark:bg-[#223247] p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#89D6D2]/[0.08] flex items-center justify-center">
          <Activity className="w-4 h-4 text-[#89D6D2]" strokeWidth={2} />
        </div>
        <h3 className="text-gray-900 dark:text-white font-semibold text-[14px]">Appointments Activity</h3>
      </div>
      <div style={{ height: 200 }}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-[12px]">No appointments data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="mobGradAppts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#89D6D2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#89D6D2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} width={32} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [value, "Appointments"]} />
              <Area type="monotone" dataKey="appointments" stroke="#89D6D2" strokeWidth={2} fill="url(#mobGradAppts)" dot={false} activeDot={{ r: 4, fill: "#89D6D2", stroke: "white", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/* ═══ Upcoming ═══ */
function MobileUpcoming({ appointments }: { appointments: any[] }) {
  if (appointments.length === 0) return null
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-900 dark:text-white font-bold text-[16px]">Upcoming Appointments</h3>
        <button onClick={() => router.push("/appointments")} className="text-[12px] font-semibold text-[#6B9CFF] flex items-center gap-0.5 active:opacity-70">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {appointments.slice(0, 3).map((apt: any) => {
          const time = apt.dateTime ? new Date(apt.dateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""
          const statusCfg = apt.status === "CONFIRMED"
            ? { bg: "rgba(107,156,255,0.08)", text: "#6B9CFF" }
            : apt.status === "CANCELLED"
            ? { bg: "rgba(239,107,107,0.08)", text: "#EF6B6B" }
            : { bg: "rgba(244,184,96,0.08)", text: "#F4B860" }

          return (
            <button
              key={apt.id}
              onClick={() => router.push(`/appointments/${apt.id}`)}
              className="w-full flex items-center gap-3 bg-white dark:bg-[#223247] p-3.5 active:bg-gray-50 dark:active:bg-white/[0.06] transition-colors text-left rounded-[14px] border border-gray-100 dark:border-white/[0.06]"
            >
              <div className="w-10 h-10 rounded-full bg-[#6B9CFF]/[0.08] flex items-center justify-center shrink-0">
                <span className="text-[12px] font-bold text-[#6B9CFF]">{(apt.patientName || "?").charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{apt.patientName}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{apt.doctorName} · {time}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium tabular-nums">{time}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                  {apt.status || "Scheduled"}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══ Recent Lists ═══ */
function MobileRecentSection({ title, items, viewAllHref, renderRow }: { title: string; items: any[]; viewAllHref: string; renderRow: (item: any) => React.ReactNode }) {
  if (items.length === 0) return null
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-900 dark:text-white font-bold text-[16px]">{title}</h3>
        <button onClick={() => router.push(viewAllHref)} className="text-[12px] font-semibold text-[#6B9CFF] flex items-center gap-0.5 active:opacity-70">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="bg-white dark:bg-[#223247] overflow-hidden rounded-2xl border border-gray-100 dark:border-white/[0.06]">
        {items.slice(0, 3).map((item, i) => (
          <button
            key={item.id || i}
            onClick={() => router.push(viewAllHref)}
            className={cn(
              "w-full flex items-center active:bg-gray-50 dark:active:bg-white/[0.06] transition-colors text-left",
              i < Math.min(items.length, 3) - 1 && "border-b border-gray-100 dark:border-white/[0.06]"
            )}
            style={{ minHeight: 56, padding: "12px 16px" }}
          >
            {renderRow(item)}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══ TOP DOCTORS ═══ */
function MobileTopDoctors({ doctors }: { doctors: any[] }) {
  if (doctors.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#223247] p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#5BC0BE]/[0.08] flex items-center justify-center">
          <Users className="w-4 h-4 text-[#5BC0BE]" strokeWidth={2} />
        </div>
        <h3 className="text-gray-900 dark:text-white font-semibold text-[14px]">Top Doctors</h3>
      </div>
      <div className="space-y-2">
        {doctors.slice(0, 5).map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.04]">
            <div className="w-9 h-9 rounded-full bg-[#5BC0BE]/10 flex items-center justify-center shrink-0">
              <span className="text-[12px] font-bold text-[#5BC0BE]">{doc.name?.charAt(0) || "D"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{doc.name}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{doc.specialization || 'General'}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-bold text-gray-700 dark:text-gray-200">{doc.patientCount} pts</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{doc.appointmentCount} appts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══ MAIN DASHBOARD ═══ */
export function MobileDashboard({
  doctorName, clinicName, todayAppointments, pendingInvoices, newPatients,
  stats, chartData, recentActivity, attendanceStats, doctorAnalytics, userRole
}: MobileDashboardProps) {
  const isDoctor = userRole === "DOCTOR"
  const isReception = userRole === "RECEPTIONIST"
  const hideFinancial = isDoctor || isReception
  const hideAllCharts = isDoctor
  const hideOtherDoctors = isDoctor
  const hideInvoicesInActivity = isDoctor || isReception
  const hideAttendance = isDoctor

  return (
    <>
      <MobileHero
        doctorName={doctorName}
        clinicName={clinicName}
        todayAppointments={todayAppointments}
        pendingInvoices={pendingInvoices}
        newPatients={newPatients}
        hideFinancial={hideFinancial}
      />
      
      <MobileQuickActions hideFinancial={hideFinancial} />
      
      <MobileStats stats={stats} newPatients={newPatients} hideFinancial={hideFinancial} />
      
      {!hideAttendance && <MobileAttendance stats={attendanceStats} />}
      
      {!hideAllCharts && !hideFinancial && (
        <MobileChart data={chartData} />
      )}
      {!hideAllCharts && (
        <>
          <MobilePatientGrowthChart data={chartData} />
          <MobileAppointmentsActivityChart data={chartData} />
        </>
      )}
      
      <MobileUpcoming appointments={recentActivity.appointments} />
      
      <MobileRecentSection
        title="Recent Patients"
        items={recentActivity.patients}
        viewAllHref="/patients"
        renderRow={(p: any) => (
          <>
            <div className="w-9 h-9 rounded-full bg-[#5BC0BE]/[0.08] flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-[#5BC0BE]">{(p.name || "?").charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0 ml-3">
              <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
          </>
        )}
      />

      <MobileRecentSection
        title="Recent Appointments"
        items={recentActivity.appointments}
        viewAllHref="/appointments"
        renderRow={(a: any) => {
          const time = a.dateTime ? new Date(a.dateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""
          const statusCfg = a.status === "CONFIRMED"
            ? { bg: "rgba(107,156,255,0.08)", text: "#6B9CFF" }
            : { bg: "rgba(244,184,96,0.08)", text: "#F4B860" }

          return (
            <>
              <div className="w-9 h-9 rounded-full bg-[#6B9CFF]/[0.08] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-[#6B9CFF]">{(a.patientName || "?").charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{a.patientName}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{a.doctorName} · {time}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                {a.status}
              </span>
            </>
          )
        }}
      />

      {!hideInvoicesInActivity && (
        <MobileRecentSection
          title="Recent Invoices"
          items={recentActivity.invoices}
          viewAllHref="/invoices"
          renderRow={(inv: any) => {
            const statusCfg = inv.status === "PAID"
              ? { bg: "rgba(107,203,119,0.08)", text: "#6BCB77" }
              : inv.status === "CANCELLED"
              ? { bg: "rgba(239,107,107,0.08)", text: "#EF6B6B" }
              : { bg: "rgba(244,184,96,0.08)", text: "#F4B860" }

            return (
              <>
                <div className="w-9 h-9 rounded-full bg-[#F4B860]/[0.08] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#F4B860]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0 ml-3">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{inv.patientName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 tabular-nums">{formatCurrency(inv.amount)}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                      {inv.status}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
              </>
            )
          }}
        />
      )}

      {!hideOtherDoctors && <MobileTopDoctors doctors={doctorAnalytics} />}
    </>
  )
}