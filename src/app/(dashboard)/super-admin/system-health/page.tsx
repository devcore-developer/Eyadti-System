import { getRealSystemHealth } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Server, Bell, CreditCard, CheckCircle, AlertTriangle, HardDrive, Clock, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

const serviceIcons: Record<string, any> = {
  api: Server,
  db: Database,
  storage: HardDrive,
  jobs: Clock
}

const serviceNames: Record<string, string> = {
  api: "API & Session Server",
  db: "PostgreSQL Database",
  storage: "File Storage",
  jobs: "Background Jobs & Invoices"
}

export default async function SystemHealthPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const health = await getRealSystemHealth()

  if (!health) return <div className="p-8 text-center text-muted-foreground">Failed to load health metrics.</div>

  const hasIssues = Object.values(health).some(s => s.status !== "operational")
  const hasCritical = Object.values(health).some(s => s.status === "down")

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
        <p className="text-muted-foreground mt-1">Live infrastructure metrics based on platform data.</p>
      </div>

      {/* Overall Status */}
      <Card className={cn(
        "border",
        hasCritical ? "border-rose-500/30 bg-rose-500/5" : 
        hasIssues ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5"
      )}>
        <CardContent className="flex items-center gap-4 p-6">
          <div className={cn(
            "p-3 rounded-full", 
            hasCritical ? "bg-rose-500" : hasIssues ? "bg-amber-500" : "bg-emerald-500"
          )}>
            {hasCritical ? <XCircle className="h-6 w-6 text-white" /> : hasIssues ? <AlertTriangle className="h-6 w-6 text-white" /> : <CheckCircle className="h-6 w-6 text-white" />}
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {hasCritical ? "Critical Issues Detected" : hasIssues ? "Minor Issues Detected" : "All Systems Operational"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasCritical ? "A service is down or responding very slowly!" : hasIssues ? "Some services are experiencing higher than usual loads." : "Platform is running smoothly with no critical errors."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(health).map(([key, service]) => {
          const Icon = serviceIcons[key] || Server
          const isDown = service.status === "down"
          const isDegraded = service.status === "degraded"
          return (
            <Card key={key} className={cn(
              "border-border/50 transition-all hover:shadow-md",
              isDown && "border-rose-500/50 shadow-rose-500/5",
              isDegraded && "border-amber-500/50 shadow-amber-500/5"
            )}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{serviceNames[key] || key}</CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  {service.status === "operational" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  {isDegraded && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {isDown && <XCircle className="h-4 w-4 text-rose-500" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{service.load}</span>
                  <Badge variant="outline" className={cn(
                    "text-xs font-mono",
                    service.status === "operational" && "border-emerald-500/30 text-emerald-600",
                    isDegraded && "border-amber-500/30 text-amber-600",
                    isDown && "border-rose-500/30 bg-rose-500/10 text-rose-600 font-semibold animate-pulse"
                  )}>
                    {service.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{service.label}</p>
                
                {/* Health Bar */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-3">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      service.status === "operational" ? "bg-emerald-500 w-1/4" : 
                      isDegraded ? "bg-amber-500 w-3/4" : "bg-rose-500 w-full"
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}