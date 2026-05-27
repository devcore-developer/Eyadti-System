import Link from "next/link"
import { PatientDeleteButton } from "./patient-delete-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { Users } from "lucide-react"

type PatientRow = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  dateOfBirth: Date | string | null
  gender: string | null
  createdAt: Date | string
}

type Props = {
  patients: PatientRow[]
  role: string
  currentPage: number
  totalPages: number
  searchParams: Record<string, string>
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "—"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d)
  } catch {
    return "—"
  }
}

function genderLabel(g: string | null): string {
  if (!g) return "—"
  return g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Other"
}

function buildPageUrl(page: number, searchParams: Record<string, string>): string {
  const params = new URLSearchParams(searchParams)
  params.set("page", String(page))
  return `/patients?${params.toString()}`
}

export function PatientTable({
  patients,
  role,
  currentPage,
  totalPages,
  searchParams,
}: Props) {
  if (patients.length === 0) {
    return (
      <div className="p-12 rounded-[24px] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
        <EmptyState icon={Users} title="No patients found" description="Try adjusting your search or add a new patient." />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)] animate-fade"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,248,255,0.96))' }}
    >
      {/* Dark mode override */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#223247] to-[#1D2A3B] hidden dark:block opacity-95 -z-10" />

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)]">
              {["Patient", "Phone", "Email", "Date of Birth", "Gender"].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr 
                key={patient.id} 
                className="group border-b border-[rgba(148,163,184,0.05)] dark:border-[rgba(255,255,255,0.03)] hover:bg-[rgba(107,156,255,0.04)] dark:hover:bg-[rgba(107,156,255,0.06)] transition-colors duration-200 cursor-pointer"
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-[#5BC0BE]/20">
                      <AvatarFallback className="bg-[#5BC0BE]/10 text-[#5BC0BE] text-xs font-semibold">
                        {patient.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Link href={`/patients/${patient.id}`} className="text-sm font-semibold text-foreground hover:text-[#6B9CFF] transition-colors">
                      {patient.fullName}
                    </Link>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{patient.phone || "—"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{patient.email || "—"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{formatDate(patient.dateOfBirth)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{genderLabel(patient.gender)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/patients/${patient.id}`} className="text-xs font-semibold text-[#6B9CFF] hover:underline">
                      View
                    </Link>
                    {(role === "ADMIN" || role === "DOCTOR") && (
                      <Link href={`/patients/edit/${patient.id}`} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        Edit
                      </Link>
                    )}
                    {role === "ADMIN" && (
                      <PatientDeleteButton patientId={patient.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Premium Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{currentPage}</span> of {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={buildPageUrl(currentPage - 1, searchParams)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={buildPageUrl(currentPage + 1, searchParams)} className="rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}