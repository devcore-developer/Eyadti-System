import Link from "next/link"
import { formatDate, calculateAge } from "@/lib/utils" // تأكد إن عندك دوال التاريخ
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card" // ← الـ Component الجديد
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Eye, Pencil } from "lucide-react"

interface Patient {
  id: string
  fullName: string
  email: string | null
  phone: string
  dateOfBirth: Date | null
  gender: string | null
  createdAt: Date
}

interface PatientTableProps {
  patients: Patient[]
  role: string
  currentPage: number
  totalPages: number
  searchParams: Record<string, string>
}

export function PatientTable({ patients, role, currentPage, totalPages, searchParams }: PatientTableProps) {
  
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(pageNum))
    return `?${params.toString()}`
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-white dark:bg-[#1D2A3B] rounded-xl border">
        No patients found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      
      {/* ━━━━━━ 1. DESKTOP TABLE (Hidden on Mobile) ━━━━━━ */}
      <div className="hidden md:block rounded-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1D2A3B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-[#223247]/50 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Age/Gender</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-[#223247]/30 transition-colors">
                  <td className="p-4 font-medium">{patient.fullName}</td>
                  <td className="p-4 text-muted-foreground">{patient.phone}</td>
                  <td className="p-4 text-muted-foreground">{patient.email || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {patient.dateOfBirth && <span className="text-xs text-muted-foreground">{calculateAge(patient.dateOfBirth)}y</span>}
                      <Badge variant="outline" className="text-[10px] capitalize">{patient.gender?.toLowerCase()}</Badge>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/patients/${patient.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {role === "SUPER_ADMIN" || session.user.role === "ADMIN" && (
                        <Link href={`/patients/edit/${patient.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ━━━━━━ 2. MOBILE CARDS (Hidden on Desktop) ━━━━━━ */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {patients.map((patient) => (
          <Link key={patient.id} href={`/patients/${patient.id}`} className="block">
            <MobileCard>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm text-foreground">{patient.fullName}</h3>
                <Badge variant="outline" className="text-[10px] capitalize">{patient.gender?.toLowerCase()}</Badge>
              </div>
              <MobileCardItem label="Phone" value={patient.phone} />
              {patient.email && <MobileCardItem label="Email" value={patient.email} />}
              {patient.dateOfBirth && <MobileCardItem label="Age" value={`${calculateAge(patient.dateOfBirth)} years`} />}
            </MobileCard>
          </Link>
        ))}
      </div>

      {/* ━━━━━━ 3. PAGINATION ━━━━━━ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Link href={buildPageUrl(currentPage - 1)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Link href={buildPageUrl(currentPage + 1)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
            <Button variant="outline" size="icon" disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}