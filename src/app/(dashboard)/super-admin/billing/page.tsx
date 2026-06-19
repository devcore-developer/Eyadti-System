import { getPlatformBillingData } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BillingClient } from "./billing-client"

export default async function PlatformBillingPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const data = await getPlatformBillingData()

  if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load billing data.</div>

  return <BillingClient data={data} />
}