"use client"

import { useState, useEffect } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from "@/lib/utils/date-filters"

interface InvoiceAnalyticsProps {
  data?: { name: string; revenue: number; collections: number; outstanding: number; invoices: number }[]
}

const CustomTooltip = ({ active, payload, label, dataKey }: any) => {
  if (active && payload && payload.length) {
    const isCurrency = dataKey === 'revenue' || dataKey === 'collections' || dataKey === 'outstanding'
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

export function InvoiceAnalytics({ data = [] }: InvoiceAnalyticsProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-[400px] bg-muted/30 rounded-[24px] animate-pulse" />

  const chartsConfig = [
    { title: "Revenue Trend", dataKey: "revenue", color: "#6B9CFF" },
    { title: "Collections Trend", dataKey: "collections", color: "#5BC0BE" },
    { title: "Outstanding Trend", dataKey: "outstanding", color: "#F4B860" },
    { title: "Invoices Growth", dataKey: "invoices", color: "#89D6D2" }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {chartsConfig.map((chart, index) => (
        <div key={index} className="p-6 rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/96 to-[#F0F8FF]/96 dark:from-[#223247] dark:to-[#1D2A3B] shadow-[0_15px_35px_rgba(100,116,139,0.10)] animate-fade">
          <h3 className="text-lg font-semibold text-foreground mb-6">{chart.title}</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-inv-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chart.color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chart.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip content={<CustomTooltip dataKey={chart.dataKey} />} cursor={{ stroke: chart.color, strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area type="monotone" dataKey={chart.dataKey} stroke={chart.color} strokeWidth={3} fill={`url(#grad-inv-${index})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  )
}