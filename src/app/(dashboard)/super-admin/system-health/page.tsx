"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Database, Server, Zap, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HealthCheck {
  service: string
  status: "operational" | "degraded" | "down"
  latency: number
  uptime: string
}

export default function SystemHealthPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { service: "API Gateway", status: "operational", latency: 24, uptime: "99.9%" },
    { service: "Primary Database", status: "operational", latency: 12, uptime: "99.99%" },
    { service: "Redis Cache", status: "operational", latency: 2, uptime: "99.9%" },
    { service: "Image Storage", status: "degraded", latency: 450, uptime: "98.5%" },
    { service: "Notification Queue", status: "operational", latency: 50, uptime: "100%" },
  ])

  const [lastUpdate, setLastUpdate] = useState(new Date())

  // محاكاة التحقق الحي (Live Updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setChecks(prev => prev.map(check => ({
        ...check,
        latency: Math.floor(Math.random() * (check.status === 'degraded' ? 500 : 50))
      })))
      setLastUpdate(new Date())
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
      case "degraded": return "text-amber-600 bg-amber-500/10 border-amber-500/20"
      case "down": return "text-rose-600 bg-rose-500/10 border-rose-500/20"
      default: return "text-muted-foreground"
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground mt-1">Real-time monitoring of platform services.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Overall Status Banner */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-full">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-100">All Systems Operational</h3>
              <p className="text-sm text-emerald-700/70 dark:text-emerald-200/70">We are currently experiencing no major outages.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {checks.map((check, idx) => (
          <Card key={idx} className={check.status === 'degraded' ? "border-amber-500/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {check.service === "Primary Database" && <Database className="h-4 w-4" />}
                {check.service === "API Gateway" && <Server className="h-4 w-4" />}
                {check.service === "Redis Cache" && <Zap className="h-4 w-4" />}
                {check.service}
              </CardTitle>
              <Badge variant="outline" className={getStatusColor(check.status)}>
                {check.status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono font-medium">{check.latency}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uptime (90d)</span>
                <span className="font-medium">{check.uptime}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}