"use client"

import Link from "next/link"
import { PatientDeleteButton } from "./patient-delete-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Users, Phone, Mail, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d)
  } catch { return "—" }
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

export function PatientTable({ patients, role, currentPage, totalPages, searchParams }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (patients.length === 0) {
    return (
      <div className="p-12 rounded-[24px] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
        <EmptyState icon={Users} title="No patients found" description="Try adjusting your search or add a new patient." />
      </div>
    )
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✨ MOBILE VIEW: Stacked Cards
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!isDesktop) {
    return (
      <div className="space-y-3 animate-fade">
        {patients.map((patient) => (
          <MobileCard key={patient.id}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border border-[#5BC0BE]/20">
                <AvatarFallback className="bg-[#5BC0BE]/10 text-[#5BC0BE] text-xs font-semibold">
                  {patient.fullName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{patient.fullName}</p>
                <p className="text-xs text-muted-foreground">{genderLabel(patient.gender)} • {formatDate(patient.dateOfBirth)}</p>
              </div>
            </div>

            <div className="border-t border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] pt-2 space-y-0.5">
              <MobileCardItem label={<><Phone className="h-3 w-3 mr-1 inline" /> Phone</>} value={patient.phone || "—"} />
              <MobileCardItem label={<><Mail className="h-3 w-3 mr-1 inline" /> Email</>} value={patient.email || "—"} />
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] pt-3">
              <Link href={`/patients/${patient.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full rounded-xl h-9 text-xs font-semibold">
                  View Profile
                </Button>
              </Link>
              {(role === "SUPER_ADMIN" || role === "ADMIN" || role === "DOCTOR") && (
                <Link href={`/patients/edit/${patient.id}`} className="flex-1">
                  <Button variant="ghost" size="sm" className="w-full rounded-xl h-9 text-xs font-semibold">
                    Edit
                  </Button>
                </Link>
              )}
              {(role === "SUPER_ADMIN" || role === "ADMIN") && (
                <PatientDeleteButton patientId={patient.id} />
              )}
            </div>
          </MobileCard>
        ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link href={buildPageUrl(currentPage - 1, searchParams)} className="rounded-xl border px-3 py-1.5 text-xs font-medium">Prev</Link>
              )}
              {currentPage < totalPages && (
                <Link href={buildPageUrl(currentPage + 1, searchParams)} className="rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] px-3 py-1.5 text-xs font-medium text-white">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✨ DESKTOP VIEW: Premium Table
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)] animate-fade"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,248,255,0.96))' }}
    >
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
              <tr key={patient.id} className="group border-b border-[rgba(148,163,184,0.05)] dark:border-[rgba(255,255,255,0.03)] hover:bg-[rgba(107,156,255,0.04)] dark:hover:bg-[rgba(107,156,255,0.06)] transition-colors duration-200 cursor-pointer">
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
                    <Link href={`/patients/${patient.id}`} className="text-xs font-semibold text-[#6B9CFF] hover:underline">View</Link>
                    {(role === "SUPER_ADMIN" || role === "ADMIN" || role === "DOCTOR") && (
                      <Link href={`/patients/edit/${patient.id}`} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Edit</Link>
                    )}
                    {(role === "SUPER_ADMIN" || role === "ADMIN") && (
                      <PatientDeleteButton patientId={patient.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] px-6 py-4">
          <p className="text-sm text-muted-foreground">Page <span className="font-semibold text-foreground">{currentPage}</span> of {totalPages}</p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={buildPageUrl(currentPage - 1, searchParams)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Previous</Link>
            )}
            {currentPage < totalPages && (
              <Link href={buildPageUrl(currentPage + 1, searchParams)} className="rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all">Next</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}