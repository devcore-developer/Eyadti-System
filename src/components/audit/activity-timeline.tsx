// src/components/audit/activity-timeline.tsx

import { AuditLogEntry, ACTION_COLORS, ENTITY_LABELS } from "@/types/audit";
import { format } from "date-fns";
import {
  User,
  Calendar,
  FileText,
  Pill,
  Receipt,
  Settings,
  Shield,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";

const ENTITY_ICONS: Record<string, React.ElementType> = {
  PATIENT: User,
  APPOINTMENT: Calendar,
  VISIT: FileText,
  PRESCRIPTION: Pill,
  INVOICE: Receipt,
  CLINIC_SETTINGS: Settings,
  USER: Shield,
  SUBSCRIPTION: CreditCard,
};

interface ActivityTimelineProps {
  logs: AuditLogEntry[];
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No activity recorded.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {logs.map((log, index) => {
        const Icon = ENTITY_ICONS[log.entityType] || FileText;
        const colorClass = ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] || "bg-gray-100 text-gray-800";

        return (
          <div key={log.id} className="relative flex gap-x-4 pb-6 last:pb-0">
            {/* Line */}
            {index !== logs.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
            )}

            {/* Icon */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 z-10">
              <Icon className="h-4 w-4 text-gray-500" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                  {log.action}
                </span>
                <span className="text-xs text-gray-500">
                  {ENTITY_LABELS[log.entityType as keyof typeof ENTITY_LABELS] || log.entityType}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">
                {log.user?.name || "System"} performed this action
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}