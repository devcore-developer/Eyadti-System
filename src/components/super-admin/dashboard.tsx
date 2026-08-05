"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DownloadPdfButton } from "@/components/super-admin/download-pdf-button"
import { GenerateCodeForm } from "@/components/admin/generate-code-form"
import { AnnouncementsCenter } from "@/components/super-admin/announcements-center"
import { EmptyState } from "@/components/shared/empty-state"
import { ChartWrapper } from "@/components/ui/chart-wrapper"
import { formatCurrency } from "@/lib/utils/date-filters"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  TrendingUp, TrendingDown, Users, Building2, DollarSign, Activity,
  AlertTriangle, MoreHorizontal, Eye, ShieldCheck, Settings, Layers,
  Stethoscope, Search, Bell, RefreshCw, ChevronRight, CircleDot,
  CalendarDays, UserPlus, CreditCard, FileText, Zap, Globe,
  Server, HardDrive, Cpu, Mail, MessageSquare, Phone, Image,
  Lock, Database, Clock, BarChart3, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, AlertCircle, Info, CheckCircle2,
  XCircle, Plus, Wrench, Megaphone, HeadphonesIcon, FileDown,
  SlidersHorizontal, Briefcase
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { getAllPlans, impersonateClinic, globalSearch } from "@/lib/actions/super-admin"
import { SuperAdminNotificationBell } from "@/components/super-admin/super-admin-notification-bell"
// ─── TYPES ───────────────────────────────────────────────────────
interface PlatformStats {
  totalClinics: number; activeClinics: number; totalUsers: number; totalDoctors: number
  totalPatients: number; appointmentsToday: number; mrr: number; activeTrials: number
  expiringSubs: number; failedPayments: number
  clinicsGrowth: number; patientsGrowth: number; doctorsGrowth: number; mrrGrowth: number
}

interface Clinic {
  id: string; name: string
  subscription: { status: string; endDate: Date | null; plan: { name: string } | null } | null
  _count: { users: number; branches: number; patients: number; appointments: number }
  createdAt: Date
}

interface SubscriptionOverview {
  active: number; expiringSoon: number; expired: number; suspended: number; cancelled: number; trial: number
  planChart: { name: string; value: number; fill: string }[]
  trendChart: { month: string; count: number }[]
}

interface ClinicOverview {
  total: number; active: number; inactive: number; newThisMonth: number
  avgDoctors: number; avgBranches: number; avgPatients: number; avgAppointments: number
}

interface PriorityAlert {
  id: string; priority: "critical" | "warning" | "info"
  title: string; description: string; action: string; actionLabel: string
}

interface SystemMetrics {
  dbLatency: number
  storageUsed: number
  storageDetails?: {
    medicalAttachments: number
    galleryImages: number
    clinicLogos: number
    totalSizeMB: number
    avgFileSizeKB: number
  }
  dau: number
  wau: number
  mau: number
  errorRate: number
}

interface AuditLog {
  id: string; action: string; entityType: string; entityId: string
  createdAt: Date; userId: string | null
  user: { id: string; name: string; email: string } | null
  clinic: { id: string; name: string } | null
}

interface BillingData {
  mrr: number; arr: number; activeSubsCount: number
  failedPayments: { id: string; invoiceNumber: string | null; createdAt: Date; status: string; amount: number; clinic: { name: string } | null }[]
  chartData: { month: string; revenue: number }[]
}

