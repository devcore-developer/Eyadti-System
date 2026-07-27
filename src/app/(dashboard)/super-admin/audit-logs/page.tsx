import { getPlatformAuditLogs } from "@/lib/actions/super-admin"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SuperAuditLogsClient } from "./audit-logs-client"

export default async function SuperAuditLogsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const logs = await getPlatformAuditLogs()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Audit Trail</h2>
          <p className="text-muted-foreground mt-1">Immutable log of all sensitive actions across the platform.</p>
        </div>
        <Button variant="outline" className="border-[#6B9CFF]/30 text-[#6B9CFF] hover:bg-[#6B9CFF]/10">
          Export CSV
        </Button>
      </div>
      <SuperAuditLogsClient initialLogs={logs} />
    </div>
  )
}