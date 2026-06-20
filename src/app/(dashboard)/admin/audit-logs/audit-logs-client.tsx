"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ShieldAlert, UserCircle, Building2, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface Log {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string | null
  clinicId: string | null
  createdAt: Date
  user: { name: string; email: string } | null
  clinic: { name: string } | null
}

// ✅ قائمة أنواع الحدث المتاحة للفيلتر
const ACTION_FILTERS = [
  { value: "ALL", label: "All Actions" },
  { value: "SUPPORT_MODE", label: "Support Mode" },
  { value: "TOGGLE_FEATURE_ON", label: "Feature Flag ON" },
  { value: "TOGGLE_FEATURE_OFF", label: "Feature Flag OFF" },
  { value: "DELETE", label: "Deletes" },
]

export function AuditLogsClient({ initialLogs }: { initialLogs: Log[] }) {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  // ✅ تم تعديل هذا السطر (إضافة علامة =)
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({ from: "", to: "" })

  const filteredLogs = initialLogs.filter(log => {
    const searchStr = `${log.action} ${log.user?.name} ${log.clinic?.name} ${log.entityType}`.toLowerCase()
    const matchesSearch = searchStr.includes(search.toLowerCase())
    const matchesAction = actionFilter === "ALL" || log.action.includes(actionFilter)
    return matchesSearch && matchesAction
  })

  const getActionColor = (action: string) => {
    if (action.includes("SUPPORT_MODE")) return "border-amber-500/30 text-amber-600 bg-amber-500/10"
    if (action.includes("DELETE")) return "border-rose-500/30 text-rose-600 bg-rose-500/10"
    if (action.includes("FEATURE")) return "border-blue-500/30 text-blue-600 bg-blue-500/10"
    return "border-border/50 text-muted-foreground bg-muted/20"
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        {/* ✅ شريط الفلاترة */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 bg-muted/20 p-4 rounded-lg border border-border/50">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search actions, users, clinics..." className="pl-10 w-full" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              className="h-9 rounded-md border border-border/50 bg-background px-3 text-sm"
              value={actionFilter} 
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {ACTION_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-nowrap">From:</span>
            <input 
              type="date" 
              className="h-9 rounded-md border border-border/50 bg-background px-3 text-sm"
              value={dateFilter.from} 
              onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
            />
            <span className="text-xs text-muted-nowrap">To:</span>
            <input 
              type="date" 
              className="h-9 rounded-md border border-border/50 bg-background px-3 text-sm"
              value={dateFilter.to} 
              onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              No logs found for this filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-background hover:bg-muted/20 transition-colors">
                <div className="mt-1 p-2 bg-muted rounded-md h-9 w-9 flex items-center justify-center shrink-0">
                  {log.action.includes("SUPPORT") ? <ShieldAlert className="h-4 w-4 text-amber-500" /> : <UserCircle className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{log.user?.name || 'System'}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-mono", getActionColor(log.action))}>
                      {log.action}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {log.clinic && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {log.clinic.name}
                      </span>
                    )}
                    <span>•</span>
                    <span>Type: {log.entityType}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 text-left">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}