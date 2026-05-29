"use client";

import { AuditLogEntry, AuditLogPagination, ACTION_COLORS, ENTITY_LABELS } from "@/types/audit";
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  pagination: AuditLogPagination;
  onPageChange: (page: number) => void;
  onViewDetails: (log: AuditLogEntry) => void;
}

export function AuditLogTable({ logs, pagination, onPageChange, onViewDetails }: AuditLogTableProps) {
  if (logs.length === 0) {
    return <div className="py-12 text-center text-gray-500">No audit logs found.</div>;
  }

  return (
    <div className="space-y-4">
      
      {/* ━━━ DESKTOP TABLE ━━━ */}
      <div className="hidden md:block rounded-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1D2A3B] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 dark:bg-[#223247]/50 border-b border-[rgba(148,163,184,0.1)]">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Action</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Entity</th>
              <th className="text-left p-4 font-medium text-muted-foreground">User</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-[#223247]/30 transition-colors">
                <td className="p-4 text-muted-foreground whitespace-nowrap">{format(new Date(log.createdAt), "MMM d, h:mm a")}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100"}`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-4">{ENTITY_LABELS[log.entityType] || log.entityType}</td>
                <td className="p-4 text-muted-foreground">{log.user?.name || "System"}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetails(log)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ━━━ MOBILE CARDS ━━━ */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {logs.map((log) => (
          <MobileCard key={log.id}>
            <div className="flex justify-between items-start mb-2">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100"}`}>
                {log.action}
              </span>
              <span className="text-[10px] text-muted-foreground">{format(new Date(log.createdAt), "MMM d, h:mm a")}</span>
            </div>
            <MobileCardItem label="Entity" value={ENTITY_LABELS[log.entityType] || log.entityType} />
            <MobileCardItem label="User" value={log.user?.name || "System"} />
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onViewDetails(log)}>
                <Eye className="w-3 h-3" /> View
              </Button>
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="icon" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{pagination.page} / {pagination.totalPages}</span>
          <Button variant="outline" size="icon" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}