// ─── SPARKLINE ───────────────────────────────────────────────────
const Sparkline = ({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) => (
  <div className="absolute bottom-0 left-0 w-full h-14 opacity-20 pointer-events-none">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <YAxis domain={["dataMin", "dataMax"]} hide />
        <defs>
          <linearGradient id={"spark-" + dataKey + "-" + color} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={"url(#spark-" + dataKey + "-" + color + ")"} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="premium-card px-4 py-3 shadow-xl border-none">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold text-foreground" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name?.includes('Revenue') ? formatCurrency(p.value) : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export function SuperAdminDashboard({
  initialStats, initialClinics, initialSparklines, initialHealth,
  initialSubscriptionOverview, initialClinicOverview, initialPriorityAlerts,
  initialSystemMetrics, initialAuditLogs, initialBillingData, initialAnnouncements
}: {
  initialStats: PlatformStats | null
  initialClinics: Clinic[]
  initialSparklines: any[]
  initialHealth: any
  initialSubscriptionOverview: SubscriptionOverview | null
  initialClinicOverview: ClinicOverview | null
  initialPriorityAlerts: PriorityAlert[]
  initialSystemMetrics: SystemMetrics | null
  initialAuditLogs: AuditLog[]
  initialBillingData: BillingData | null
  initialAnnouncements?: any[]
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [stats] = useState(initialStats)
  const [clinics] = useState(initialClinics)
  const [subscriptionOverview] = useState(initialSubscriptionOverview)
  const [clinicOverview] = useState(initialClinicOverview)
  const [priorityAlerts] = useState(initialPriorityAlerts)
  const [systemMetrics] = useState(initialSystemMetrics)
  const [auditLogs] = useState(initialAuditLogs)
  const [billingData] = useState(initialBillingData)
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(format(new Date(), "MMM d, yyyy 'at' h:mm a"))
    async function loadPlans() { const data = await getAllPlans(); setPlans(data) }
    loadPlans();
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) { setSearchResults([]); return }
    const result = await globalSearch(query)
    setSearchResults(result.results || [])
  }, [])

  const handleImpersonate = async (clinicId: string) => {
    setLoadingAction(clinicId)
    const result = await impersonateClinic(clinicId)
    setLoadingAction(null)
    if (result.success) {
      router.push(`/super-admin/clinics/${clinicId}`)
    } else {
      alert("Failed: " + result.error)
    }
  }

  const KPICard = ({
    title, value, icon: Icon, trend, description, sparkColor,
    className, sparkData, sparkKey, suffix
  }: {
    title: string; value: string | number; icon: any; trend?: number
    description?: string; sparkColor?: string; className?: string
    sparkData?: any[]; sparkKey?: string; suffix?: string
  }) => (
    <Card className={cn(
      "premium-card relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 border-none group",
      className
    )}>
      {sparkData && sparkKey && sparkColor && <Sparkline data={sparkData} dataKey={sparkKey} color={sparkColor} />}
      <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/30 dark:bg-white/5 blur-2xl pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform">
          <Icon className="h-4 w-4 text-[#6B9CFF]" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {trend !== undefined && trend !== 0 && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-lg",
              trend > 0 ? "text-[#6BCB77] bg-[#6BCB77]/10" : "text-[#EF6B6B] bg-[#EF6B6B]/10"
            )}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
      </CardContent>
    </Card>
  )

  const HealthDot = ({ status, label }: { status: string; label: string }) => {
    const config: Record<string, { color: string; bg: string; pulse: boolean }> = {
      operational: { color: "text-[#6BCB77]", bg: "bg-[#6BCB77]", pulse: true },
      degraded: { color: "text-[#F4B860]", bg: "bg-[#F4B860]", pulse: false },
      down: { color: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]", pulse: false },
    }
    const c = config[status] || config.degraded
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("flex items-center gap-2 text-xs font-semibold", c.color)}>
          {c.pulse && (
            <span className="relative flex h-2 w-2">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", c.bg)} />
              <span className={cn("relative inline-flex rounded-full h-2 w-2", c.bg)} />
            </span>
          )}
          {!c.pulse && <span className={cn("h-2 w-2 rounded-full", c.bg)} />}
          {status === "operational" ? "Healthy" : status === "degraded" ? "Warning" : "Down"}
        </span>
      </div>
    )
  }

  const alertConfig = {
    critical: { icon: XCircle, borderColor: "border-[#EF6B6B]/20", bgColor: "bg-[#EF6B6B]/5", iconColor: "text-[#EF6B6B]", iconBg: "bg-[#EF6B6B]/10", btnBorder: "border-[#EF6B6B]/30", btnText: "text-[#EF6B6B]", btnHover: "hover:bg-[#EF6B6B]/10", titleColor: "text-[#EF6B6B]", descColor: "text-[#EF6B6B]/70" },
    warning: { icon: AlertTriangle, borderColor: "border-[#F4B860]/20", bgColor: "bg-[#F4B860]/5", iconColor: "text-[#F4B860]", iconBg: "bg-[#F4B860]/10", btnBorder: "border-[#F4B860]/30", btnText: "text-[#F4B860]", btnHover: "hover:bg-[#F4B860]/10", titleColor: "text-[#F4B860]", descColor: "text-[#F4B860]/70" },
    info: { icon: Info, borderColor: "border-[#6B9CFF]/20", bgColor: "bg-[#6B9CFF]/5", iconColor: "text-[#6B9CFF]", iconBg: "bg-[#6B9CFF]/10", btnBorder: "border-[#6B9CFF]/30", btnText: "text-[#6B9CFF]", btnHover: "hover:bg-[#6B9CFF]/10", titleColor: "text-[#6B9CFF]", descColor: "text-[#6B9CFF]/70" },
  }

  const getActivityIcon = (action: string) => {
    if (action.includes("CLINIC")) return <Building2 className="h-4 w-4 text-[#6B9CFF]" />
    if (action.includes("SUBSCRIPTION") || action.includes("RENEW")) return <CreditCard className="h-4 w-4 text-[#6BCB77]" />
    if (action.includes("USER") || action.includes("DOCTOR")) return <UserPlus className="h-4 w-4 text-[#5BC0BE]" />
    if (action.includes("APPOINTMENT") || action.includes("BOOKING")) return <CalendarDays className="h-4 w-4 text-[#A78BFA]" />
    if (action.includes("INVOICE") || action.includes("PAYMENT")) return <FileText className="h-4 w-4 text-[#F4B860]" />
    if (action.includes("SUPPORT") || action.includes("FEATURE")) return <ShieldCheck className="h-4 w-4 text-[#EF6B6B]" />
    return <Activity className="h-4 w-4 text-muted-foreground" />
  }

  const quickActions = [
    { icon: Plus, label: "Create Clinic", href: "/super-admin/clinics", color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/10", hoverBg: "hover:bg-[#6B9CFF]/20" },
    { icon: CreditCard, label: "Renew Sub", href: "/super-admin/billing", color: "text-[#6BCB77]", bg: "bg-[#6BCB77]/10", hoverBg: "hover:bg-[#6BCB77]/20" },
    { icon: XCircle, label: "Suspend Clinic", href: "/super-admin/clinics", color: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]/10", hoverBg: "hover:bg-[#EF6B6B]/20" },
    { icon: CheckCircle2, label: "Activate Clinic", href: "/super-admin/clinics", color: "text-[#5BC0BE]", bg: "bg-[#5BC0BE]/10", hoverBg: "hover:bg-[#5BC0BE]/20" },
    { icon: SlidersHorizontal, label: "Manage Plans", href: "/admin/plans", color: "text-[#A78BFA]", bg: "bg-[#A78BFA]/10", hoverBg: "hover:bg-[#A78BFA]/20" },
    { icon: Megaphone, label: "Announcement", href: "#", color: "text-[#F4B860]", bg: "bg-[#F4B860]/10", hoverBg: "hover:bg-[#F4B860]/20", onClick: () => setIsAnnouncementOpen(true) },
    { icon: MessageSquare, label: "Testimonials", href: "/super-admin/testimonials", color: "text-[#EC4899]", bg: "bg-[#EC4899]/10", hoverBg: "hover:bg-[#EC4899]/20" },
    { icon: HeadphonesIcon, label: "Support Mode", href: "#", color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/10", hoverBg: "hover:bg-[#6B9CFF]/20" },
    { icon: BarChart3, label: "Revenue Report", href: "/super-admin/billing", color: "text-[#6BCB77]", bg: "bg-[#6BCB77]/10", hoverBg: "hover:bg-[#6BCB77]/20" },
    { icon: FileDown, label: "Export Reports", href: "/api/super-admin/export?type=full", color: "text-[#5BC0BE]", bg: "bg-[#5BC0BE]/10", hoverBg: "hover:bg-[#5BC0BE]/20", download: true },
    { icon: Wrench, label: "System Settings", href: "/super-admin/features", color: "text-muted-foreground", bg: "bg-muted", hoverBg: "hover:bg-muted/80" },
  ]

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-background via-background to-muted/20">
      {/* ── TOP NAVIGATION ──────────────────────────────────────── */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-foreground hidden sm:block">Nexora</h1>
            <Badge variant="outline" className="text-[10px] font-bold border-[#6B9CFF]/30 text-[#6B9CFF] bg-[#6B9CFF]/5">
              SUPER ADMIN
            </Badge>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clinics, users, subscriptions..."
              className="pl-10 h-9 bg-muted/50 border-border/50 rounded-xl text-sm"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            />
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 premium-card p-2 shadow-2xl border-none z-50 max-h-80 overflow-auto">
                {searchResults.map((r: any) => (
                  <button
                    key={r.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                    onClick={() => { router.push(r.href); setIsSearchOpen(false); setSearchQuery("") }}
                  >
                    <div className={cn("p-2 rounded-lg", r.type === 'clinic' ? 'bg-[#6B9CFF]/10' : 'bg-[#5BC0BE]/10')}>
                      {r.type === 'clinic' ? <Building2 className="h-4 w-4 text-[#6B9CFF]" /> : <Users className="h-4 w-4 text-[#5BC0BE]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ PART 1 — System Status Badge يفحص كل الخدمات */}
            {initialHealth && (() => {
              const allStatuses = Object.values(initialHealth).map((s: any) => s.status)
              const configuredStatuses = allStatuses.filter(s => s !== "not_configured")
              const hasDown = configuredStatuses.includes("down")
              const hasDegraded = configuredStatuses.includes("degraded")
              const allConfiguredOperational = configuredStatuses.length > 0 && configuredStatuses.every(s => s === "operational")
              
              let statusConfig: { bg: string; text: string; label: string }
              if (hasDown) {
                statusConfig = { bg: "bg-[#EF6B6B]/10", text: "text-[#EF6B6B]", label: "Systems Down" }
              } else if (hasDegraded) {
                statusConfig = { bg: "bg-[#F4B860]/10", text: "text-[#F4B860]", label: "Systems Degraded" }
              } else if (allConfiguredOperational) {
                statusConfig = { bg: "bg-[#6BCB77]/10", text: "text-[#6BCB77]", label: "Systems OK" }
              } else {
                statusConfig = { bg: "bg-gray-500/10", text: "text-gray-500", label: "Partially Configured" }
              }
              
              return (
                <button
                  onClick={() => router.push('/super-admin/system-health')}
                  className={cn(
                    "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer",
                    statusConfig.bg, statusConfig.text
                  )}
                >
                  <CircleDot className="h-3 w-3" />
                  {statusConfig.label}
                </button>
              )
            })()}

            {/* ✅ PART 2 — Super Admin Notification Bell */}
            <SuperAdminNotificationBell initialNotifications={[]} />

            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => router.push('/super-admin/audit-logs')}>
              <Activity className="h-4 w-4" />
            </Button>
            <DownloadPdfButton />
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 space-y-8">
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Platform Overview</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Real-time operational visibility across all {stats?.totalClinics || 0} clinics.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Last updated: {currentTime}
          </div>
        </div>

        {/* ── KPI GRID ───────────────────────────────────────────── */}
        {stats && (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <KPICard title="Monthly Revenue" value={formatCurrency(stats.mrr)} icon={DollarSign} trend={stats.mrrGrowth} description="vs last month" sparkColor="#6B9CFF" sparkData={initialSparklines} sparkKey="clinics" className="md:col-span-1" />
            <KPICard title="Annual Revenue" value={formatCurrency(stats.mrr * 12)} icon={DollarSign} description="Projected ARR" sparkColor="#6BCB77" sparkData={initialSparklines} sparkKey="clinics" className="md:col-span-1" />
            <KPICard title="Total Clinics" value={stats.totalClinics} icon={Building2} trend={stats.clinicsGrowth} suffix={"/ " + stats.activeClinics + " active"} sparkColor="#5BC0BE" sparkData={initialSparklines} sparkKey="clinics" className="md:col-span-1" />
            <KPICard title="Total Patients" value={stats.totalPatients} icon={Users} trend={stats.patientsGrowth} description="vs last month" sparkColor="#A78BFA" sparkData={initialSparklines} sparkKey="patients" className="md:col-span-1" />
            <KPICard title="Total Doctors" value={stats.totalDoctors} icon={Stethoscope} trend={stats.doctorsGrowth} description="vs last month" sparkColor="#F4B860" sparkData={initialSparklines} sparkKey="patients" className="md:col-span-1 col-span-2 md:col-span-1" />
            <KPICard title="Total Users" value={stats.totalUsers} icon={Users} description="All roles" className="md:col-span-1" />
            <KPICard title="Appointments Today" value={stats.appointmentsToday} icon={CalendarDays} description="Scheduled" className="md:col-span-1" />
            <KPICard title="Active Trials" value={stats.activeTrials} icon={Layers} description="Free trials running" className="md:col-span-1" />
            <KPICard title="Expiring Soon" value={stats.expiringSubs} icon={AlertTriangle} description="Within 7 days" className="md:col-span-1" />
            <KPICard title="Failed Payments" value={stats.failedPayments} icon={XCircle} description="Requires attention" className="md:col-span-1" />
          </div>
        )}

        {/* ── PRIORITY ALERTS ────────────────────────────────────── */}
        {priorityAlerts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#EF6B6B]" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Priority Alerts</h3>
              <Badge variant="outline" className="text-[10px] border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/5">{priorityAlerts.filter(a => a.priority === 'critical').length} Critical</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {priorityAlerts.map((alert) => {
                const config = alertConfig[alert.priority]
                const Icon = config.icon
                return (
                  <Card key={alert.id} className={cn("premium-card border-none transition-all hover:shadow-lg", config.borderColor, config.bgColor)}>
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className={cn("p-2.5 rounded-xl shrink-0", config.iconBg)}><Icon className={cn("h-5 w-5", config.iconColor)} /></div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-bold", config.titleColor)}>{alert.title}</p>
                        <p className={cn("text-xs mt-0.5", config.descColor)}>{alert.description}</p>
                        <Button variant="outline" size="sm" className={cn("mt-3 h-7 text-xs rounded-lg", config.btnBorder, config.btnText, config.btnHover)} onClick={() => router.push(alert.action)}>
                          {alert.actionLabel} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* ── REVENUE OVERVIEW ───────────────────────────────────── */}
        {mounted && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="premium-card border-none h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#6B9CFF]/10"><BarChart3 className="h-5 w-5 text-[#6B9CFF]" /></div>
                    <div>
                      <CardTitle className="text-base font-bold">Revenue Overview</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Monthly collected payments</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[#6B9CFF] hover:text-[#6B9CFF]/80" onClick={() => router.push("/super-admin/billing")}>View All <ChevronRight className="h-3.5 w-3.5 ml-1" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {billingData?.chartData && billingData.chartData.length > 0 ? (
                  <ChartWrapper height={280}>
                    <AreaChart data={billingData.chartData}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6B9CFF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6B9CFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6B9CFF" fill="url(#revenueGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#6B9CFF', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6B9CFF', strokeWidth: 2, stroke: '#fff' }} />
                    </AreaChart>
                  </ChartWrapper>
                ) : (
                  <EmptyState icon={BarChart3} title="No Revenue Data" description="Revenue data will appear as payments are collected." className="py-12" />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="premium-card border-none">
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#6BCB77]/10"><DollarSign className="h-4 w-4 text-[#6BCB77]" /></div><div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">MRR</p><p className="text-xl font-extrabold text-foreground">{formatCurrency(billingData?.mrr || 0)}</p></div></div>
                <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#6B9CFF]/10"><TrendingUp className="h-4 w-4 text-[#6B9CFF]" /></div><div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ARR</p><p className="text-xl font-extrabold text-foreground">{formatCurrency(billingData?.arr || 0)}</p></div></div>
                <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#5BC0BE]/10"><CreditCard className="h-4 w-4 text-[#5BC0BE]" /></div><div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Subscriptions</p><p className="text-xl font-extrabold text-foreground">{billingData?.activeSubsCount || 0}</p></div></div>
              </CardContent>
            </Card>
            {billingData?.failedPayments && billingData.failedPayments.length > 0 && (
              <Card className="premium-card border-none">
                <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm font-bold">Recent Unpaid</CardTitle><Badge variant="outline" className="text-[10px] border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/5">{billingData.failedPayments.length}</Badge></div></CardHeader>
                <CardContent className="space-y-2.5">
                  {billingData.failedPayments.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0"><p className="text-xs font-medium text-foreground truncate">{inv.clinic?.name || 'Unknown'}</p><p className="text-[10px] text-muted-foreground">{inv.invoiceNumber}</p></div>
                      <span className="text-xs font-bold text-[#EF6B6B] shrink-0 ml-2">{formatCurrency(inv.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        )}

        {/* ── SUBSCRIPTION + CLINIC OVERVIEW ─────────────────────── */}
        {mounted && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="premium-card border-none">
            <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#A78BFA]/10"><CreditCard className="h-5 w-5 text-[#A78BFA]" /></div><div><CardTitle className="text-base font-bold">Subscription Overview</CardTitle><p className="text-xs text-muted-foreground mt-0.5">Distribution across all plans</p></div></div></CardHeader>
            <CardContent>
              {subscriptionOverview ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-xl bg-[#6BCB77]/5 border border-[#6BCB77]/10"><p className="text-lg font-extrabold text-[#6BCB77]">{subscriptionOverview.active}</p><p className="text-[10px] font-semibold text-muted-foreground uppercase">Active</p></div>
                    <div className="text-center p-3 rounded-xl bg-[#6B9CFF]/5 border border-[#6B9CFF]/10"><p className="text-lg font-extrabold text-[#6B9CFF]">{subscriptionOverview.trial}</p><p className="text-[10px] font-semibold text-muted-foreground uppercase">Trial</p></div>
                    <div className="text-center p-3 rounded-xl bg-[#EF6B6B]/5 border border-[#EF6B6B]/10"><p className="text-lg font-extrabold text-[#EF6B6B]">{subscriptionOverview.expired + subscriptionOverview.suspended + subscriptionOverview.cancelled}</p><p className="text-[10px] font-semibold text-muted-foreground uppercase">Inactive</p></div>
                  </div>
                  {subscriptionOverview.planChart.length > 0 && (
                  <ChartWrapper height={180}>
                    <PieChart><Pie data={subscriptionOverview.planChart} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>{subscriptionOverview.planChart.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}</Pie><Tooltip content={<ChartTooltip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} /></PieChart>
                  </ChartWrapper>
                  )}
                  {subscriptionOverview.trendChart.length > 0 && (
                  <ChartWrapper height={120}>
                    <BarChart data={subscriptionOverview.trendChart}><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><Bar dataKey="count" name="New Subs" fill="#A78BFA" radius={[4, 4, 0, 0]} barSize={20} /></BarChart>
                  </ChartWrapper>
                  )}
                </div>
              ) : <EmptyState icon={CreditCard} title="No Subscription Data" description="Subscription data will appear here." className="py-8" />}
            </CardContent>
          </Card>

          <Card className="premium-card border-none">
            <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#5BC0BE]/10"><Building2 className="h-5 w-5 text-[#5BC0BE]" /></div><div><CardTitle className="text-base font-bold">Clinic Overview</CardTitle><p className="text-xs text-muted-foreground mt-0.5">Platform clinic metrics & averages</p></div></div></CardHeader>
            <CardContent>
              {clinicOverview ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#6BCB77]/5 border border-[#6BCB77]/10"><p className="text-xs font-semibold text-muted-foreground">Active</p><p className="text-xl font-extrabold text-[#6BCB77]">{clinicOverview.active}</p></div>
                    <div className="p-3.5 rounded-xl bg-[#F4B860]/5 border border-[#F4B860]/10"><p className="text-xs font-semibold text-muted-foreground">New This Month</p><p className="text-xl font-extrabold text-[#F4B860]">+{clinicOverview.newThisMonth}</p></div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Averages per Clinic</p>
                    {[
                      { label: 'Doctors', value: clinicOverview.avgDoctors, icon: Stethoscope, color: 'text-[#6B9CFF]', bg: 'bg-[#6B9CFF]/10' },
                      { label: 'Branches', value: clinicOverview.avgBranches, icon: Globe, color: 'text-[#5BC0BE]', bg: 'bg-[#5BC0BE]/10' },
                      { label: 'Patients', value: clinicOverview.avgPatients, icon: Users, color: 'text-[#A78BFA]', bg: 'bg-[#A78BFA]/10' },
                      { label: 'Appointments', value: clinicOverview.avgAppointments, icon: CalendarDays, color: 'text-[#F4B860]', bg: 'bg-[#F4B860]/10' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3"><div className={cn("p-1.5 rounded-lg", item.bg)}><item.icon className={cn("h-3.5 w-3.5", item.color)} /></div><span className="text-sm text-muted-foreground">{item.label}</span></div>
                        <span className={cn("text-sm font-bold", item.color)}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <EmptyState icon={Building2} title="No Clinic Data" description="Clinic metrics will appear here." className="py-8" />}
            </CardContent>
          </Card>
        </div>
        )}

        {/* ── ANNOUNCEMENTS ──────────────────────────────────────── */}
                <AnnouncementsCenter 
          isDialogOpen={isAnnouncementOpen} 
          onDialogChange={setIsAnnouncementOpen} 
          initialAnnouncements={initialAnnouncements} 
        />

        {/* ── QUICK ACTIONS ──────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#F4B860]" /><h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Quick Actions</h3></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {quickActions.map((action) => (
              <button key={action.label} className="premium-card p-4 flex flex-col items-center gap-3 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-none group" onClick={() => { if (action.onClick) { action.onClick() } else if (action.download && action.href) { window.open(action.href, '_blank') } else if (action.href && action.href !== "#") { router.push(action.href) } }}>
                <div className={cn("p-3 rounded-xl transition-colors", action.bg, action.hoverBg)}><action.icon className={cn("h-5 w-5", action.color)} /></div>
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RECENT CLINICS + TIMELINE + HEALTH ─────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="premium-card border-none">
              <CardHeader className="pb-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#5BC0BE]/10"><Building2 className="h-5 w-5 text-[#5BC0BE]" /></div><CardTitle className="text-base font-bold">Recent Clinics</CardTitle></div><Button variant="ghost" size="sm" className="text-[#5BC0BE] hover:text-[#5BC0BE]/80" onClick={() => router.push("/super-admin/clinics")}>View All <ChevronRight className="h-3.5 w-3.5 ml-1" /></Button></div></CardHeader>
              <CardContent>
                {clinics.length > 0 ? (
                  <div className="relative w-full overflow-auto"><table className="w-full caption-bottom text-sm"><thead><tr className="border-b border-border/50"><th className="h-10 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinic</th><th className="h-10 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th><th className="h-10 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Patients</th><th className="h-10 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th><th className="h-10 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th></tr></thead>
                  <tbody>{clinics.slice(0, 6).map((clinic) => (<tr key={clinic.id} className="border-b border-border/30 transition-colors hover:bg-muted/20 group"><td className="p-4 align-middle"><div className="flex flex-col"><span className="text-sm font-medium text-foreground group-hover:text-[#5BC0BE] transition-colors">{clinic.name}</span><span className="text-xs text-muted-foreground">{clinic._count.branches} Branches · {clinic._count.users} Users</span></div></td><td className="p-4 align-middle text-xs text-muted-foreground font-medium">{clinic.subscription?.plan?.name || 'No Plan'}</td><td className="p-4 align-middle text-sm font-semibold text-foreground hidden md:table-cell">{clinic._count.patients}</td><td className="p-4 align-middle"><Badge variant="outline" className={cn("text-[10px] font-bold capitalize", clinic.subscription?.status === 'ACTIVE' && "border-[#6BCB77]/30 text-[#6BCB77] bg-[#6BCB77]/10", clinic.subscription?.status === 'TRIAL' && "border-[#6B9CFF]/30 text-[#6B9CFF] bg-[#6B9CFF]/10", clinic.subscription?.status === 'EXPIRED' && "border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/10")}>{clinic.subscription?.status || 'INACTIVE'}</Badge></td><td className="p-4 align-middle text-right"><DropdownMenu><DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={() => router.push("/super-admin/clinics/" + clinic.id)} className="cursor-pointer"><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem><DropdownMenuItem onClick={() => handleImpersonate(clinic.id)} className="text-[#F4B860] cursor-pointer focus:text-[#F4B860]" disabled={loadingAction === clinic.id}><ShieldCheck className="mr-2 h-4 w-4" />{loadingAction === clinic.id ? "Switching..." : "Support Mode"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>))}</tbody></table></div>
                ) : <EmptyState icon={Building2} title="No Clinics Yet" description="Registered clinics will appear here." className="py-8" />}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="premium-card border-none"><CardHeader className="pb-3"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#6BCB77]/10"><Server className="h-5 w-5 text-[#6BCB77]" /></div><CardTitle className="text-base font-bold">Platform Health</CardTitle></div></CardHeader><CardContent className="space-y-1">{initialHealth ? (<>{Object.entries(initialHealth).map(([key, item]: any) => (<HealthDot key={key} status={item.status} label={key} />))}</>) : (<p className="text-sm text-muted-foreground py-4 text-center">Loading health status...</p>)}</CardContent></Card>

            {systemMetrics && (
            <Card className="premium-card border-none"><CardHeader className="pb-3"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#6B9CFF]/10"><Cpu className="h-5 w-5 text-[#6B9CFF]" /></div><CardTitle className="text-base font-bold">System Metrics</CardTitle></div></CardHeader><CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30"><span className="text-xs text-muted-foreground">DB Latency</span><span className={cn("text-xs font-bold", systemMetrics.dbLatency < 100 ? "text-[#6BCB77]" : systemMetrics.dbLatency < 300 ? "text-[#F4B860]" : "text-[#EF6B6B]")}>{systemMetrics.dbLatency}ms</span></div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-xs text-muted-foreground">Total Files</span>
                <span className="text-xs font-bold text-foreground">{systemMetrics.storageUsed}</span>
              </div>
              {/* ✅ تفصيل التخزين */}
              {"storageDetails" in systemMetrics && systemMetrics.storageDetails && (
                <div className="pl-3 space-y-1.5 border-l-2 border-[#6B9CFF]/20">
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Medical Files</span><span className="font-semibold">{systemMetrics.storageDetails.medicalAttachments}</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Gallery Images</span><span className="font-semibold">{systemMetrics.storageDetails.galleryImages}</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Clinic Logos</span><span className="font-semibold">{systemMetrics.storageDetails.clinicLogos}</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Total Size</span><span className="font-semibold text-[#6B9CFF]">{systemMetrics.storageDetails.totalSizeMB} MB</span></div>
                  {systemMetrics.storageDetails.avgFileSizeKB > 0 && (
                    <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Avg File Size</span><span className="font-semibold">{systemMetrics.storageDetails.avgFileSizeKB} KB</span></div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30"><span className="text-xs text-muted-foreground">Error Rate</span><span className={cn("text-xs font-bold", systemMetrics.errorRate < 1 ? "text-[#6BCB77]" : systemMetrics.errorRate < 5 ? "text-[#F4B860]" : "text-[#EF6B6B]")}>{systemMetrics.errorRate}%</span></div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center p-2 rounded-lg bg-[#6B9CFF]/5"><p className="text-sm font-extrabold text-[#6B9CFF]">{systemMetrics.dau}</p><p className="text-[9px] font-semibold text-muted-foreground uppercase">DAU</p></div>
                <div className="text-center p-2 rounded-lg bg-[#5BC0BE]/5"><p className="text-sm font-extrabold text-[#5BC0BE]">{systemMetrics.wau}</p><p className="text-[9px] font-semibold text-muted-foreground uppercase">WAU</p></div>
                <div className="text-center p-2 rounded-lg bg-[#A78BFA]/5"><p className="text-sm font-extrabold text-[#A78BFA]">{systemMetrics.mau}</p><p className="text-[9px] font-semibold text-muted-foreground uppercase">MAU</p></div>
              </div>
            </CardContent></Card>
            )}

            <Card className="premium-card border-none bg-gradient-to-br from-[#6B9CFF]/5 via-transparent to-[#5BC0BE]/5"><CardHeader className="pb-3"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#6B9CFF]/10"><Settings className="h-5 w-5 text-[#6B9CFF]" /></div><CardTitle className="text-base font-bold">Admin Tools</CardTitle></div></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground leading-relaxed">Generate activation codes and manage platform configuration.</p>
            <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="..."> Generate Code</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-6">
                <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b border-border/50 -mx-6 -mt-6 px-6 pt-6 rounded-t-xl">
                  <DialogTitle>Generate Activation Code</DialogTitle>
                </DialogHeader>
                <GenerateCodeForm plans={plans} />
              </DialogContent>
            </Dialog>
            <div className="grid grid-cols-2 gap-2"><Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl h-9" onClick={() => router.push("/super-admin/audit-logs")}><Activity className="mr-2 h-3.5 w-3.5" /> Audit Logs</Button><Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl h-9" onClick={() => router.push("/super-admin/features")}><Settings className="mr-2 h-3.5 w-3.5" /> Features</Button></div></CardContent></Card>
          </div>
        </div>

        {/* ── RECENT ACTIVITY TIMELINE ───────────────────────────── */}
        <Card className="premium-card border-none">
          <CardHeader className="pb-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-[#A78BFA]/10"><Clock className="h-4 w-4 text-[#A78BFA]" /></div><div><CardTitle className="text-base font-bold">Recent Activity</CardTitle><p className="text-xs text-muted-foreground mt-0.5">Platform-wide audit trail</p></div></div><Button variant="ghost" size="sm" className="text-[#A78BFA] hover:text-[#A78BFA]/80" onClick={() => router.push("/super-admin/audit-logs")}>View All <ChevronRight className="h-3.5 w-3.5 ml-1" /></Button></div></CardHeader>
          <CardContent>
            {auditLogs.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/50" />
                <div className="space-y-4">
                  {auditLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="relative flex items-start gap-4 group">
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border/50 shadow-sm group-hover:shadow-md transition-shadow">{getActivityIcon(log.action)}</div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0"><p className="text-sm font-medium text-foreground">{log.action.replace(/_/g, ' ')}</p><div className="flex items-center gap-2 mt-0.5">{log.clinic && (<Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground h-5">{log.clinic.name}</Badge>)}{log.user && (<span className="text-xs text-muted-foreground">{log.user.name}</span>)}</div></div>
                          <div className="text-right shrink-0"><p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "MMM d")}</p><p className="text-[10px] text-muted-foreground/60">{format(new Date(log.createdAt), "h:mm a")}</p></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyState icon={Clock} title="No Activity Yet" description="Platform activity will appear here as events occur." className="py-12" />}
          </CardContent>
        </Card>

        <div className="h-8" />
      </div>
    </div>
  )
}