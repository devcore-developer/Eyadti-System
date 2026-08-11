// src/components/billing/usage-progress.tsx - استبدل بالكامل

import { UsageStat } from "@/types/subscription";
import {
  Stethoscope,
  Users,
  UserCheck,
  Building2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Stethoscope,
  Users,
  UserCheck,
  Building2,
  Activity,
};

interface UsageProgressProps {
  stat: UsageStat;
  compact?: boolean;
}

export function UsageProgress({ stat, compact = false }: UsageProgressProps) {
  const Icon = ICON_MAP[stat.icon] || Users;
  const isUnlimited = stat.limit === null;
  const percentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((stat.current / stat.limit!) * 100));
  
  // ═══════════════════════════════════════════════════════════
  // ✅ FIX: منطق الحالات المعدّل
  // - Near Limit: 80% أو أكثر ولكن أقل من الحد
  // - Limit Reached: يساوي الحد بالضبط
  // - Exceeded: تجاوز الحد (حالة غير طبيعية)
  // ═══════════════════════════════════════════════════════════
  const isExceeded = !isUnlimited && stat.current > stat.limit!;
  const isAtLimit = !isUnlimited && !isExceeded && stat.current >= stat.limit!;
  const isNearLimit = !isUnlimited && !isAtLimit && !isExceeded && percentage >= 80;

  const barColor = isExceeded
    ? "bg-red-700"
    : isAtLimit
    ? "bg-red-500"
    : isNearLimit
    ? "bg-amber-500"
    : "bg-indigo-500";

  const textColor = isExceeded
    ? "text-red-700"
    : isAtLimit
    ? "text-red-600"
    : isNearLimit
    ? "text-amber-600"
    : "text-gray-700";

  const getStatusLabel = (): string | null => {
    if (isExceeded) return "Exceeded";
    if (isAtLimit) return "Limit Reached";
    if (isNearLimit) return "Near Limit";
    return null;
  }

  const statusLabel = getStatusLabel();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg",
            isExceeded 
              ? "bg-red-200" 
              : isAtLimit 
              ? "bg-red-100" 
              : isNearLimit 
              ? "bg-amber-100" 
              : "bg-indigo-100"
          )}
        >
          <Icon
            className={cn(
              "w-4.5 h-4.5",
              isExceeded
                ? "text-red-700"
                : isAtLimit
                ? "text-red-600"
                : isNearLimit
                ? "text-amber-600"
                : "text-indigo-600"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {stat.label}
            </span>
            <span className={cn("text-sm font-semibold", textColor)}>
              {stat.current}
              {isUnlimited ? "" : ` / ${stat.limit}`}
            </span>
          </div>
          {!isUnlimited && (
            <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          )}
          {isUnlimited && (
            <p className="mt-0.5 text-xs text-gray-400">Unlimited</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            isExceeded
              ? "bg-red-200"
              : isAtLimit
              ? "bg-red-100"
              : isNearLimit
              ? "bg-amber-100"
              : "bg-indigo-100"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isExceeded
                ? "text-red-700"
                : isAtLimit
                ? "text-red-600"
                : isNearLimit
                ? "text-amber-600"
                : "text-indigo-600"
            )}
          />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{stat.label}</h4>
          <p className={cn("text-2xl font-bold", textColor)}>
            {stat.current}
            <span className="text-sm font-medium text-gray-400 ml-1">
              {isUnlimited ? "Unlimited" : `of ${stat.limit}`}
            </span>
          </p>
        </div>
        {statusLabel && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              isExceeded
                ? "text-red-700 bg-red-200 border border-red-300"
                : isAtLimit
                ? "text-red-600 bg-red-50"
                : "text-amber-600 bg-amber-50"
            )}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {!isUnlimited && (
        <div className="space-y-1.5">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                barColor
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{percentage}% used</span>
            <span>
              {isExceeded 
                ? `${stat.current - stat.limit!} over limit`
                : `${stat.limit! - stat.current} remaining`
              }
            </span>
          </div>
        </div>
      )}

      {isUnlimited && (
        <div className="h-2 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full" />
      )}
    </div>
  );
}