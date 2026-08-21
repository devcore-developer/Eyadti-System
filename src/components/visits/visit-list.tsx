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

// ═══ Visit type extraction from notes: "[EXAMINATION] ..." ═══
function extractVisitType(notes: string | null): string | null {
  if (!notes) return null
  const match = notes.match(/^\[([A-Z_]+)\]/)
  return match ? match[1] : null
}

const visitTypeLabels: Record<string, string> = {
  EXAMINATION: "Examination",
  CONSULTATION: "Consultation",
  FOLLOW_UP: "Follow-up",
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
      {visits.map((visit) => {
        const visitType = extractVisitType(visit.notes)

        return (
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
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">Dr. {visit.doctor.name}</p>
                  {visitType && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                      {visitTypeLabels[visitType] || visitType}
                    </span>
                  )}
                </div>
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
        )
      })}
    </div>
  )
}