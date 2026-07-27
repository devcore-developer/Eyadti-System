"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Menu, Bell, CalendarDays, Clock, UserPlus, FileText,
  Pill, Users, CalendarCheck, TrendingUp, AlertCircle,
  ChevronRight
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils/date-filters"

/* ═══════════════ Types ═══════════════ */

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
  chartData: { name: string; revenue: number }[]
  recentActivity: {
    patients: any[]
    appointments: any[]
    invoices: any[]
  }
}

/* ═══════════════ Utilities ═══════════════ */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good Morning"
  if (h < 17) return "Good Afternoon"
  return "Good Evening"
}

function fmtNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return n.toString()
}

/* ═══════════════ Top Bar ═══════════════ */

function MobileTopBar({ clinicName }: { clinicName: string }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5"
      style={{
        height: 64,
        background: "rgba(255,255,255,.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors">
        <Menu className="w-[18px] h-[18px] text-gray-600" strokeWidth={2} />
      </div>
      <h1 className="font-bold text-[15px] text-gray-900 truncate max-w-[180px]">{clinicName}</h1>
      <div className="flex items-center gap-2.5">
        <button className="relative w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors">
          <Bell className="w-[18px] h-[18px] text-gray-600" strokeWidth={2} />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
          style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)", boxShadow: "0 2px 8px rgba(20,184,166,0.3)" }}
        >
          {clinicName.charAt(0)}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════ Hero ═══════════════ */

function MobileHero({
  doctorName,
  clinicName,
  todayAppointments,
  pendingInvoices,
  newPatients,
}: {
  doctorName: string
  clinicName: string
  todayAppointments: number
  pendingInvoices: number
  newPatients: number
}) {
  const miniStats = [
    { label: "Today", value: todayAppointments, bg: "rgba(255,255,255,0.12)" },
    { label: "Pending", value: pendingInvoices, bg: "rgba(255,255,255,0.12)" },
    { label: "New", value: newPatients, bg: "rgba(255,255,255,0.12)" },
  ]

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 180,
        borderRadius: 24,
        padding: 24,
        background: "linear-gradient(135deg, #14B8A6, #3B82F6)",
        boxShadow: "0 16px 48px rgba(20,184,166,0.25), 0 4px 16px rgba(59,130,246,0.15)",
      }}
    >
      {/* Radial lights */}
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)" }} />
      <div className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)" }} />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white/75 text-[13px] font-medium">{getGreeting()} 👋</p>
            <h2 className="text-white text-[26px] font-extrabold leading-tight mt-0.5 line-clamp-1">{doctorName}</h2>
            <p className="text-white/60 text-[13px] mt-1 truncate">{clinicName}</p>
          </div>
          <button
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform ml-3"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <CalendarDays className="w-5 h-5 text-white" strokeWidth={2} />
          </button>
        </div>

        {/* Bottom mini stats */}
        <div className="flex gap-2 mt-auto">
          {miniStats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: s.bg }}
            >
              <span className="text-white/70 text-[11px] font-medium">{s.label}</span>
              <span className="text-white text-[13px] font-bold">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════ Quick Actions ═══════════════ */

function MobileQuickActions() {
  const router = useRouter()
  const actions = [
    { icon: UserPlus, label: "New Patient", href: "/patients/new", bg: "#EFF6FF", color: "#3B82F6" },
    { icon: CalendarDays, label: "Appointment", href: "/appointments/new", bg: "#F0FDFA", color: "#14B8A6" },
    { icon: FileText, label: "Invoice", href: "/invoices/new", bg: "#F5F3FF", color: "#8B5CF6" },
    { icon: Pill, label: "Prescription", href: "#", bg: "#FFF7ED", color: "#F59E0B" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => router.push(action.href)}
          className="flex flex-col items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          style={{
            height: 90,
            borderRadius: 20,
            background: "white",
            padding: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: action.bg }}>
            <action.icon className="w-6 h-6" style={{ color: action.color }} strokeWidth={2} />
          </div>
          <span className="text-[13px] font-medium text-gray-700">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ═══════════════ Stats ═══════════════ */

