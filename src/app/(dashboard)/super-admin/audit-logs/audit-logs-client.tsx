"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Log {
  id: string; action: string; entityType: string; entityId: string; createdAt: Date
  user: { id: string; name: string; email: string } | null
  clinic: { id: string; name: string } | null
}

export function SuperAuditLogsClient({ initialLogs }: { initialLogs: Log[] }) {
  const [search, setSearch] = useState("")
  const [entityFilter, setEntityFilter] = useState("ALL")

  const filteredLogs = initialLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || 
                          log.user?.name.toLowerCase().includes(search.toLowerCase()) ||
                          log.clinic?.name.toLowerCase().includes(search.toLowerCase())
    const matchesEntity = entityFilter === "ALL" || log.entityType === entityFilter
    return matchesSearch && matchesEntity
  })

  const getActionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("SUSPEND")) return "text-[#EF6B6B] bg-[#EF6B6B]/10"
    if (action.includes("CREATE") || action.includes("ACTIVATE") || action.includes("RENEW")) return "text-[#6BCB77] bg-[#6BCB77]/10"
    if (action.includes("SUPPORT")) return "text-[#F4B860] bg-[#F4B860]/10"
    return "text-[#6B9CFF] bg-[#6B9CFF]/10"
  }

  return (
    <Card className="premium-card border-none">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search actions, users, clinics..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {["ALL", "CLINIC", "SUBSCRIPTION", "USER", "SUPPORT_SESSION"].map(e => (
              <Button key={e} variant={entityFilter === e ? "default" : "outline"} size="sm" className="text-xs h-9" onClick={() => setEntityFilter(e)}>
                {e === "ALL" ? "All Entities" : e.charAt(0) + e.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="h-11 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                <th className="h-11 px-4 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="h-11 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Clinic</th>
                <th className="h-11 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                <th className="h-11 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Entity</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="p-4 text-xs text-muted-foreground font-mono w-[140px]">
                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium">{log.user?.name || 'System'}</p>
                    <p className="text-xs text-muted-foreground">{log.user?.email || ''}</p>
                  </td>
                  <td className="p-4 text-sm">{log.clinic?.name || 'Platform'}</td>
                  <td className="p-4">
                    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold inline-block", getActionColor(log.action))}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{log.entityType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}