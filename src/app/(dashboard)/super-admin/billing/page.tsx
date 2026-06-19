import { getPlatformBillingData } from "@/lib/actions/admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, CreditCard, Activity, AlertTriangle } from "lucide-react"

export default async function PlatformBillingPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const data = await getPlatformBillingData()

  if (!data) return <div>Failed to load billing data.</div>

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Financials</h2>
          <p className="text-muted-foreground mt-1">Overview of revenue, subscriptions, and payment health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <CreditCard className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.mrr.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-muted-foreground">Active Clinics</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Failed Payments (Mo)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">{data.failedPayments.length}</div>
            <p className="text-xs text-rose-800/70 dark:text-rose-200/70">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Clinic</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.failedPayments.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No failed payments.</td></tr>
                ) : (
                  data.failedPayments.map((inv: any) => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-4 font-medium">{inv.clinic?.name || "Unknown"}</td>
                      <td className="p-4 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 font-medium text-rose-600">{inv.amount} USD</td>
                      <td className="p-4">
                        <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200">
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}