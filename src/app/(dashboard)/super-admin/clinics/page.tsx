import { getAllClinicsForTable } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClinicsManagementClient } from "./clinics-client"

export default async function ClinicsManagementPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const clinics = await getAllClinicsForTable()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clinics Management</h2>
          <p className="text-muted-foreground mt-1">Monitor and manage all registered clinics.</p>
        </div>
        <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg border">
          Total: <span className="font-semibold text-foreground">{clinics.length}</span> Clinics
        </div>
      </div>

      <ClinicsManagementClient initialClinics={clinics} />
    </div>
  )
}