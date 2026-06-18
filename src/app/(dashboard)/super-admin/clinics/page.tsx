import { getAllClinics } from "@/lib/actions/admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClinicTable } from "@/components/admin/clinic-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ClinicsManagementPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const clinics = await getAllClinics()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clinics Management</h2>
          <p className="text-muted-foreground mt-1">Manage all registered clinics on the platform.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clinics ({clinics.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ClinicTable initialData={clinics} />
        </CardContent>
      </Card>
    </div>
  )
}