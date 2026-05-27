"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuditLogEntry, AuditLogPagination, AuditLogFilters } from "@/types/audit";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { AuditLogFilters as FiltersComponent } from "@/components/audit/audit-log-filters";
import { AuditLogDetails } from "@/components/audit/audit-log-details";
import { Shield } from "lucide-react";

interface AuditLogsClientProps {
  initialLogs: AuditLogEntry[];
  initialPagination: AuditLogPagination;
  users: { id: string; name: string }[];
  initialFilters: AuditLogFilters;
}

export function AuditLogsClient({
  initialLogs,
  initialPagination,
  users,
  initialFilters,
}: AuditLogsClientProps) {
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFilterChange = (newFilters: AuditLogFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.action) params.set("action", newFilters.action);
    if (newFilters.entityType) params.set("entityType", newFilters.entityType);
    if (newFilters.userId) params.set("userId", newFilters.userId);
    if (newFilters.dateFrom) params.set("dateFrom", newFilters.dateFrom);
    if (newFilters.dateTo) params.set("dateTo", newFilters.dateTo);
    if (newFilters.page) params.set("page", newFilters.page.toString());

    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    handleFilterChange({ ...initialFilters, page });
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500">Track all activities and changes in the system</p>
        </div>
      </div>

      <FiltersComponent
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        users={users}
      />

      <AuditLogTable
        logs={initialLogs}
        pagination={initialPagination}
        onPageChange={handlePageChange}
        onViewDetails={handleViewDetails}
      />

      <AuditLogDetails
        log={selectedLog}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}