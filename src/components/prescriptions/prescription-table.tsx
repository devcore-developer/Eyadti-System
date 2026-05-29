import Link from "next/link"
import { Pill } from "lucide-react"

type PrescriptionRow = {
  id: string
  createdAt: Date | string
  doctor: { id: string; name: string }
  _count: { items: number }
}

type Props = {
  prescriptions: PrescriptionRow[]
  patientId: string
}

function formatDate(date: Date | string): string {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "—"
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d)
  } catch { return "—" }
}

export function PrescriptionTable({ prescriptions, patientId }: Props) {
  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Pill className="mb-3 h-12 w-12 opacity-20" />
        <p className="text-sm">No prescriptions recorded yet.</p>
        <Link href={`/patients/${patientId}/prescriptions/new`} className="mt-2 text-sm font-medium text-primary hover:text-primary/80">
          Create first prescription →
        </Link>
      </div>
    )
  }

  return (
    // ← استخدمنا gap-3 عشان يكون زيه زي الـ MobileCards
    <div className="grid grid-cols-1 gap-3">
      {prescriptions.map((rx) => (
        <Link
          key={rx.id}
          href={`/patients/${patientId}/prescriptions/${rx.id}`}
          className="group flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1D2A3B] p-4 transition-all hover:shadow-md active:scale-[0.98] md:active:scale-100"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Dr. {rx.doctor.name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(rx.createdAt)}</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
            {rx._count.items} Med{rx._count.items !== 1 ? "s" : ""}
          </span>
        </Link>
      ))}
    </div>
  )
}