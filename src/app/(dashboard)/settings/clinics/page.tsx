// src/app/(dashboard)/settings/clinics/page.tsx

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getClinicSettings, getWorkingHours, getClinicDoctors } from "@/lib/actions/settings"
import { ClinicSettingsForm } from "@/components/settings/clinic-settings-form"
import { ClinicLogoUpload } from "@/components/settings/clinic-logo-upload"
import { WorkingHoursForm } from "@/components/settings/working-hours-form"
import { DoctorScheduleForm } from "@/components/settings/doctor-schedule-form"
import { Settings, ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ClinicSettingsPage() {
  const session = await auth()
  if (!session?.user?.clinicId) redirect("/login")

  const clinicId = session.user.clinicId
  
  // ✅ أضفنا SUPER_ADMIN لللستة عشان يقدر يعدل
  const isReadOnly = !["ADMIN", "CLINIC_OWNER", "SUPER_ADMIN"].includes(session.user.role)

  const [settings, workingHours, doctors] = await Promise.all([
    getClinicSettings(clinicId),
    getWorkingHours(clinicId),
    getClinicDoctors(clinicId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Settings className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clinic Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your clinic identity, schedule, and preferences
            </p>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="flex items-center gap-2 p-3 text-sm border border-yellow-300 bg-yellow-50 text-yellow-800 rounded-lg">
          <ShieldAlert className="h-4 w-4" />
          You have view-only access. Contact your admin to make changes.
        </div>
      )}

      <div className="grid gap-6">
        <ClinicLogoUpload clinicId={clinicId} logoUrl={settings?.logoUrl || null} isReadOnly={isReadOnly} />
        
        <ClinicSettingsForm clinicId={clinicId} settings={settings} isReadOnly={isReadOnly} />

        <WorkingHoursForm clinicId={clinicId} initialData={workingHours as any} isReadOnly={isReadOnly} />

        <DoctorScheduleForm doctors={doctors as any} isReadOnly={isReadOnly} />
      </div>
    </div>
  )
}