import { getClinicDetails } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  MapPin, 
  ArrowLeft, 
  ShieldCheck, 
  UserCircle,
  Clock
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default async function ClinicDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const clinic = await getClinicDetails(id)
  if (!clinic) return notFound()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/super-admin/clinics" className="p-2 rounded-md hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">{clinic.name}</h2>
            <Badge 
              variant="outline"
              className={cn(
                "capitalize",
                clinic.subscription?.status === 'ACTIVE' && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                clinic.subscription?.status === 'TRIAL' && "border-blue-500/30 text-blue-600 bg-blue-500/10",
                clinic.subscription?.status === 'EXPIRED' && "border-rose-500/30 text-rose-600 bg-rose-500/10"
              )}
            >
              {clinic.subscription?.status || 'INACTIVE'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Owned by <span className="font-medium text-foreground">{clinic.owner?.name || 'Unknown'}</span> • Joined {new Date(clinic.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          onClick={() => alert("Support Mode Triggered (Will be fully active in Phase 4)")}
        >
          <ShieldCheck className="mr-2 h-4 w-4" /> Enter Support Mode
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Patients", value: clinic._count.patients, icon: Users, color: "text-blue-600 bg-blue-500/10" },
          { title: "Appointments", value: clinic._count.appointments, icon: Calendar, color: "text-violet-600 bg-violet-500/10" },
          { title: "Team Members", value: clinic._count.users, icon: Activity, color: "text-emerald-600 bg-emerald-500/10" },
          { title: "Invoices", value: clinic._count.invoices, icon: FileText, color: "text-amber-600 bg-amber-500/10" },
        ].map((kpi) => (
          <Card key={kpi.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", kpi.color)}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Branches */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Branches ({clinic.branches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {clinic.branches.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {clinic.branches.map((branch) => (
                    <div key={branch.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                      <div className="p-2 bg-background rounded-md border border-border/50 h-9 w-9 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {branch.city || 'No city set'}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs capitalize">
                        {branch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No branches found.</p>
              )}
            </CardContent>
          </Card>

          {/* Team Users (Non-sensitive) */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Team Members ({clinic.users.length} shown)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinic.users.map((user) => (
                      <tr key={user.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="secondary" className="text-xs capitalize">{user.role.toLowerCase()}</Badge>
                        </td>
                        <td className="p-4 align-middle text-xs text-muted-foreground hidden md:table-cell">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-bold mt-1">{clinic.subscription?.plan?.name || 'No Plan Assigned'}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline" className="capitalize">{clinic.subscription?.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium">
                  {clinic.subscription?.startDate 
                    ? new Date(clinic.subscription.startDate).toLocaleDateString() 
                    : "N/A"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {clinic.subscription?.endDate 
                    ? formatDistanceToNow(new Date(clinic.subscription.endDate), { addSuffix: true }) 
                    : "N/A"}
                </p>
              </div>
              {clinic.subscription?.endDate && new Date(clinic.subscription.endDate) < new Date() && clinic.subscription.status !== "EXPIRED" && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-600 text-xs font-medium">
                  ⚠️ Subscription is past its end date but not marked as expired.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clinic.recentInvoices.length > 0 ? clinic.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-xs">#{inv.invoiceNumber || inv.id.slice(0,8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Number(inv.amount).toLocaleString()} EGP</p>
                      <Badge 
                        variant={inv.status === 'PAID' ? 'default' : 'secondary'} 
                        className="text-[10px] mt-1"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No invoices yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper for cn if not imported globally
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}