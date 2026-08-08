"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Activity, Users, BarChart3 } from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { formatCurrency } from "@/lib/utils/date-filters"

interface AnalyticsChartsProps {
  data?: { name: string; revenue: number; appointments: number; patients: number }[]
  userRole?: string
}

const CustomTooltip = ({ active, payload, label, isCurrency = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1E2D3D] px-3 py-2 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
        <p className="text-[11px] font-medium text-muted-foreground mb-1">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} className="text-[13px] font-semibold tabular-nums" style={{ color: pld.color }}>
            {isCurrency ? formatCurrency(pld.value) : pld.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function ChartEmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
      <BarChart3 className="h-7 w-7 text-muted-foreground/25" />
      <p className="text-[13px] font-medium text-muted-foreground/50">No {title.toLowerCase()} data</p>
    </div>
  )
}

export function AnalyticsCharts({ data = [], userRole }: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => { setMounted(true) }, [])

  const isEmpty = data.length > 0 && data.every(d => d.revenue === 0 && d.appointments === 0 && d.patients === 0)

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[240px] rounded-2xl bg-gray-50 dark:bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    )
  }

  // ── Role-based chart filtering ───────────────────────
  const isDoctor = userRole === "DOCTOR"
  const isReception = userRole === "RECEPTIONIST"
  const hideRevenue = isDoctor || isReception
  const hideOperationalCharts = isDoctor

  const allChartsConfig = [
    { title: "Revenue Trend", icon: TrendingUp, color: "#6B9CFF", dataKey: "revenue", isCurrency: true, isEmpty, hidden: hideRevenue },
    { title: "Patient Growth", icon: Users, color: "#5BC0BE", dataKey: "patients", isCurrency: false, isEmpty, hidden: hideOperationalCharts },
    { title: "Appointments Activity", icon: Activity, color: "#89D6D2", dataKey: "appointments", isCurrency: false, isEmpty, hidden: hideOperationalCharts },
  ]

  const chartsConfig = allChartsConfig.filter(c => !c.hidden)

  if (chartsConfig.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-5">
      {chartsConfig.map((chart, index) => (
        <div key={chart.title} className="rounded-2xl border border-gray-100 dark:border-white/[0.04] bg-white dark:bg-[#223247] px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-[8px]" style={{ backgroundColor: `${chart.color}0A` }}>
              <chart.icon className="h-3.5 w-3.5" style={{ color: chart.color }} />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground">{chart.title}</h3>
          </div>
          
          <div className="h-[220px] w-full">
            {chart.isEmpty ? (
              <ChartEmptyState title={chart.title} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`g-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.color} stopOpacity={0.12}/>
                      <stop offset="100%" stopColor={chart.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.06)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8' }} 
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8' }} 
                    width={40}
                  />
                  <Tooltip 
                    content={<CustomTooltip isCurrency={chart.isCurrency} />} 
                    cursor={{ stroke: chart.color, strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.4 }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={chart.dataKey as any} 
                    stroke={chart.color} 
                    strokeWidth={2} 
                    fill={`url(#g-${index})`} 
                    dot={false}
                    activeDot={{ r: 4, fill: chart.color, stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}