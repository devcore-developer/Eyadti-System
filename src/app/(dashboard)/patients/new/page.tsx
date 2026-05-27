// src/app/(dashboard)/patients/new/page.tsx
import { auth } from "@/lib/auth"
import { canCreatePatient } from "@/lib/permissions/patients"
import { redirect } from "next/navigation"
import { PatientForm } from "@/components/patients/patient-form"

export default async function NewPatientPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!canCreatePatient(session.user.role)) redirect("/patients")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Patient</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new patient to your clinic.
        </p>
      </div>
      <PatientForm />
    </div>
  )
}