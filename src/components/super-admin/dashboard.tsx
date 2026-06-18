"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  MoreHorizontal,
  Eye,
  ShieldCheck,
  Settings,
  Layers
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface PlatformStats {
  totalClinics: number
  activeClinics: number
  totalUsers: number
  totalDoctors: number
  totalPatients: number
  appointmentsToday: number
  mrr: number
  activeTrials: number
  expiringSubs: number
  failedPayments: number
}

interface Clinic {
  id: string
  name: string
  subscription: { status: string; endDate: Date | null } | null
  _count: { users: number; branches: number }
  createdAt: Date
}

export function SuperAdminDashboard({ 
  initialStats, 
  initialClinics 
}: { 
  initialStats: PlatformStats | null, 
  initialClinics: Clinic[] 
}) {
  const [stats] = useState(initialStats)
  const [clinics] = useState(initialClinics)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const KPICard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendUp, 
    suffix = "", 
    className 
  }: any) => (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg border-border/50", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value?.toLocaleString()} {suffix}
        </div>
        {trend !== undefined && (
          <p className={cn("text-xs flex items-center gap-1 mt-1", trendUp ? "text-emerald-500" : "text-rose-500")}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="font-medium">{trend}%</span>
            <span className="text-muted-foreground font-normal">from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time analytics and system health monitoring.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Activity className="mr-2 h-4 w-4 text-emerald-500" /> System Healthy
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            Generate Report
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard 
            title="Total Revenue (MRR)" 
            value={stats.mrr} 
            icon={DollarSign} 
            formatFn={formatCurrency}
            trend={12.5} 
            trendUp={true} 
          />
          <KPICard 
            title="Active Clinics" 
            value={stats.activeClinics} 
            icon={Building2} 
            suffix={`/${stats.totalClinics}`}
            trend={8.2} 
            trendUp={true} 
          />
          <KPICard 
            title="Total Patients" 
            value={stats.totalPatients} 
            icon={Users} 
            trend={5.4} 
            trendUp={true} 
          />
          <KPICard 
            title="Appointments Today" 
            value={stats.appointmentsToday} 
            icon={Activity} 
            trend={-2.1} 
            trendUp={false} 
          />
          
          <KPICard title="Total Doctors" value={stats.totalDoctors} icon={ShieldCheck} className="md:col-span-1" />
          <KPICard title="Active Trials" value={stats.activeTrials} icon={Layers} className="md:col-span-1" />
          
          <Card className="col-span-1 md:col-span-2 border-amber-500/20 bg-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Action Required</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent className="flex gap-6">
              <div className="flex-1">
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.expiringSubs}</div>
                <p className="text-xs text-amber-800/70 dark:text-amber-200/70">Expiring Soon</p>
              </div>
              <div className="w-px bg-amber-500/20 h-10" />
              <div className="flex-1">
                <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">{stats.failedPayments}</div>
                <p className="text-xs text-rose-800/70 dark:text-rose-200/70">Failed Payments</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Clinics</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Clinic</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Users</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.slice(0, 5).map((clinic) => (
                    <tr key={clinic.id} className="border-b transition-colors hover:bg-muted/50/50">
                      <td className="p-4 align-middle font-medium">
                        <div className="flex flex-col">
                          <span>{clinic.name}</span>
                          <span className="text-xs text-muted-foreground">Joined {new Date(clinic.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">Pro Plan</td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {clinic._count.users}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge 
                          variant={clinic.subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={cn(
                            "capitalize",
                            clinic.subscription?.status === 'ACTIVE' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}
                        >
                          {clinic.subscription?.status || 'INACTIVE'}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <DropdownMenu>
                          {/* ✅ Fixed: Styled Trigger Directly */}
                          <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-primary cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-amber-600 cursor-pointer">
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Support Mode
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </DropdownMenuItem>
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

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Server</span>
                <span className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Operational (24ms)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage</span>
                <span className="text-xs font-medium text-amber-600">75% Used</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Admin Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Generate activation codes for new trials or extensions.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="w-full">
                  Generate Code
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Audit Logs
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}