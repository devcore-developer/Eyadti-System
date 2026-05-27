import Link from "next/link"
import { Stethoscope, CalendarDays, FileText } from "lucide-react"

type VisitRow = {
  id: string
  visitDate: Date
  notes: string | null
  doctor: { id: string; name: string }
  _count: { complaints: number; diagnoses: number }
}

type Props = {
  visits: VisitRow[]
  patientId: string
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))
}

export function VisitList({ visits, patientId }: Props) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Stethoscope className="mb-3 h-12 w-12 opacity-20" />
        <p className="text-sm">No medical visits recorded yet.</p>
        <Link
          href={`/patients/${patientId}/visits/new`}
          className="mt-4 text-sm font-medium text-primary hover:text-primary/80"
        >
          Record first visit →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visits.map((visit) => (
        <Link
          key={visit.id}
          href={`/patients/${patientId}/visits/${visit.id}`}
          className="group flex items-center justify-between rounded-xl bg-white/50 dark:bg-slate-800/50 p-5 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md border border-transparent hover:border-border"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
              <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Dr. {visit.doctor.name}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> {formatDate(visit.visitDate)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {visit._count.complaints} Complaint{visit._count.complaints !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {visit._count.diagnoses} Diagnosis
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}