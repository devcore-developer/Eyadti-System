"use client";

import { AuditLogEntry, ACTION_COLORS, ENTITY_LABELS } from "@/types/audit";
import {
  User,
  Calendar,
  FileText,
  Pill,
  Receipt,
  Settings,
  Shield,
  CreditCard,
  Stethoscope,
  AlertTriangle,
  Clock,
} from "lucide-react";

// أيقونات مخصصة لتغطية كل أنواع الكيانات في النظام (بما فيها الطبية)
const ENTITY_ICONS: Record<string, React.ElementType> = {
  PATIENT: User,
  APPOINTMENT: Calendar,
  VISIT: Stethoscope,
  PRESCRIPTION: Pill,
  INVOICE: Receipt,
  CLINIC_SETTINGS: Settings,
  USER: Shield,
  SUBSCRIPTION: CreditCard,
  BRANCH: Settings,
  ALLERGY: AlertTriangle,
  MEDICAL_HISTORY: Stethoscope,
  SURGICAL_HISTORY: Stethoscope,
};

// ألوان متدرجة للأيقونات لتناسب وضع الـ Dark/Light mode في Nexora
const ENTITY_COLOR_MAP: Record<string, { color: string; bg: string }> = {
  PATIENT: { color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/10" },
  APPOINTMENT: { color: "text-[#5BC0BE]", bg: "bg-[#5BC0BE]/10" },
  VISIT: { color: "text-[#5BC0BE]", bg: "bg-[#5BC0BE]/10" },
  PRESCRIPTION: { color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/10" },
  INVOICE: { color: "text-[#6BCB77]", bg: "bg-[#6BCB77]/10" },
  ALLERGY: { color: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]/10" },
  MEDICAL_HISTORY: { color: "text-[#F4B860]", bg: "bg-[#F4B860]/10" },
  SURGICAL_HISTORY: { color: "text-[#89D6D2]", bg: "bg-[#89D6D2]/10" },
  DEFAULT: { color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
};

interface ActivityTimelineProps {
  logs: AuditLogEntry[];
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
          <Clock className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No recent activity recorded</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Actions performed on this patient will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* الخط العمودي الخلفي */}
      <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#6B9CFF]/20 via-[#5BC0BE]/20 to-transparent" />

      <div className="space-y-6">
        {logs.map((log) => {
          const Icon = ENTITY_ICONS[log.entityType] || FileText;
          const colors = ENTITY_COLOR_MAP[log.entityType] || ENTITY_COLOR_MAP.DEFAULT;
          const actionColorClass = ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] || "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200";
          
          const entityLabel = ENTITY_LABELS[log.entityType as keyof typeof ENTITY_LABELS] || log.entityType;

          // تنسيق الوقت بشكل ذكي (اليوم vs تاريخ كامل)
          const dateObj = new Date(log.createdAt);
          const timeString = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
          const dateString = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const isToday = new Date().toDateString() === dateObj.toDateString();
          const displayTime = isToday ? `Today, ${timeString}` : `${dateString}, ${timeString}`;

          // استخراج ملخص ذكي للقيمة الجديدة (إن وُجدت)
          let summaryText = "";
          if (log.newValues && typeof log.newValues === "object") {
            if (log.newValues.status) summaryText = `Status: ${log.newValues.status}`;
            else if (log.newValues.type) summaryText = `Type: ${log.newValues.type}`;
            else if (log.newValues.fullName) summaryText = `Name: ${log.newValues.fullName}`;
          }

          return (
            <div key={log.id} className="relative flex items-start gap-6 group">
              {/* أيقونة الحدث */}
              <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#223247] shadow-[0_8px_20px_rgba(100,116,139,0.08)] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`h-5 w-5 ${colors.color}`} />
              </div>
              
              {/* كارت الحدث */}
              <div className="flex-1 p-5 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.08)] hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${actionColorClass}`}>
                      {log.action}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">
                      {entityLabel}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {displayTime}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {log.user?.name ? `By ${log.user.name}` : 'System Action'}
                  </p>
                  {summaryText && (
                    <span className="text-xs font-medium text-foreground/70 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                      {summaryText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}