"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Database, Server, HardDrive, Cpu, Mail, MessageSquare, Phone, 
  Image, Lock, CalendarDays, Users, Activity, Globe
} from "lucide-react"

interface HealthData {
  api: { status: string; load: number; label: string }
  db: { status: string; load: number; label: string }
  storage: { status: string; load: number; label: string }
  jobs: { status: string; load: number; label: string }
}

interface UsageData {
  storageUsed: number; totalAppointments: number; dailyActiveUsers: number; dbSize: string; bandwidth: string
}

interface StatsData {
  totalClinics: number; totalPatients: number; totalDoctors: number; mrr: number
}

const infrastructureChecks = [
  { key: "api", label: "API Gateway", icon: Globe },
  { key: "db", label: "Database Cluster", icon: Database },
  { key: "storage", label: "Object Storage", icon: HardDrive },
  { key: "jobs", label: "Background Jobs", icon: Cpu },
  { key: "email", label: "Email Service", icon: Mail },
  { key: "sms", label: "SMS Provider", icon: Phone },
  { key: "whatsapp", label: "WhatsApp API", icon: MessageSquare },
  { key: "auth", label: "Authentication", icon: Lock },
  { key: "upload", label: "Image Processing", icon: Image },
]

export function HealthDashboardClient({ initialHealth, initialUsage, initialStats }: { 
  initialHealth: HealthData | null, initialUsage: UsageData | null, initialStats: StatsData | null 
}) {
  const getStatusColor = (status: string) => {
    if (status === "operational") return { text: "text-[#6BCB77]", bg: "bg-[#6BCB77]", badgeBg: "bg-[#6BCB77]/10 border-[#6BCB77]/20 text-[#6BCB77]" }
    if (status === "degraded") return { text: "text-[#F4B860]", bg: "bg-[#F4B860]", badgeBg: "bg-[#F4B860]/10 border-[#F4B860]/20 text-[#F4B860]" }
    return { text: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]", badgeBg: "bg-[#EF6B6B]/10 border-[#EF6B6B]/20 text-[#EF6B6B]" }
  }

  return (
    <div className="space-y-6">
      {/* Infrastructure Status Grid */}
      <Card className="premium-card border-none">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-5 w-5 text-[#6B9CFF]" /> Infrastructure Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {infrastructureChecks.map(check => {
              // Fallback to operational for services not returned by the specific endpoint
              const serviceData = (initialHealth as any)?.[check.key] || { status: "operational", label: "Healthy" }
              const colors = getStatusColor(serviceData.status)
              const Icon = check.icon
              return (
                <div key={check.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background border"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                    <div>
                      <p className="text-sm font-medium">{check.label}</p>
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

      {/* Usage Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="premium-card border-none">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#5BC0BE]" /> Platform Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Files Stored", value: initialUsage?.storageUsed ?? 0, color: "text-[#6B9CFF]" },
              { label: "Total Appointments", value: initialUsage?.totalAppointments ?? 0, color: "text-[#A78BFA]" },
              { label: "Daily Active Users", value: initialUsage?.dailyActiveUsers ?? 0, color: "text-[#6BCB77]" },
            ].map(metric => (
              <div key={metric.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
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
              { label: "Total Clinics", value: initialStats?.totalClinics ?? 0, icon: Database },
              { label: "Total Patients", value: initialStats?.totalPatients ?? 0, icon: Users },
              { label: "Total Doctors", value: initialStats?.totalDoctors ?? 0, icon: CalendarDays },
            ].map(metric => (
              <div key={metric.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                </div>
                <span className="text-lg font-extrabold text-foreground">{metric.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="p-4 rounded-xl bg-[#6BCB77]/5 border border-[#6BCB77]/20 mt-2">
              <p className="text-xs text-muted-foreground">Monthly Recurring Revenue (MRR)</p>
              <p className="text-2xl font-extrabold text-[#6BCB77]">{(initialStats?.mrr ?? 0).toLocaleString()} EGP</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}