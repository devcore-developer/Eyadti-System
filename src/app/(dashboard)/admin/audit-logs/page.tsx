import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AuditLogsClient } from "./audit-logs-client"
import { getPlatformAuditLogs } from "@/lib/actions/super-admin"

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage() {
  const session = await auth()
  
  if (!session?.user) redirect("/login")

  // لو سوبر ادمن يجيب كل اللوجس، لو لا هيبقى فيه action تاني للكلينك (في حالة لو لقيتها فاضية خليها كده)
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const logs = isSuperAdmin ? await getPlatformAuditLogs() : []

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground mt-1">
          {isSuperAdmin ? "Track all platform actions, support logins, and system changes." : "Track actions within your clinic."}
        </p>
      </div>

      {isSuperAdmin ? (
        <AuditLogsClient initialLogs={logs} />
      ) : (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
          Audit logs for clinic admins will be loaded here.
        </div>
      )}
    </div>
  )
}