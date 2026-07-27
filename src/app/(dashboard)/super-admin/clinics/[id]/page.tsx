import { getClinicDetails, impersonateClinic, getClinicHistory } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ClinicLifecycleActions } from "@/components/super-admin/clinic-lifecycle-actions"
import { 
  Building2, Users, Calendar, FileText, Activity, MapPin, ArrowLeft, 
  ShieldCheck, UserCircle, Clock, CreditCard, History
} from "lucide-react"
import { formatDistanceToNow, format, differenceInDays } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default async function ClinicDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const [clinic, history] = await Promise.all([
    getClinicDetails(id),
    getClinicHistory(id)
  ])

  if (!clinic) return notFound()

  const subStatus = clinic.subscription?.status || "INACTIVE"
  const daysLeft = clinic.subscription?.endDate ? differenceInDays(new Date(clinic.subscription.endDate), new Date()) : null

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/super-admin/clinics" className="p-2 rounded-md hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">{clinic.name}</h2>
            <Badge variant="outline" className={cn(
              "capitalize text-xs font-bold",
              subStatus === 'ACTIVE' && "border-[#6BCB77]/30 text-[#6BCB77] bg-[#6BCB77]/10",
              subStatus === 'TRIAL' && "border-[#6B9CFF]/30 text-[#6B9CFF] bg-[#6B9CFF]/10",
              subStatus === 'EXPIRED' && "border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/10",
              subStatus === 'SUSPENDED' && "border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/10"
            )}>
              {subStatus}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Owned by <span className="font-medium text-foreground">{clinic.owner?.name || 'Unknown'}</span> • Joined {format(new Date(clinic.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        
        <div className="flex gap-2 ml-12 md:ml-0">
          <form action={async () => {
            "use server"
            await impersonateClinic(id)
            redirect("/super-admin")
          }}>
            <Button type="submit" variant="outline" size="sm" className="border-[#F4B860]/30 text-[#F4B860] hover:bg-[#F4B860]/10">
              <ShieldCheck className="mr-2 h-4 w-4" /> Support Mode
            </Button>
          </form>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Patients", value: clinic._count.patients, icon: Users, color: "text-[#6B9CFF] bg-[#6B9CFF]/10" },
          { title: "Appointments", value: clinic._count.appointments, icon: Calendar, color: "text-[#A78BFA] bg-[#A78BFA]/10" },
          { title: "Team Members", value: clinic._count.users, icon: Activity, color: "text-[#6BCB77] bg-[#6BCB77]/10" },
          { title: "Invoices", value: clinic._count.invoices, icon: FileText, color: "text-[#F4B860] bg-[#F4B860]/10" },
        ].map((kpi) => (
          <Card key={kpi.title} className="premium-card border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", kpi.color)}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-foreground">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Lifecycle Management Card */}
          <Card className="premium-card border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#6B9CFF]" />
                Subscription & Lifecycle Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClinicLifecycleActions 
                clinicId={id}
                clinicName={clinic.name}
                currentSubStatus={subStatus}
                planName={clinic.subscription?.plan?.name || "None"}
                endDate={clinic.subscription?.endDate ?? null}
                daysLeft={daysLeft}
              />
            </CardContent>
          </Card>

          {/* Branches */}
          <Card className="premium-card border-none">
            <CardHeader>
              <CardTitle className="text-base">Branches ({clinic.branches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {clinic.branches.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {clinic.branches.map((branch) => (
                    <div key={branch.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="p-2 bg-background rounded-lg border border-border/50 h-9 w-9 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {branch.city || 'No city'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-6">No branches.</p>}
            </CardContent>
          </Card>

          {/* Team Users */}
          <Card className="premium-card border-none">
            <CardHeader><CardTitle className="text-base">Team Members</CardTitle></CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead className="[&_tr]:border-b"><tr className="border-b"><th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground">User</th><th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground">Role</th></tr></thead>
                  <tbody>
                    {clinic.users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/20">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><UserCircle className="h-4 w-4 text-muted-foreground" /></div>
                            <div><p className="font-medium text-sm">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                          </div>
                        </td>
                        <td className="p-4"><Badge variant="secondary" className="text-xs capitalize">{user.role.toLowerCase()}</Badge></td>
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
          <Card className="premium-card border-none">
            <CardHeader><CardTitle className="text-base">Subscription Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl bg-[#6B9CFF]/5 border border-[#6B9CFF]/10">
                <p className="text-xs text-muted-foreground">Current Plan</p>
                <p className="text-lg font-extrabold text-foreground mt-1">{clinic.subscription?.plan?.name || 'No Plan'}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium">{clinic.subscription?.startDate ? format(new Date(clinic.subscription.startDate), "MMM d, yyyy") : "N/A"}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="text-sm font-medium">{clinic.subscription?.endDate ? format(new Date(clinic.subscription.endDate), "MMM d, yyyy") : "N/A"}</p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <Badge variant="outline" className={cn(
                  "font-bold",
                  daysLeft !== null && daysLeft > 5 && "border-[#6BCB77]/30 text-[#6BCB77] bg-[#6BCB77]/10",
                  daysLeft !== null && daysLeft <= 5 && daysLeft > 0 && "border-[#F4B860]/30 text-[#F4B860] bg-[#F4B860]/10",
                  (daysLeft === null || daysLeft < 0) && "border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/10"
                )}>
                  {daysLeft !== null && daysLeft > 0 ? `${daysLeft} Days` : "Expired/N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices / Payments */}
          <Card className="premium-card border-none">
            <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clinic.recentInvoices.length > 0 ? clinic.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-xs font-medium">#{inv.invoiceNumber || inv.id.slice(0,8)}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(inv.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{Number(inv.amount).toLocaleString()} EGP</p>
                      <Badge variant={inv.status === 'PAID' ? 'default' : 'secondary'} className={`text-[10px] mt-1 ${inv.status === 'PAID' ? 'bg-[#6BCB77]/10 text-[#6BCB77] hover:bg-[#6BCB77]/20' : ''}`}>
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground text-center py-4">No payments yet.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Plan History / Audit */}
          <Card className="premium-card border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-[#A78BFA]" /> History Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-auto">
                {history.length > 0 ? history.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs">
                    <div className="mt-1 h-2 w-2 rounded-full bg-[#A78BFA] shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-muted-foreground">{log.user?.name || 'System'} • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground text-center py-4">No history recorded.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}