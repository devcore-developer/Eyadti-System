// src/components/audit/audit-log-details.tsx

"use client";

import { AuditLogEntry, ACTION_COLORS, ENTITY_LABELS } from "@/types/audit";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

interface AuditLogDetailsProps {
  log: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetails({ log, open, onOpenChange }: AuditLogDetailsProps) {
  if (!log) return null;

  const renderJsonDiff = (data: any) => {
    if (!data) return <p className="text-gray-400 text-sm">No data</p>;
    return (
      <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto max-h-60">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100"}`}>
              {log.action}
            </span>
            {ENTITY_LABELS[log.entityType] || log.entityType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">User</p>
              <p className="font-medium">{log.user?.name || "System"}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">{format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
            <div>
              <p className="text-gray-500">Entity ID</p>
              <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{log.entityId}</p>
            </div>
            <div>
              <p className="text-gray-500">IP Address</p>
              <p className="font-mono text-xs">{log.ipAddress || "N/A"}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Old Values</h4>
            {renderJsonDiff(log.oldValues)}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">New Values</h4>
            {renderJsonDiff(log.newValues)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}