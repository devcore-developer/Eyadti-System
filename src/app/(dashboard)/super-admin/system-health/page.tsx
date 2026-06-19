"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Database, Server, Zap, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface HealthMetric {
  service: string
  status: "operational" | "degraded" | "down"
  latency: number
  uptime: string
}

export default function SystemHealthPage() {
  const [checks, setChecks] = useState<HealthMetric[]>([
    { service: "API Gateway", status: "operational", latency: 24, uptime: "99.9%" },
    { service: "Primary Database", status: "operational", latency: 12, uptime: "99.99%" },
    { service: "Redis Cache", status: "operational", latency: 2, uptime: "99.9%" },
    { service: "Image Storage", status: "degraded", latency: 450, uptime: "98.5%" },
    { service: "Notification Queue", status: "operational", latency: 50, uptime: "100%" },
    { service: "Websocket Server", status: "operational", latency: 30, uptime: "100%" },
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
    }, 5000) // تحديث كل 5 ثواني

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle className="h-5 w-5" />
      case "degraded": return <AlertTriangle className="h-5 w-5" />
      case "down": return <XCircle className="h-5 w-5" />
      default: return <div className="h-5 w-5" />
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground mt-1">Real-time monitoring of platform infrastructure.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background border rounded-md px-3 py-1.5">
          <Activity className="h-3.5 w-3.5" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Overall Status Banner */}
      <Card className="border-emerald-500/20 bg-emerald-500/5 mb-6">
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {checks.map((check, idx) => (
          <Card key={idx} className={cn("border-border/50 transition-colors", check.status === 'degraded' && "border-amber-500/50")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{check.service}</CardTitle>
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                <span className={cn("text-xs font-medium", getStatusColor(check.status))}>
                  {check.status.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="text-sm font-medium font-mono">{check.latency}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime (90d)</span>
                <span className="text-sm font-medium">{check.uptime}</span>
              </div>
              {/* Latency Visualization Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-in-out"
                  style={{ width: `${Math.min(check.latency, 100)}%`, backgroundColor: check.status === 'degraded' ? 'orange' : 'currentColor' }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}