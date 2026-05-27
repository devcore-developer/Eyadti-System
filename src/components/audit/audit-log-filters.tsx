// src/components/audit/audit-log-filters.tsx

"use client";

import { AuditLogFilters as FilterTypes, AuditAction, EntityType, ACTION_COLORS, ENTITY_LABELS } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface AuditLogFiltersProps {
  filters: FilterTypes;
  onFilterChange: (filters: FilterTypes) => void;
  users: { id: string; name: string }[];
}

export function AuditLogFilters({ filters, onFilterChange, users }: AuditLogFiltersProps) {
  const updateFilter = (key: keyof FilterTypes, value: string) => {
    onFilterChange({ ...filters, [key]: value, page: 1 });
  };

  const resetFilters = () => {
    onFilterChange({
      search: "",
      action: "",
      entityType: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
      perPage: 20,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">Search</Label>
          <Input
            placeholder="Search by ID, user name..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* Action */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">Action</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.action || ""}
            onChange={(e) => updateFilter("action", e.target.value)}
          >
            <option value="">All Actions</option>
            {Object.keys(ACTION_COLORS).map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

        {/* Entity Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">Entity Type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.entityType || ""}
            onChange={(e) => updateFilter("entityType", e.target.value)}
          >
            <option value="">All Entities</option>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* User */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">User</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.userId || ""}
            onChange={(e) => updateFilter("userId", e.target.value)}
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date From */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">Date From</Label>
          <Input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">Date To</Label>
          <Input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={resetFilters} className="w-full">
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}