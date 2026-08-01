"use client"

import { useRouter } from "next/navigation"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils/date-filters"
import {
  CalendarDays, FileText, UserPlus,
  Pill, Users, CalendarCheck, TrendingUp, AlertCircle,
  ChevronRight
} from "lucide-react"
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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good Morning"
  if (h < 17) return "Good Afternoon"
  return "Good Evening"
}

/* ═══ Hero ═══ */

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
  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 20,
        padding: 20,
        background: "linear-gradient(135deg, #2B9E99 0%, #5BC0BE 40%, #6B9CFF 100%)",
        boxShadow: "0 8px 32px rgba(107,156,255,0.18)",
      }}
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)" }} />
      
      <div className="relative z-10">
        <p className="text-white/60 text-[12px] font-medium">{getGreeting()} 👋</p>
        <h2 className="text-white text-[22px] font-bold leading-tight mt-0.5 truncate">{doctorName}</h2>
        <p className="text-white/50 text-[11px] mt-0.5 truncate">{clinicName}</p>

        <div className="flex gap-2 mt-4">
          {[
            { label: "Today", value: todayAppointments },
            { label: "Pending", value: pendingInvoices },
            { label: "New", value: newPatients },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
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

function MobileQuickActions() {
  const router = useRouter()
  const actions = [
    { icon: UserPlus, label: "Patient", href: "/patients/new", bg: "#5BC0BE", tint: "rgba(91,192,190,0.06)" },
    { icon: CalendarDays, label: "Appointment", href: "/appointments/new", bg: "#6B9CFF", tint: "rgba(107,156,255,0.06)" },
    { icon: FileText, label: "Invoice", href: "/invoices/new", bg: "#6BCB77", tint: "rgba(107,203,119,0.06)" },
    { icon: Pill, label: "Prescription", href: "#", bg: "#F4B860", tint: "rgba(244,184,96,0.06)" },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => router.push(action.href)}
          className="flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
          style={{
            padding: "12px 4px",
            borderRadius: 16,
            background: action.tint,
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${action.bg}15` }}>
            <action.icon className="w-[18px] h-[18px]" style={{ color: action.bg }} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-semibold text-gray-600">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ═══ Stats ═══ */

function MobileStats({ stats, newPatients }: { stats: MobileDashboardProps["stats"]; newPatients: number }) {
  const cards = [
    { icon: TrendingUp, label: "Revenue", value: formatCurrency(stats.monthlyRevenue), sub: "this month", bg: "#6BCB77", tint: "rgba(107,203,119,0.03)" },
    { icon: Users, label: "Patients", value: stats.totalPatients.toLocaleString(), sub: `+${newPatients} new`, bg: "#5BC0BE", tint: "rgba(91,192,190,0.03)" },
    { icon: CalendarCheck, label: "Appointments", value: stats.todayAppointments.toString(), sub: `${stats.upcomingAppointments} upcoming`, bg: "#6B9CFF", tint: "rgba(107,156,255,0.03)" },
    { icon: AlertCircle, label: "Unpaid", value: stats.unpaidInvoicesCount.toString(), sub: formatCurrency(stats.unpaidInvoicesAmount), bg: "#F4B860", tint: "rgba(244,184,96,0.03)" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-4"
          style={{
            borderRadius: 16,
            background: card.tint,
            border: `1px solid ${card.bg}10`,
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${card.bg}12` }}>
            <card.icon className="w-4 h-4" style={{ color: card.bg }} strokeWidth={2} />
          </div>
          <p className="text-gray-900 text-[20px] font-bold tabular-nums leading-none">{card.value}</p>
          <p className="text-gray-500 text-[11px] font-medium mt-1">{card.label}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">{card.sub}</p>
        </div>
      ))}
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
        <h3 className="text-gray-900 font-bold text-[16px]">Upcoming</h3>
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
              className="w-full flex items-center gap-3 bg-white p-3.5 active:bg-gray-50 transition-colors text-left"
              style={{ borderRadius: 14, border: "1px solid rgba(0,0,0,0.04)" }}
            >
              <div className="w-10 h-10 rounded-full bg-[#6B9CFF]/[0.08] flex items-center justify-center shrink-0">
                <span className="text-[12px] font-bold text-[#6B9CFF]">
                  {(apt.patientName || "?").charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{apt.patientName}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{apt.doctorName} · {time}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[11px] text-gray-500 font-medium tabular-nums">{time}</span>
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

/* ═══ Chart ═══ */

function MobileChart({ data }: { data: { name: string; revenue: number }[] }) {
  if (!data || data.length === 0) return null
  const isEmpty = data.every(d => d.revenue === 0)

  return (
    <div className="bg-white p-4" style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#6B9CFF]/[0.08] flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#6B9CFF]" strokeWidth={2} />
        </div>
        <h3 className="text-gray-900 font-semibold text-[14px]">Revenue</h3>
      </div>
      <div style={{ height: 160 }}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-[12px]">No revenue data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="mobGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B9CFF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6B9CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={32} />
              <Tooltip
                contentStyle={{ borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "none", padding: "8px 12px", fontSize: 12 }}
                formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6B9CFF" strokeWidth={2} fill="url(#mobGrad)" dot={false} activeDot={{ r: 4, fill: "#6B9CFF", stroke: "white", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/* ═══ Recent List ═══ */

function MobileRecentSection({ title, items, viewAllHref, renderRow }: { title: string; items: any[]; viewAllHref: string; renderRow: (item: any) => React.ReactNode }) {
  if (items.length === 0) return null
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-900 font-bold text-[16px]">{title}</h3>
        <button onClick={() => router.push(viewAllHref)} className="text-[12px] font-semibold text-[#6B9CFF] flex items-center gap-0.5 active:opacity-70">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="bg-white overflow-hidden" style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.04)" }}>
        {items.slice(0, 3).map((item, i) => (
          <button
            key={item.id || i}
            onClick={() => router.push(viewAllHref)}
            className="w-full flex items-center active:bg-gray-50 transition-colors text-left"
            style={{ minHeight: 56, padding: "12px 16px", borderBottom: i < Math.min(items.length, 3) - 1 ? "1px solid #F1F5F9" : "none" }}
          >
            {renderRow(item)}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══ Main ═══ */

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
  return (
    <>
      <MobileHero
        doctorName={doctorName}
        clinicName={clinicName}
        todayAppointments={todayAppointments}
        pendingInvoices={pendingInvoices}
        newPatients={newPatients}
      />

      <MobileQuickActions />
      <MobileStats stats={stats} newPatients={newPatients} />
      <MobileUpcoming appointments={recentActivity.appointments} />
      <MobileChart data={chartData} />

      <MobileRecentSection
        title="Recent Patients"
        items={recentActivity.patients}
        viewAllHref="/patients"
        renderRow={(p: any) => (
          <>
            <div className="w-9 h-9 rounded-full bg-[#5BC0BE]/[0.08] flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-[#5BC0BE]">
                {(p.name || "?").charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0 ml-3">
              <p className="text-[13px] font-medium text-gray-900 truncate">{p.name}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
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
                <span className="text-[11px] font-bold text-[#6B9CFF]">
                  {(a.patientName || "?").charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-[13px] font-medium text-gray-900 truncate">{a.patientName}</p>
                <p className="text-[11px] text-gray-400 truncate">{a.doctorName} · {time}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                {a.status}
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
                <p className="text-[13px] font-medium text-gray-900 truncate">{inv.patientName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-semibold text-gray-600 tabular-nums">{formatCurrency(inv.amount)}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                    {inv.status}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </>
          )
        }}
      />
    </>
  )
}