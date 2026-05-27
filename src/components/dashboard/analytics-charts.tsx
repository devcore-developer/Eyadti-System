"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Activity, Users } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from "@/lib/utils/date-filters"

interface AnalyticsChartsProps {
  data?: { 
    name: string; 
    revenue: number; 
    appointments: number; 
    patients: number; 
  }[]
}

const CustomTooltip = ({ active, payload, label, isCurrency = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="premium-card p-3 border dark:bg-[#223247] dark:border-[rgba(255,255,255,0.06)]">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} className="text-sm font-semibold" style={{ color: pld.color }}>
            {isCurrency ? formatCurrency(pld.value) : pld.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function AnalyticsCharts({ data = [] }: AnalyticsChartsProps) {
  // 1. حل مشكلة الـ Width/Height: منع الرسم إلا بعد ما الصفحة تتحمل في الـ Browser
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-8">
        {[1,2,3].map((i) => (
          <div key={i} className="p-8 rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-muted/30 animate-pulse h-[400px]" />
        ))}
      </div>
    )
  }

  const chartsConfig = [
    { title: "Revenue Trend", icon: TrendingUp, color: "#6B9CFF", dataKey: "revenue", isCurrency: true },
    { title: "Patient Growth", icon: Users, color: "#5BC0BE", dataKey: "patients", isCurrency: false },
    { title: "Appointments Activity", icon: Activity, color: "#89D6D2", dataKey: "appointments", isCurrency: false }
  ]

  return (
    <div className="grid grid-cols-1 gap-8">
      {chartsConfig.map((chart, index) => (
        <div 
          key={index}
          className="p-8 rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] shadow-[0_15px_35px_rgba(100,116,139,0.10)] animate-fade"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: `${chart.color}15` }}>
                <chart.icon className="h-5 w-5" style={{ color: chart.color }} />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{chart.title}</h3>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chart.color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chart.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip content={<CustomTooltip isCurrency={chart.isCurrency} />} cursor={{ stroke: chart.color, strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area type="monotone" dataKey={chart.dataKey} stroke={chart.color} strokeWidth={3} fill={`url(#gradient-${index})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  )
}