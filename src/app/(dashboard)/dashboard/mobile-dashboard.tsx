"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  Menu, Bell, UserPlus, CalendarPlus, FileText, Pill, 
  Users, Clock, DollarSign, ChevronRight, TrendingUp, TrendingDown,
  Plus, X, CheckCircle2, XCircle, Calendar, Settings, LogOut, User as UserIcon
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type MobileAppointment = { id: string; patientName: string; doctorName: string; time: string; status: string }
type RecentPatient = { id: string; name: string; visitDate: string }
type RecentInvoice = { id: string; amount: number; status: string }
type ChartData = { name: string; revenue: number; appointments: number; patients: number }

type Props = {
  user: { name: string; role: string; image?: string | null }
  clinicName: string
  stats: { patients: number; appointments: number; revenue: number; invoices: number }
  chartData: ChartData[]
  upcomingAppointments: MobileAppointment[]
  recentAppointments: MobileAppointment[]
  recentPatients: RecentPatient[]
  recentInvoices: RecentInvoice[]
}

// Glass Tooltip for Chart
const GlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-xs font-semibold shadow-lg" 
           style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)', color: '#1e293b' }}>
        <p className="opacity-60 mb-0.5">{label}</p>
        <p className="text-blue-600 font-bold">${payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export function MobileDashboard({ 
  user, clinicName, stats, chartData, upcomingAppointments, 
  recentAppointments, recentPatients, recentInvoices 
}: Props) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState("Today")
  const [fabOpen, setFabOpen] = useState(false)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent, id: string) => { touchStartX.current = e.touches[0].clientX; setSwipedId(id) }
  const handleTouchMove = (e: React.TouchEvent) => { touchCurrentX.current = e.touches[0].clientX }
  const handleTouchEnd = (id: string) => { if (Math.abs(touchStartX.current - touchCurrentX.current) < 50) setSwipedId(null) }
  const getSwipeStyle = (id: string) => {
    if (swipedId !== id) return {}
    const diff = touchStartX.current - touchCurrentX.current
    if (diff > 50) return { transform: `translateX(-140px)` }
    if (diff < -50) return { transform: `translateX(140px)` }
    return {}
  }

  const summaryData = [
    { label: "Patients", value: stats.patients.toLocaleString(), trend: "+12%", up: true, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Appointments", value: stats.appointments.toString(), trend: "+3%", up: true, icon: Calendar, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Revenue", value: `$${stats.revenue}`, trend: "-2%", up: false, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Invoices", value: stats.invoices.toString(), trend: "0%", up: true, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  ]

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#F5F8FC' }}>
      {/* Subtle Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full" style={{ background: 'rgba(70,140,255,.05)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full" style={{ background: 'rgba(0,200,255,.04)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 pt-[68px] pb-[104px] px-4 space-y-5">
        
        {/* ━━━ HERO CARD (155px, Gradient, Glass Stats) ━━━ */}
        <div className="relative w-full rounded-[26px] p-[22px] shadow-[0_18_40_rgba(44,90,255,.18)] overflow-hidden" 
             style={{ height: '155px', background: 'linear-gradient(135deg, #52D5D0 0%, #4A8DFF 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl -mr-10 -mt-10" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-[15px] font-semibold">Good Morning 👋</p>
                <h2 className="text-white text-[34px] font-extrabold leading-tight mt-0.5">Dr. {user.name.split(' ')[0]}</h2>
                <p className="text-white/90 text-[15px] font-medium mt-0.5">{clinicName}</p>
              </div>
              <button className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" 
                      style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <Calendar className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex gap-2.5">
              {[
                { icon: CalendarPlus, val: stats.appointments, label: "Appointments", iconColor: "text-blue-200" },
                { icon: FileText, val: stats.invoices, label: "Pending Invoices", iconColor: "text-amber-200" }
              ].map((pill) => (
                <div key={pill.label} className="flex-1 h-14 rounded-[18px] flex items-center gap-2.5 px-4"
                     style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <pill.icon className={`w-5 h-5 ${pill.iconColor}`} />
                  <div>
                    <p className="text-white text-[22px] font-bold leading-none">{pill.val}</p>
                    <p className="text-white/70 text-[12px] mt-0.5">{pill.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ━━━ QUICK ACTIONS (80px, Premium Shadows) ━━━ */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: UserPlus, label: "New Patient", color: "text-blue-600", bg: "bg-blue-50", href: "/patients/new" },
            { icon: CalendarPlus, label: "Appointment", color: "text-teal-600", bg: "bg-teal-50", href: "/appointments/new" },
            { icon: FileText, label: "Create Invoice", color: "text-purple-600", bg: "bg-purple-50", href: "/invoices/new" },
            { icon: Pill, label: "Prescription", color: "text-rose-600", bg: "bg-rose-50", href: "#" },
          ].map((action) => (
            <button key={action.label} onClick={() => router.push(action.href)} 
                    className="bg-white rounded-[20px] h-20 flex flex-col items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-150"
                    style={{ boxShadow: '0 8 24 rgba(0,0,0,0.06)' }}>
              <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center`}>
                <action.icon className="w-7 h-7 ${action.color}" />
              </div>
              <span className="text-[13px] font-semibold text-gray-800">{action.label}</span>
            </button>
          ))}
        </div>

        {/* ━━━ SUMMARY CARDS (120px, 38px Numbers, Trends) ━━━ */}
        <div className="grid grid-cols-2 gap-3">
          {summaryData.map((card) => (
            <div key={card.label} className="bg-white rounded-[22px] p-[18px] h-[120px] flex flex-col justify-between relative active:scale-[0.98] transition-transform duration-150"
                 style={{ boxShadow: '0 10 28 rgba(0,0,0,0.05)' }}>
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-0.5 text-[11px] font-bold ${card.up ? 'text-emerald-500' : 'text-red-400'}`}>
                  {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.trend}
                </div>
              </div>
              <div>
                <p className="text-gray-900 text-[38px] font-extrabold leading-none">{card.value}</p>
                <p className="text-gray-400 text-[14px] font-medium mt-1">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ━━━ UPCOMING APPOINTMENTS (88px height, 52px Avatar) ━━━ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900 text-[24px] font-bold">Upcoming Appointments</h3>
            <button onClick={() => router.push("/appointments")} className="text-[#4A8DFF] text-[13px] font-semibold">View All</button>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 5).map((apt) => {
              const statusColors: Record<string, string> = { CONFIRMED: "bg-emerald-50 text-emerald-600", COMPLETED: "bg-blue-50 text-blue-600", PENDING: "bg-orange-50 text-orange-600", CANCELLED: "bg-red-50 text-red-500" };
              return (
                <div key={apt.id} className="relative rounded-[20px] overflow-hidden bg-white" style={{ height: '88px', boxShadow: '0 4 16 rgba(0,0,0,0.04)' }}>
                  <div className="absolute inset-0 flex">
                    <div className="w-20 bg-emerald-500 flex items-center justify-center text-white"><CheckCircle2 className="w-5 h-5" /></div>
                    <div className="flex-1 bg-white" />
                    <div className="w-20 bg-red-500 flex items-center justify-center text-white"><XCircle className="w-5 h-5" /></div>
                  </div>
                  <div className="relative h-full px-4 flex items-center gap-3 transition-transform duration-150 ease-out active:scale-[0.98]" style={getSwipeStyle(apt.id)} onTouchStart={(e) => handleTouchStart(e, apt.id)} onTouchMove={handleTouchMove} onTouchEnd={() => handleTouchEnd(apt.id)}>
                    <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shrink-0 shadow-inner">{apt.patientName.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-[16px] font-semibold truncate">{apt.patientName}</p>
                      <p className="text-gray-400 text-[13px] truncate">Dr. {apt.doctorName}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2 flex flex-col items-end gap-1">
                      <p className="text-gray-800 text-[15px] font-bold">{apt.time}</p>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>{apt.status}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ━━━ TIME FILTER (Floating Capsule) ━━━ */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white rounded-[999px] p-1 flex items-center gap-1" style={{ height: '46px', boxShadow: '0 8 24 rgba(0,0,0,0.06)' }}>
            {["Today", "Week", "Month", "Year"].map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} 
                      className={`px-5 h-9 rounded-[999px] text-[13px] font-semibold transition-all duration-300 flex items-center justify-center ${
                        activeFilter === f ? "text-white shadow-md" : "text-[#7D8794] hover:bg-gray-50"
                      }`}
                      style={activeFilter === f ? { background: 'linear-gradient(135deg, #52D5D0 0%, #4A8DFF 100%)' } : {}}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ━━━ CHARTS (ONLY Revenue Trend, 220px, 4px Line) ━━━ */}
        <div className="bg-white rounded-[24px] p-5 h-[220px]" style={{ boxShadow: '0 10 28 rgba(0,0,0,0.05)' }}>
          <h3 className="text-gray-900 text-[16px] font-bold mb-3">Revenue Trend</h3>
          <div className="h-[160px] w-full -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="mobileRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A8DFF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4A8DFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7D8794' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7D8794' }} />
                <Tooltip content={<GlassTooltip />} cursor={{ stroke: '#4A8DFF', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" stroke="#4A8DFF" strokeWidth={4} fill="url(#mobileRevenueGrad)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ━━━ RECENT LISTS (Dense 74px rows) ━━━ */}
        <div className="space-y-5">
          {/* Recent Patients */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-gray-900 text-[24px] font-bold">Recent Patients</h3>
              <button onClick={() => router.push("/patients")} className="text-[#4A8DFF] text-[13px] font-semibold">View All</button>
            </div>
            <div className="bg-white rounded-[22px] overflow-hidden divide-y divide-gray-50/80" style={{ boxShadow: '0 4 16 rgba(0,0,0,0.03)' }}>
              {recentPatients.slice(0, 4).map((p) => (
                <button key={p.id} onClick={() => router.push(`/patients/${p.id}`)} className="w-full flex items-center gap-3 px-4 active:bg-gray-50 transition-colors text-left" style={{ height: '74px' }}>
                  <div className="w-[46px] h-[46px] rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">{p.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-[16px] font-semibold truncate">{p.name}</p>
                    <p className="text-gray-400 text-[13px]">{p.visitDate}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Appointments */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-gray-900 text-[24px] font-bold">Recent Appointments</h3>
              <button onClick={() => router.push("/appointments")} className="text-[#4A8DFF] text-[13px] font-semibold">View All</button>
            </div>
            <div className="bg-white rounded-[22px] overflow-hidden divide-y divide-gray-50/80" style={{ boxShadow: '0 4 16 rgba(0,0,0,0.03)' }}>
              {recentAppointments.slice(0, 4).map((apt) => (
                <button key={apt.id} onClick={() => router.push(`/appointments/${apt.id}`)} className="w-full flex items-center justify-between px-4 active:bg-gray-50 transition-colors text-left" style={{ height: '74px' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[46px] h-[46px] rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><Clock className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <p className="text-gray-900 text-[16px] font-semibold truncate">{apt.patientName}</p>
                      <p className="text-gray-400 text-[13px] truncate">{apt.doctorName}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 shrink-0 ml-2">{apt.status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Invoices */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-gray-900 text-[24px] font-bold">Recent Invoices</h3>
              <button onClick={() => router.push("/invoices")} className="text-[#4A8DFF] text-[13px] font-semibold">View All</button>
            </div>
            <div className="bg-white rounded-[22px] overflow-hidden divide-y divide-gray-50/80" style={{ boxShadow: '0 4 16 rgba(0,0,0,0.03)' }}>
              {recentInvoices.slice(0, 4).map((inv) => (
                <button key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} className="w-full flex items-center justify-between px-4 active:bg-gray-50 transition-colors" style={{ height: '74px' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-[46px] h-[46px] rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><DollarSign className="w-5 h-5" /></div>
                    <p className="text-gray-900 text-[16px] font-bold">${inv.amount}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">{inv.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ FLOATING ACTION BUTTON (66px, Floating 24px above nav) ━━━ */}
      <div className="fixed z-50" style={{ bottom: '104px', right: '20px' }}>
        <div className={`absolute bottom-20 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right ${fabOpen ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"}`}>
          {[{ label: "Patient", icon: UserPlus, href: "/patients/new" }, { label: "Appointment", icon: CalendarPlus, href: "/appointments/new" }, { label: "Invoice", icon: FileText, href: "/invoices/new" }, { label: "Prescription", icon: Pill, href: "#" }].map((action) => (
            <button key={action.label} onClick={() => { router.push(action.href); setFabOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
              <action.icon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">{action.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setFabOpen(!fabOpen)} className="relative w-[66px] h-[66px] rounded-full flex items-center justify-center text-white active:scale-90 transition-transform duration-200 shadow-[0_18_40_rgba(45,108,255,.35)]"
                style={{ background: 'linear-gradient(135deg, #00C2FF 0%, #2D6CFF 100%)' }}>
          {fabOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
        </button>
      </div>

      {/* ━━━ FLOATING BOTTOM NAVIGATION (72px, Glass, Spring) ━━━ */}
      <div className="fixed z-40 left-4 right-4" style={{ bottom: '16px' }}>
        <Sheet>
          <SheetTrigger asChild>
            <button className="absolute -top-14 left-0 h-11 w-11 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-xl border border-gray-100 shadow-md">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 rounded-r-3xl">
            <SheetHeader className="p-6 pb-4 border-b border-gray-100 bg-gradient-to-br from-[#0F172A] to-[#17212F] text-white">
              <SheetTitle className="text-white text-left">{clinicName}</SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-1">
              {[{ icon: UserIcon, label: "Profile" }, { icon: Settings, label: "Settings" }, { icon: Users, label: "Patients", href: "/patients" }, { icon: CalendarPlus, label: "Appointments", href: "/appointments" }].map((item) => (
                <button key={item.label} onClick={() => router.push(item.href || "#")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all text-left">
                  <item.icon className="w-5 h-5 text-gray-500" /><span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-left mt-4 border-t border-gray-100 pt-4">
                <LogOut className="w-5 h-5" /><span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center justify-around bg-white/88 backdrop-blur-[24px] h-[72px] rounded-[24px] border border-white/50 shadow-[0_12_35_rgba(0,0,0,0.08)]">
          {[
            { icon: TrendingUp, label: "Home", href: "/dashboard", active: true },
            { icon: Users, label: "Patients", href: "/patients", active: false },
            { icon: CalendarPlus, label: "Appts", href: "/appointments", active: false },
            { icon: Clock, label: "Queue", href: "/waiting-room", active: false },
            { icon: Bell, label: "Alerts", href: "/notifications", active: false },
          ].map((item) => (
            <button key={item.label} onClick={() => router.push(item.href)} className="relative flex-1 flex flex-col items-center justify-center h-full py-1.5 gap-1 active:scale-95 transition-transform duration-200">
              {item.active && <div className="absolute -top-0 w-8 h-1 bg-gradient-to-r from-[#52D5D0] to-[#4A8DFF] rounded-full shadow-sm spring-indicator" />}
              <item.icon className={`w-[26px] h-[26px] transition-colors duration-200 ${item.active ? 'text-[#4A8DFF]' : 'text-[#7D8794]'}`} />
              <span className={`text-[11px] font-semibold transition-colors duration-200 ${item.active ? 'text-[#4A8DFF]' : 'text-[#7D8794]'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ━━━ TOP NAVIGATION (Glass) ━━━ */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 safe-area-top" style={{ background: 'rgba(245,248,252,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
        <div className="w-11" /> {/* Spacer for hamburger which is attached to bottom nav */}
        <h1 className="font-bold text-[16px] text-gray-900 truncate max-w-[200px]">{clinicName}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/notifications")} className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-white/80 border border-gray-100 shadow-sm">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#F5F8FC] animate-pulse" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ background: 'linear-gradient(135deg, #52D5D0 0%, #4A8DFF 100%)' }}>
            {user.name.charAt(0)}
          </div>
        </div>
      </div>

      <style jsx global>{`
        body::-webkit-scrollbar { display: none; }
        body { -ms-overflow-style: none; scrollbar-width: none; -webkit-tap-highlight-color: transparent; }
        .safe-area-top { padding-top: env(safe-area-inset-top); }
        
        /* Spring Animation for Nav Indicator */
        @keyframes springIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .spring-indicator {
          animation: springIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Dark Mode Adaptation */
        @media (prefers-color-scheme: dark) {
          body { background: #0F172A !important; }
          .fixed.top-0 { background: rgba(15,23,42,0.85) !important; border-color: rgba(255,255,255,0.05) !important; }
        }
      `}</style>
    </div>
  )
}