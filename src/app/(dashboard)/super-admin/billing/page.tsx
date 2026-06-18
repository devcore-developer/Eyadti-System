import { getPlatformBillingData } from "@/lib/actions/admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, AlertCircle, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function PlatformBillingPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const data = await getPlatformBillingData()

  if (!data) return <div>Failed to load billing data.</div>

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Financials</h2>
        <p className="text-muted-foreground mt-1">Overview of revenue, subscriptions, and payment health.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Run Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(data.mrr * 12).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Projected revenue</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400">Failed Payments (Mo)</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{data.failedPayments.length}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="h-10 px-4 font-medium">Clinic</th>
                  <th className="h-10 px-4 font-medium">Date</th>
                  <th className="h-10 px-4 font-medium">Amount</th>
                  <th className="h-10 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.failedPayments.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No recent failures.</td></tr>
                ) : (
                  data.failedPayments.map((inv: any) => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-4 font-medium">{inv.clinic?.name || "Unknown"}</td>
                      <td className="p-4 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 font-medium text-rose-600">${inv.total}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">Retry</Badge>
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