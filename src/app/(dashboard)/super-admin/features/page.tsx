import { getAllClinicsWithFlags } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FeaturesClient } from "./features-client"

export default async function FeatureFlagsPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const clinics = await getAllClinicsWithFlags()

  return <FeaturesClient initialClinics={clinics} />
}