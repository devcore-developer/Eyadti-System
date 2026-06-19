import { getClinicDetails } from "@/lib/actions/admin"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Users, Calendar, FileText, Activity, MapPin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// ✅ تم تغيير نوع params إلى Promise
export default async function ClinicDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ يجب عمل await لـ params أولاً
  const { id } = await params
  
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  // ✅ استخدام الـ id بعد استخراجه
  const clinic = await getClinicDetails(id)

  if (!clinic) return notFound()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">{clinic.name}</h2>
            <Badge variant="outline">{clinic.subscription?.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Member since {new Date(clinic.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Patients" value={clinic._count.patients} icon={Users} />
        <StatCard title="Total Appointments" value={clinic._count.appointments} icon={Calendar} />
        <StatCard title="Total Users" value={clinic._count.users} icon={Activity} /> 
        <StatCard title="Total Invoices" value={clinic._count.invoices} icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Branches</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clinic.branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {branch.city}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(clinic as any).recentInvoices?.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <span>#{inv.invoiceNumber || inv.id.slice(0,8)}</span>
                    <span className="font-medium">{String(inv.amount || inv.total)} USD</span>
                    <Badge variant={inv.status === 'PAID' ? 'default' : 'secondary'}>{inv.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Subscription Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Current Plan</p>
                <p className="text-2xl font-bold">Active Plan</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge>{clinic.subscription?.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Expires</p>
                <p className="text-sm text-muted-foreground">
                  {clinic.subscription?.endDate 
                    ? formatDistanceToNow(new Date(clinic.subscription.endDate), { addSuffix: true }) 
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}