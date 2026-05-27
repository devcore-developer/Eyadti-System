import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils/date-filters"
import { UserPlus, CalendarCheck, FileText } from "lucide-react"

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

// Premium Card Class for Phase 22B
const premiumCardClass = "p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_12px_30px_rgba(100,116,139,0.10)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(100,116,139,0.15)]"

export function RecentActivity({ patients, appointments, invoices }: RecentActivityProps) {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {/* Recent Patients */}
      <div className={premiumCardClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[rgba(91,192,190,0.1)]">
            <UserPlus className="h-5 w-5 text-[#5BC0BE]" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Recent Patients</h3>
        </div>
        <div className="space-y-4">
          {patients.length === 0 ? (
            <EmptyState icon={UserPlus} title="No patients yet" description="New patients will appear here once registered." />
          ) : (
            patients.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[rgba(91,192,190,0.05)] transition-colors duration-200 cursor-pointer">
                <Avatar className="h-9 w-9 border border-[#5BC0BE]/20">
                  <AvatarFallback className="bg-[#5BC0BE]/10 text-[#5BC0BE] text-xs font-semibold">
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Appointments */}
      <div className={premiumCardClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[rgba(107,156,255,0.1)]">
            <CalendarCheck className="h-5 w-5 text-[#6B9CFF]" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Recent Appointments</h3>
        </div>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No appointments" description="Appointments for today will show up here." />
          ) : (
            appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[rgba(107,156,255,0.05)] transition-colors duration-200 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.doctorName} • {format(new Date(a.dateTime), "MMM d")}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] border-[#6B9CFF]/30 text-[#6B9CFF] bg-[#6B9CFF]/5">
                  {a.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className={premiumCardClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[rgba(107,214,123,0.1)]">
            <FileText className="h-5 w-5 text-[#6BCB77]" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Recent Invoices</h3>
        </div>
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <EmptyState icon={FileText} title="No invoices" description="Recent invoices will be listed here." />
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[rgba(107,214,123,0.05)] transition-colors duration-200 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(inv.createdAt), "MMM d")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(inv.amount)}</p>
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
        </div>
      </div>
    </div>
  )
}