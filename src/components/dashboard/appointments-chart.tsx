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

interface AppointmentsChartProps {
  data: { name: string; appointments: number }[]
}

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  return (
    <ChartCard
      title="Appointments Overview"
      subtitle="Monthly appointments for the last 12 months"
    >
      <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#89D6D2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#89D6D2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107,156,255,0.08)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.96)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(10px)",
                borderRadius: "16px",
                boxShadow: "0 15px 35px rgba(100,116,139,0.15)",
                padding: "12px 16px",
              }}
              labelStyle={{ fontWeight: 600, color: "#0F172A", marginBottom: "4px", fontSize: "13px" }}
              itemStyle={{ color: "#89D6D2", fontWeight: 700, fontSize: "14px" }}
              cursor={{ stroke: '#89D6D2', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Area
              type="monotone"
              dataKey="appointments"
              stroke="#89D6D2"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAppointments)"
              dot={false}
              activeDot={{ r: 6, fill: "#89D6D2", stroke: "#fff", strokeWidth: 3, filter: 'drop-shadow(0px 2px 4px rgba(137,214,210,0.4))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}