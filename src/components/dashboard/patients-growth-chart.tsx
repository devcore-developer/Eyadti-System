// components/dashboard/patients-growth-chart.tsx
"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartCard } from "./chart-card"

interface PatientsGrowthChartProps {
  data: { name: string; patients: number }[]
}

export function PatientsGrowthChart({ data }: PatientsGrowthChartProps) {
  return (
    <ChartCard
      title="New Patients Growth"
      subtitle="Monthly new registrations"
    >
      <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5BC0BE" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#5BC0BE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107,156,255,0.08)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                backdropFilter: "blur(10px)",
                borderRadius: "16px",
                boxShadow: "0 15px 35px rgba(100,116,139,0.15)",
                padding: "12px 16px",
                color: "hsl(var(--foreground))"
              }}
              labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: "4px", fontSize: "13px" }}
              itemStyle={{ color: "#5BC0BE", fontWeight: 700, fontSize: "14px" }}
              cursor={{ stroke: '#5BC0BE', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Area
              type="monotone"
              dataKey="patients"
              stroke="#5BC0BE"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPatients)"
              dot={false}
              activeDot={{ r: 6, fill: "#5BC0BE", stroke: "hsl(var(--card))", strokeWidth: 3, filter: 'drop-shadow(0px 2px 4px rgba(91,192,190,0.4))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}