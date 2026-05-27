// src/app/(dashboard)/admin/audit-logs/page.tsx

import { getAuditLogs, getAuditUsers } from "@/lib/actions/audit";
import { AuditLogsClient } from "./audit-logs-client";

export const metadata = {
  title: "Audit Logs | Eyadti Admin",
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  
  const filters = {
    search: params.search || "",
    action: (params.action as any) || "",
    entityType: (params.entityType as any) || "",
    userId: params.userId || "",
    dateFrom: params.dateFrom || "",
    dateTo: params.dateTo || "",
    page: parseInt(params.page || "1"),
    perPage: 20,
  };

  const [logsData, users] = await Promise.all([
    getAuditLogs(filters),
    getAuditUsers(),
  ]);

  return (
    <AuditLogsClient
      initialLogs={logsData.logs}
      initialPagination={logsData.pagination}
      users={users}
      initialFilters={filters}
    />
  );
}