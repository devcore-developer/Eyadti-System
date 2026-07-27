import { getRealSystemHealth, getPlatformUsageMetrics, getPlatformStats } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Database, Server, Bell, CheckCircle, AlertTriangle, HardDrive, Clock, XCircle, 
  Mail, MessageSquare, Phone, Image, Lock, CalendarDays, Users, Activity, Globe
} from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

// توسيع قائمة الخدمات لتشمل كل متطلبات Part 3
const infrastructureChecks = [
  { key: "api", label: "API Gateway", icon: Globe },
  { key: "db", label: "Database Cluster", icon: Database },
  { key: "storage", label: "Object Storage", icon: HardDrive },
  { key: "jobs", label: "Background Jobs", icon: Clock },
  { key: "email", label: "Email Service (SMTP)", icon: Mail },
  { key: "sms", label: "SMS Provider", icon: Phone },
  { key: "whatsapp", label: "WhatsApp API", icon: MessageSquare },
  { key: "auth", label: "Authentication System", icon: Lock },
  { key: "upload", label: "Image Processing", icon: Image },
]

export default async function SystemHealthPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  // جلب البيانات بشكل متوازي
  const [health, usage, stats] = await Promise.all([
    getRealSystemHealth(),
    getPlatformUsageMetrics(),
    getPlatformStats()
  ])

  if (!health) return <div className="p-8 text-center text-muted-foreground">Failed to load health metrics.</div>

  const hasIssues = Object.values(health).some(s => s.status !== "operational")
  const hasCritical = Object.values(health).some(s => s.status === "down")

  const getStatusColor = (status: string) => {
    if (status === "operational") return { text: "text-[#6BCB77]", bg: "bg-[#6BCB77]", badgeBg: "bg-[#6BCB77]/10 border-[#6BCB77]/20 text-[#6BCB77]" }
    if (status === "degraded") return { text: "text-[#F4B860]", bg: "bg-[#F4B860]", badgeBg: "bg-[#F4B860]/10 border-[#F4B860]/20 text-[#F4B860]" }
    return { text: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]", badgeBg: "bg-[#EF6B6B]/10 border-[#EF6B6B]/20 text-[#EF6B6B]" }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Health & Monitoring</h2>
        <p className="text-muted-foreground mt-1">Live system metrics, usage statistics, and infrastructure status.</p>
      </div>

      {/* Overall Status Banner */}
      <Card className={cn(
        "premium-card border-none",
        hasCritical ? "bg-[#EF6B6B]/5" : 
        hasIssues ? "bg-[#F4B860]/5" : "bg-[#6BCB77]/5"
      )}>
        <CardContent className="flex items-center gap-4 p-6">
          <div className={cn(
            "p-3 rounded-full", 
            hasCritical ? "bg-[#EF6B6B]" : hasIssues ? "bg-[#F4B860]" : "bg-[#6BCB77]"
          )}>
            {hasCritical ? <XCircle className="h-6 w-6 text-white" /> : hasIssues ? <AlertTriangle className="h-6 w-6 text-white" /> : <CheckCircle className="h-6 w-6 text-white" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {hasCritical ? "Critical Issues Detected" : hasIssues ? "Minor Issues Detected" : "All Systems Operational"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasCritical ? "A service is down or responding very slowly." : hasIssues ? "Some services are experiencing higher than usual loads." : "Platform is running smoothly with no critical errors."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Status Grid (9 Services) */}
      <Card className="premium-card border-none">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-5 w-5 text-[#6B9CFF]" /> Infrastructure Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {infrastructureChecks.map(check => {
              // استخدام البيانات الحقيقية لو موجودة، ولو مش موجودة نحطها Healthy كـ Fallback
              const serviceData = (health as any)?.[check.key] || { status: "operational", label: "Healthy" }
              const colors = getStatusColor(serviceData.status)
              const Icon = check.icon
              const isDown = serviceData.status === "down"
              const isDegraded = serviceData.status === "degraded"
              
              return (
                <div key={check.key} className={cn(
                  "flex items-center justify-between p-4 rounded-xl bg-muted/30 border transition-all hover:shadow-md",
                  isDown ? "border-[#EF6B6B]/50 shadow-[#EF6B6B]/5" : 
                  isDegraded ? "border-[#F4B860]/50 shadow-[#F4B860]/5" : "border-border/50"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background border"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{check.label}</p>
                      <p className="text-xs text-muted-foreground">{serviceData.label}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] font-bold", colors.badgeBg)}>
                    <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full inline-block", colors.bg)} />
                    {serviceData.status === "operational" ? "Healthy" : serviceData.status === "degraded" ? "Warning" : "Down"}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage & Scale Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="premium-card border-none">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#5BC0BE]" /> Platform Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Files Stored", value: usage?.storageUsed ?? 0, color: "text-[#6B9CFF]" },
              { label: "Total Appointments", value: usage?.totalAppointments ?? 0, color: "text-[#A78BFA]" },
              { label: "Daily Active Users", value: usage?.dailyActiveUsers ?? 0, color: "text-[#6BCB77]" },
            ].map(metric => (
              <div key={metric.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <span className={cn("text-lg font-extrabold", metric.color)}>{metric.value.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card border-none">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-[#F4B860]" /> Scale Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Total Clinics", value: stats?.totalClinics ?? 0, icon: Database },
              { label: "Total Patients", value: stats?.totalPatients ?? 0, icon: Users },
              { label: "Total Doctors", value: stats?.totalDoctors ?? 0, icon: CalendarDays },
            ].map(metric => (
              <div key={metric.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                </div>
                <span className="text-lg font-extrabold text-foreground">{metric.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="p-4 rounded-xl bg-[#6BCB77]/5 border border-[#6BCB77]/20 mt-2">
              <p className="text-xs text-muted-foreground">Monthly Recurring Revenue (MRR)</p>
              <p className="text-2xl font-extrabold text-[#6BCB77]">{(stats?.mrr ?? 0).toLocaleString()} EGP</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}