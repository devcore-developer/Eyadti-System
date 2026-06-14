// components/dashboard/recent-activity.tsx
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils/date-filters"
import { UserPlus, CalendarCheck, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type RecentActivityProps = {
  patients: { id: string; name: string; createdAt: Date }[]
  appointments: {
    id: string
    dateTime: Date
    status: string
    patientName: string
    doctorName: string
  }[]
  invoices: {
    id: string
    amount: number
    status: string
    createdAt: Date
    patientName: string
  }[]
}

export function RecentActivity({ patients, appointments, invoices }: RecentActivityProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Recent Patients */}
      <Card className="premium-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[rgba(91,192,190,0.1)]">
              <UserPlus className="h-5 w-5 text-[#5BC0BE]" />
            </div>
            <CardTitle>Recent Patients</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {patients.length === 0 ? (
            <EmptyState icon={UserPlus} title="No patients yet" description="New patients will appear here." className="py-4" />
          ) : (
            patients.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[rgba(91,192,190,0.05)] dark:hover:bg-[rgba(91,192,190,0.03)] transition-colors duration-200 cursor-pointer group">
                <Avatar className="h-9 w-9 border border-[#5BC0BE]/20 shadow-sm">
                  <AvatarFallback className="bg-[#5BC0BE]/10 text-[#5BC0BE] text-xs font-semibold">
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-[#5BC0BE] transition-colors">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card className="premium-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[rgba(107,156,255,0.1)]">
              <CalendarCheck className="h-5 w-5 text-[#6B9CFF]" />
            </div>
            <CardTitle>Recent Appointments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No appointments" description="Appointments for today will show up here." className="py-4" />
          ) : (
            appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[rgba(107,156,255,0.05)] dark:hover:bg-[rgba(107,156,255,0.03)] transition-colors duration-200 cursor-pointer group">
                <div className="min-w-0 mr-2">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-[#6B9CFF] transition-colors">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.doctorName} • {format(new Date(a.dateTime), "MMM d")}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] border-[#6B9CFF]/30 text-[#6B9CFF] bg-[#6B9CFF]/5 shrink-0">
                  {a.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="premium-card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[rgba(107,214,123,0.1)]">
              <FileText className="h-5 w-5 text-[#6BCB77]" />
            </div>
            <CardTitle>Recent Invoices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 ? (
            <EmptyState icon={FileText} title="No invoices" description="Recent invoices will be listed here." className="py-4" />
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[rgba(107,214,123,0.05)] dark:hover:bg-[rgba(107,214,123,0.03)] transition-colors duration-200 cursor-pointer group">
                <div className="min-w-0 mr-2">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-[#6BCB77] transition-colors">{inv.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(inv.createdAt), "MMM d")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(inv.amount)}</p>
                  <Badge
                    variant={inv.status === "PAID" ? "default" : "secondary"}
                    className={`text-[10px] ${inv.status === "PAID" ? "bg-[#6BCB77]/10 text-[#6BCB77] hover:bg-[#6BCB77]/20 border-transparent" : ""}`}
                  >
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}