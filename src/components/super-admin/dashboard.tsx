"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAllPlans, impersonateClinic } from "@/lib/actions/super-admin"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, Users, Building2, DollarSign, Activity, AlertTriangle, MoreHorizontal, Eye, ShieldCheck, Settings, Layers, Stethoscope } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { GenerateCodeForm } from "@/components/admin/generate-code-form"
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts"
import { DownloadPdfButton } from "@/components/super-admin/download-pdf-button"

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

const Sparkline = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => (
  <div className="absolute bottom-0 left-0 w-full h-12 opacity-20">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <YAxis domain={["dataMin", "dataMax"]} hide />
        <defs>
          <linearGradient id={`spark-${dataKey}-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#spark-${dataKey}-${color})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)

export function SuperAdminDashboard({ 
  initialStats, initialClinics, initialSparklines, initialHealth
}: { 
  initialStats: PlatformStats | null, 
  initialClinics: Clinic[],
  initialSparklines: any[],
  initialHealth: any
}) {
  const router = useRouter()
  const [stats] = useState(initialStats)
  const [clinics] = useState(initialClinics)
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadPlans() { const data = await getAllPlans(); setPlans(data) }
    loadPlans();
  }, []);

  const handleImpersonate = async (clinicId: string) => {
    setLoadingAction(clinicId);
    const result = await impersonateClinic(clinicId);
    setLoadingAction(null);
    if (result.success) { router.push('/super-admin'); router.refresh(); }
    else alert("❌ Failed: " + result.error);
  }

  const KPICard = ({ title, value, icon: Icon, trend, sparkColor, className, sparkData, sparkKey }: any) => (
    <Card className={cn("relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-border/50 bg-card", className)}>
      {sparkData && <Sparkline data={sparkData} dataKey={sparkKey} color={sparkColor} />}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-muted/50 rounded-lg border border-border/50"><Icon className="h-4 w-4 text-primary" /></div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold tracking-tight text-foreground">{value?.toLocaleString() ?? 0}</div>
        {trend !== undefined && trend !== 0 && (
          <p className={cn("text-xs flex items-center gap-1 mt-2", trend > 0 ? "text-emerald-500" : "text-rose-500")}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="font-semibold">{Math.abs(trend)}%</span>
            <span className="text-muted-foreground font-normal">vs last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Platform Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time analytics based on live database metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <DownloadPdfButton />
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <KPICard title="Monthly Revenue (MRR)" value={stats.mrr} icon={DollarSign} trend={stats.mrrGrowth} suffix="EGP" sparkColor="#3b82f6" sparkData={initialSparklines} sparkKey="clinics" />
          <KPICard title="Active Clinics" value={stats.activeClinics} icon={Building2} suffix={`/ ${stats.totalClinics}`} trend={stats.clinicsGrowth} sparkColor="#10b981" sparkData={initialSparklines} sparkKey="clinics" />
          <KPICard title="Total Patients" value={stats.totalPatients} icon={Users} trend={stats.patientsGrowth} sparkColor="#8b5cf6" sparkData={initialSparklines} sparkKey="patients" />
          <KPICard title="Doctors" value={stats.totalDoctors} icon={Stethoscope} trend={stats.doctorsGrowth} sparkColor="#f59e0b" sparkData={initialSparklines} sparkKey="patients" />
          <KPICard title="Active Trials" value={stats.activeTrials} icon={Layers} className="xl:col-span-1 md:col-span-2 lg:col-span-1" />
        </div>
      )}

      {stats && (stats.expiringSubs > 0 || stats.failedPayments > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.expiringSubs > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-2 bg-amber-500/10 rounded-lg"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{stats.expiringSubs} Expiring Soon</p>
                  <p className="text-xs text-amber-700/70 dark:text-amber-300/70">Within 7 days</p>
                </div>
                <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10" onClick={() => router.push('/super-admin/billing')}>Review</Button>
              </CardContent>
            </Card>
          )}
          {stats.failedPayments > 0 && (
            <Card className="border-rose-500/20 bg-rose-500/5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-2 bg-rose-500/10 rounded-lg"><AlertTriangle className="h-5 w-5 text-rose-600" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">{stats.failedPayments} Unpaid Invoices</p>
                  <p className="text-xs text-rose-700/70 dark:text-rose-300/70">Requires attention</p>
                </div>
                <Button variant="outline" size="sm" className="border-rose-500/30 text-rose-700 hover:bg-rose-500/10" onClick={() => router.push('/super-admin/billing')}>Review</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Clinics</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => router.push('/super-admin/clinics')}>View All</Button>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b"><tr className="border-b"><th className="h-10 px-4 text-left font-medium text-muted-foreground">Clinic</th><th className="h-10 px-4 text-left font-medium text-muted-foreground">Plan</th><th className="h-10 px-4 text-left font-medium text-muted-foreground">Patients</th><th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th><th className="h-10 px-4 text-right font-medium text-muted-foreground"></th></tr></thead>
                  <tbody>
                    {clinics.slice(0, 5).map((clinic) => (
                      <tr key={clinic.id} className="border-b transition-colors hover:bg-muted/30 group">
                        <td className="p-4 align-middle font-medium"><div className="flex flex-col"><span className="text-foreground group-hover:text-primary transition-colors">{clinic.name}</span><span className="text-xs text-muted-foreground">{clinic._count.branches} Branches • {clinic._count.users} Users</span></div></td>
                        <td className="p-4 align-middle text-muted-foreground text-xs">{clinic.subscription?.plan?.name || 'No Plan'}</td>
                        <td className="p-4 align-middle text-muted-foreground font-medium">{clinic._count.patients}</td>
                        <td className="p-4 align-middle"><Badge variant="outline" className={cn("capitalize text-xs", clinic.subscription?.status === 'ACTIVE' && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10", clinic.subscription?.status === 'TRIAL' && "border-blue-500/30 text-blue-600 bg-blue-500/10")}>{clinic.subscription?.status || 'INACTIVE'}</Badge></td>
                        <td className="p-4 align-middle text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent transition-colors"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => router.push(`/super-admin/clinics/${clinic.id}`)} className="cursor-pointer"><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleImpersonate(clinic.id)} className="text-amber-600 cursor-pointer focus:text-amber-600" disabled={loadingAction === clinic.id}><ShieldCheck className="mr-2 h-4 w-4" />{loadingAction === clinic.id ? "Switching..." : "Support Mode"}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* ✅ الـ Sidebar بقيم حقيقية من الداتابيز */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">System Health</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {initialHealth ? Object.entries(initialHealth).map(([key, item]: any) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{key}</span>
                  <span className={cn("flex items-center gap-2 text-xs font-medium", item.status === "operational" ? "text-emerald-600" : "text-amber-600")}>
                    {item.status === "operational" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    {item.label}
                  </span>
                </div>
              )) : <p className="text-sm text-muted-foreground">Loading...</p>}
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Admin Tools</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">Generate activation codes for new clinic trials or extensions.</p>
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
                  <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors">Generate Code</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Generate Activation Code</DialogTitle></DialogHeader><GenerateCodeForm plans={plans} /></DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/admin/audit-logs')}>Audit Logs</Button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => router.push('/super-admin/billing')}><DollarSign className="mr-2 h-4 w-4" /> Billing</Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => router.push('/super-admin/features')}><Settings className="mr-2 h-4 w-4" /> Features</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}