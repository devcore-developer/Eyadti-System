"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Server, Database, HardDrive, Bell, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ServiceStatus {
  id: string
  name: string
  icon: any
  status: "operational" | "degraded" | "down"
  latency: number
  uptime: number // percentage 0-100
  history: boolean[] // last 90 days (true = up, false = down)
}

const initialServices: ServiceStatus[] = [
  { id: "api", name: "API Gateway", icon: Server, status: "operational", latency: 24, uptime: 99.9, history: Array(90).fill(true).map((_, i) => Math.random() > 0.02) },
  { id: "db", name: "PostgreSQL Database", icon: Database, status: "operational", latency: 12, uptime: 99.99, history: Array(90).fill(true) },
  { id: "storage", name: "File Storage (S3)", icon: HardDrive, status: "degraded", latency: 150, uptime: 98.5, history: Array(90).fill(true).map((_, i) => i > 85 ? Math.random() > 0.5 : true) },
  { id: "queue", name: "Background Workers", icon: Clock, status: "operational", latency: 50, uptime: 100, history: Array(90).fill(true) },
  { id: "notifications", name: "Notification Service", icon: Bell, status: "operational", latency: 30, uptime: 99.8, history: Array(90).fill(true).map((_, i) => Math.random() > 0.05) },
]

export default function SystemHealthPage() {
  const [services, setServices] = useState(initialServices)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prev => prev.map(s => ({
        ...s,
        latency: Math.floor(Math.random() * (s.status === 'degraded' ? 200 : 40)) + (s.status === 'degraded' ? 100 : 10)
      })))
      setLastUpdate(new Date())
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const hasIssues = services.some(s => s.status !== "operational")

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Status</h2>
          <p className="text-muted-foreground mt-1">Real-time infrastructure monitoring and uptime.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-lg px-3 py-2 font-mono">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Overall Status Banner */}
      <Card className={cn(
        "border transition-colors",
        hasIssues ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5"
      )}>
        <CardContent className="flex items-center gap-4 p-6">
          <div className={cn("p-3 rounded-full", hasIssues ? "bg-amber-500" : "bg-emerald-500")}>
            {hasIssues ? <AlertTriangle className="h-6 w-6 text-white" /> : <CheckCircle className="h-6 w-6 text-white" />}
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {hasIssues ? "Experiencing Minor Issues" : "All Systems Operational"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasIssues ? "We are investigating increased latency in File Storage." : "No incidents or maintenance currently scheduled."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 90-Day Uptime Grid (Vercel Style) */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Uptime (Last 90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {services.map(service => {
              const Icon = service.icon
              return (
                <div key={service.id} className="flex items-center gap-4">
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{service.name}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-[2px]">
                    {service.history.map((isUp, idx) => (
                      <div 
                        key={idx} 
                        title={`Day ${90 - idx}: ${isUp ? 'Operational' : 'Down'}`}
                        className={cn(
                          "h-6 flex-1 rounded-[2px] transition-colors",
                          isUp ? "bg-emerald-500/70 hover:bg-emerald-500" : "bg-rose-500/70 hover:bg-rose-500"
                        )}
                      />
                    ))}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-mono w-16 justify-center",
                    service.uptime === 100 ? "border-emerald-500/30 text-emerald-600" : "border-amber-500/30 text-amber-600"
                  )}>
                    {service.uptime}%
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Service Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map(service => {
          const Icon = service.icon
          return (
            <Card key={service.id} className={cn(
              "border-border/50 transition-all hover:shadow-md",
              service.status === 'degraded' && "border-amber-500/50 shadow-amber-500/5"
            )}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  {service.status === "operational" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  {service.status === "degraded" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {service.status === "down" && <XCircle className="h-4 w-4 text-rose-500" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-mono font-medium">{service.latency}ms</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      service.latency < 50 ? "bg-emerald-500" : service.latency < 200 ? "bg-amber-500" : "bg-rose-500"
                    )}
                    style={{ width: `${Math.min((service.latency / 300) * 100, 100)}%` }}
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