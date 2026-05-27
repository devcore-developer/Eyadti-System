// src/app/(dashboard)/patients/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PatientTable } from "@/components/patients/patient-table"
import { PatientSearch } from "@/components/patients/patient-search"
import { PatientHeader } from "@/components/patients/patient-header"
import { PatientKPIs } from "@/components/patients/patient-kpi"
import { PatientFilters } from "@/components/patients/patient-filters"
import { UserPlus } from "lucide-react"
import { Suspense } from "react"

const PAGE_SIZE = 20

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const search = typeof params.search === "string" ? params.search.trim() : ""
  
  // 1. قراءة الفلاتر الجديدة من الـ URL
  const gender = typeof params.gender === "string" ? params.gender.trim() : ""
  const sort = typeof params.sort === "string" ? params.sort.trim() : "desc" // الافتراضي الأحدث

  const where = {
    clinicId: session.user.clinicId,
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    // 2. إضافة فلتر الـ Gender
    ...(gender && { gender: gender as "MALE" | "FEMALE" | "OTHER" }),
  }

  // 3. إضافة الـ Sorting للـ Query
  const orderBy = sort === "asc" ? { createdAt: "asc" as const } : { createdAt: "desc" as const }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy, // تطبيق الـ Sorting
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        createdAt: true,
      },
    }),
    prisma.patient.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const showCreate = session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST"
  
  // 4. حفظ حالة الـ Filters في الـ Links بتاعة الـ Pagination والـ Search
  const serializableParams: Record<string, string> = {}
  if (search) serializableParams.search = search
  if (gender) serializableParams.gender = gender
  if (sort && sort !== "desc") serializableParams.sort = sort // احفظه لو مش الافتراضي
  if (page > 1) serializableParams.page = String(page)

  return (
    <div className="space-y-8 animate-fade">
      {/* Premium Header */}
      <PatientHeader totalPatients={total} />

      {/* Premium KPIs - Using Real DB Data */}
      <PatientKPIs totalPatients={total} />

      {/* Search, Filters & Add Patient Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Suspense fallback={<div className="h-12 w-full max-w-xl bg-muted/50 rounded-2xl animate-pulse" />}>
          <PatientSearch />
        </Suspense>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <PatientFilters />
          {showCreate && (
            <Link
              href="/patients/new"
              className="flex items-center gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 rounded-xl px-5 py-3 text-sm font-semibold ml-auto md:ml-0"
            >
              <UserPlus className="h-4 w-4" /> Add Patient
            </Link>
          )}
        </div>
      </div>

      {/* Premium Table */}
      <PatientTable
        patients={patients}
        role={session.user.role}
        currentPage={page}
        totalPages={totalPages}
        searchParams={serializableParams}
      />
    </div>
  )
}