function MobileStats({ stats, newPatients }: { stats: MobileDashboardProps["stats"]; newPatients: number }) {
  const cards = [
    {
      icon: Users, label: "Patients", value: fmtNum(stats.totalPatients),
      sub: `+${newPatients} this month`, trend: `+${newPatients}`, up: true,
      bg: "#F0FDFA", color: "#14B8A6",
    },
    {
      icon: CalendarCheck, label: "Appointments", value: stats.todayAppointments.toString(),
      sub: `${stats.upcomingAppointments} upcoming`, trend: `${stats.upcomingAppointments}`, up: true,
      bg: "#EFF6FF", color: "#3B82F6",
    },
    {
      icon: TrendingUp, label: "Revenue", value: formatCurrency(stats.monthlyRevenue),
      sub: formatCurrency(stats.totalRevenue) + " total", trend: "Monthly", up: true,
      bg: "#F5F3FF", color: "#8B5CF6",
    },
    {
      icon: AlertCircle, label: "Unpaid", value: stats.unpaidInvoicesCount.toString(),
      sub: formatCurrency(stats.unpaidInvoicesAmount), trend: "Pending", up: false,
      bg: "#FFF7ED", color: "#F59E0B",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative p-4 flex flex-col justify-between"
          style={{
            minHeight: 120,
            borderRadius: 20,
            background: "white",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          }}
        >
          {/* Icon */}
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: card.bg }}>
            <card.icon className="w-5 h-5" style={{ color: card.color }} strokeWidth={2} />
          </div>

          {/* Trend badge */}
          <div
            className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: card.up ? "#ECFDF5" : "#FEF2F2",
              color: card.up ? "#059669" : "#DC2626",
            }}
          >
            {card.trend}
          </div>

          {/* Bottom content with proper spacing */}
          <div className="mt-auto">
            <p className="text-gray-900" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{card.value}</p>
            <p className="text-gray-500 text-[12px] font-medium mt-1">{card.label}</p>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: 11, opacity: 0.6 }}>{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════ Segment Control ═══════════════ */

function MobileSegmentControl({ period }: { period: string }) {
  const router = useRouter()
  const periods = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ]
  const activeIndex = periods.findIndex((p) => p.key === period)

  return (
    <div>
      <div className="relative flex rounded-full p-1" style={{ height: 48, background: "#F1F5F9" }}>
        <div
          className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out"
          style={{
            left: `calc(${activeIndex * 25}% + 4px)`,
            width: "calc(25% - 8px)",
            background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
            boxShadow: "0 2px 10px rgba(59,130,246,0.35)",
          }}
        />
        {periods.map((p) => {
          const isActive = p.key === period
          return (
            <button
              key={p.key}
              onClick={() => router.push(`/dashboard?period=${p.key}`)}
              className="relative z-10 flex-1 flex items-center justify-center text-[13px] font-semibold transition-colors duration-200 active:scale-95"
              style={{ color: isActive ? "white" : "#64748B" }}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════ Upcoming Appointments ═══════════════ */

function MobileUpcoming({ appointments }: { appointments: any[] }) {
  if (appointments.length === 0) return null
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-900 font-bold" style={{ fontSize: 20 }}>Upcoming</h3>
        <button onClick={() => router.push("/appointments")} className="text-[13px] font-semibold text-blue-500 flex items-center gap-0.5 active:opacity-70">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {appointments.slice(0, 3).map((apt: any) => {
          const time = apt.dateTime ? new Date(apt.dateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""
          const statusCfg = apt.status === "CONFIRMED"
            ? { bg: "#DBEAFE", text: "#1D4ED8" }
            : apt.status === "CANCELLED"
            ? { bg: "#FEE2E2", text: "#DC2626" }
            : { bg: "#FEF3C7", text: "#92400E" }

          return (
            <button
              key={apt.id}
              onClick={() => router.push(`/appointments/${apt.id}`)}
              className="w-full flex items-center gap-3 bg-white p-3.5 active:bg-gray-50 transition-colors text-left"
              style={{ borderRadius: 18, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                {apt.patient?.image ? (
                  <img src={apt.patient.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-blue-600">{apt.patient?.fullName?.charAt(0) || "?"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 truncate">{apt.patient?.fullName || "Patient"}</p>
                <p className="text-[12px] text-gray-400 mt-0.5 truncate">Dr. {apt.doctor?.name || "—"}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[12px] text-gray-500 font-medium">{time}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: statusCfg.bg, color: statusCfg.text }}>
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

/* ═══════════════ Chart ═══════════════ */

function MobileChart({ data }: { data: { name: string; revenue: number }[] }) {
  if (!data || data.length === 0) return null

  return (
    <div className="bg-white p-5" style={{ borderRadius: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-500" strokeWidth={2} />
          </div>
          <h3 className="text-gray-900 font-semibold" style={{ fontSize: 16 }}>Revenue Trend</h3>
        </div>
        <button className="text-[12px] font-semibold text-blue-500 active:opacity-70">View Details</button>
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="mobGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B9CFF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6B9CFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={35} />
            <Tooltip
              contentStyle={{ borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", border: "none", padding: "10px 14px", fontSize: 12 }}
              formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#6B9CFF" strokeWidth={2.5} fill="url(#mobGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ═══════════════ Recent Section ═══════════════ */

function MobileRecentSection({ title, items, viewAllHref, renderRow }: { title: string; items: any[]; viewAllHref: string; renderRow: (item: any) => React.ReactNode }) {
  if (items.length === 0) return null
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-900 font-bold" style={{ fontSize: 20 }}>{title}</h3>
        <button onClick={() => router.push(viewAllHref)} className="text-[13px] font-semibold text-blue-500 flex items-center gap-0.5 active:opacity-70">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="bg-white overflow-hidden" style={{ borderRadius: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        {items.slice(0, 3).map((item, i) => (
          <button
            key={item.id || i}
            onClick={() => router.push(viewAllHref)}
            className="w-full flex items-center active:bg-gray-50 transition-colors text-left"
            style={{ height: 68, borderBottom: i < Math.min(items.length, 3) - 1 ? "1px solid #F1F5F9" : "none" }}
          >
            {renderRow(item)}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════ Main Component ═══════════════ */

export function MobileDashboard({
  doctorName,
  clinicName,
  todayAppointments,
  pendingInvoices,
  newPatients,
  stats,
  chartData,
  recentActivity,
}: MobileDashboardProps) {
  const sp = useSearchParams()
  const period = sp.get("period") || "month"

  return (
    <>
      <MobileTopBar clinicName={clinicName} />

      <MobileHero
        doctorName={doctorName}
        clinicName={clinicName}
        todayAppointments={todayAppointments}
        pendingInvoices={pendingInvoices}
        newPatients={newPatients}
      />

      <MobileQuickActions />
      <MobileStats stats={stats} newPatients={newPatients} />
      <MobileSegmentControl period={period} />
      <MobileUpcoming appointments={recentActivity.appointments} />
      <MobileChart data={chartData} />

      <MobileRecentSection
        title="Recent Patients"
        items={recentActivity.patients}
        viewAllHref="/patients"
        renderRow={(p: any) => (
          <>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center ml-4 shrink-0 overflow-hidden">
              {p.image ? (
                <img src={p.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-4 h-4 text-teal-500" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0 ml-3">
              <p className="text-[13px] font-medium text-gray-900 truncate">{p.fullName}</p>
              <p className="text-[11px] text-gray-400 truncate">{p.phone || "—"}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 mr-4 shrink-0" />
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
            ? { bg: "#DBEAFE", text: "#1D4ED8" }
            : { bg: "#FEF3C7", text: "#92400E" }

          return (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center ml-4 shrink-0 overflow-hidden">
                {a.patient?.image ? (
                  <img src={a.patient.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <CalendarDays className="w-4 h-4 text-blue-500" strokeWidth={2} />
                )}
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-[13px] font-medium text-gray-900 truncate">{a.patient?.fullName || "—"}</p>
                <p className="text-[11px] text-gray-400 truncate">Dr. {a.doctor?.name || "—"} · {time}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full mr-4 shrink-0" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                {a.status || "—"}
              </span>
            </>
          )
        }}
      />

      <MobileRecentSection
        title="Recent Invoices"
        items={recentActivity.invoices}
        viewAllHref="/invoices"
        renderRow={(inv: any) => {
          const statusCfg = inv.status === "PAID"
            ? { bg: "#ECFDF5", text: "#059669" }
            : inv.status === "CANCELLED"
            ? { bg: "#FEE2E2", text: "#DC2626" }
            : { bg: "#FEF3C7", text: "#92400E" }

          return (
            <>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center ml-4 shrink-0">
                <FileText className="w-4 h-4 text-amber-500" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{inv.patient?.fullName || "—"}</p>
                <p className="text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-600">{formatCurrency(inv.amount)}</span>
                  {" · "}
                  <span className="inline-block px-1.5 py-0.5 rounded" style={{ background: statusCfg.bg, color: statusCfg.text, fontSize: 9, fontWeight: 700 }}>{inv.status || "—"}</span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 mr-4 shrink-0" />
            </>
          )
        }}
      />
    </>
  )
}