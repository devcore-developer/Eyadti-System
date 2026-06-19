"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Activity, AlertTriangle, ArrowUpRight, CreditCard } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BillingData {
  mrr: number
  arr: number
  activeSubsCount: number
  failedPayments: any[]
  chartData: { month: string, revenue: number }[]
}

export function BillingClient({ data }: { data: BillingData }) {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financials</h2>
          <p className="text-muted-foreground mt-1">Revenue metrics, subscriptions, and payment health.</p>
        </div>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => alert("Exporting...")}>
          <CreditCard className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">{data.mrr.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">EGP</span></div>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3" /> 12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Run Rate (ARR)</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">{data.arr.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">EGP</span></div>
            <p className="text-xs text-muted-foreground mt-2">Projected yearly revenue</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">{data.activeSubsCount}</div>
            <p className="text-xs text-muted-foreground mt-2">Clinics paying for plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Revenue Over Time</CardTitle>
          <Badge variant="secondary" className="font-normal text-xs">Last 6 Months</Badge>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" name="Revenue (EGP)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Failed Payments */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Failed Transactions</CardTitle>
            {data.failedPayments.length > 0 && (
              <Badge variant="outline" className="border-rose-500/30 text-rose-600 bg-rose-500/10 text-xs">
                {data.failedPayments.length} Issues
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.failedPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
              🎉 All payments are healthy!
            </div>
          ) : (
            <div className="relative w-full overflow-auto rounded-lg border border-border/50">
              <table className="w-full text-sm text-left">
                <thead className="[&_tr]:border-b bg-muted/30">
                  <tr className="border-b">
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Clinic</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.failedPayments.map((inv) => (
                    <tr key={inv.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-4 font-medium">{inv.clinic?.name || "Unknown"}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold text-rose-600">{Number(inv.amount).toLocaleString()} EGP</td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}