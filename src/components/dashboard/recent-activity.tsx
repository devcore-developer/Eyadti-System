import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils/date-filters"
import { UserPlus, CalendarCheck, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

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
    <div className="grid gap-5 md:grid-cols-3">
      {/* Recent Patients */}
      <Card className="bg-white dark:bg-[#223247] border-gray-200/60 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <CardHeader className="pb-4 pt-5 px-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#5BC0BE]/[0.08]">
              <UserPlus className="h-4 w-4 text-[#5BC0BE]" />
            </div>
            <CardTitle className="text-sm font-semibold">Recent Patients</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          {patients.length === 0 ? (
            <EmptyState icon={UserPlus} title="No patients yet" description="New patients will appear here." className="py-6" />
          ) : (
            <div className="space-y-0.5">
              {patients.map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#5BC0BE]/[0.04] dark:hover:bg-[#5BC0BE]/[0.03] transition-colors duration-150 cursor-pointer group"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#5BC0BE]/[0.1] text-[#5BC0BE] text-[11px] font-semibold">
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-[#5BC0BE] transition-colors">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(p.createdAt), "MMM d")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card className="bg-white dark:bg-[#223247] border-gray-200/60 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <CardHeader className="pb-4 pt-5 px-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6B9CFF]/[0.08]">
              <CalendarCheck className="h-4 w-4 text-[#6B9CFF]" />
            </div>
            <CardTitle className="text-sm font-semibold">Recent Appointments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          {appointments.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No appointments" description="Appointments will show up here." className="py-6" />
          ) : (
            <div className="space-y-0.5">
              {appointments.map((a) => (
                <Link
                  key={a.id}
                  href={`/appointments/${a.id}`}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-[#6B9CFF]/[0.04] dark:hover:bg-[#6B9CFF]/[0.03] transition-colors duration-150 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-[#6B9CFF] transition-colors">{a.patientName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.doctorName} · {format(new Date(a.dateTime), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md border-[#6B9CFF]/20 text-[#6B9CFF] bg-[#6B9CFF]/[0.05] shrink-0"
                  >
                    {a.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="bg-white dark:bg-[#223247] border-gray-200/60 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <CardHeader className="pb-4 pt-5 px-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6BCB77]/[0.08]">
              <FileText className="h-4 w-4 text-[#6BCB77]" />
            </div>
            <CardTitle className="text-sm font-semibold">Recent Invoices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          {invoices.length === 0 ? (
            <EmptyState icon={FileText} title="No invoices" description="Recent invoices will be listed here." className="py-6" />
          ) : (
            <div className="space-y-0.5">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-[#6BCB77]/[0.04] dark:hover:bg-[#6BCB77]/[0.03] transition-colors duration-150 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-[#6BCB77] transition-colors">{inv.patientName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(inv.createdAt), "MMM d")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(inv.amount)}</p>
                    <Badge
                      variant={inv.status === "PAID" ? "default" : "secondary"}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${inv.status === "PAID" ? "bg-[#6BCB77]/[0.1] text-[#6BCB77] hover:bg-[#6BCB77]/[0.15] border-transparent" : ""}`}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}