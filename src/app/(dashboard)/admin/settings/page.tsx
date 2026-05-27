// src/app/(dashboard)/admin/settings/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { ClinicForm } from "@/components/admin/clinic-form"

export default async function ClinicSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { name: true, phone: true, address: true },
  })

  if (!clinic) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clinic Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your clinic details and information.
        </p>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <ClinicForm clinic={clinic} />
      </div>
    </div>
  )
}