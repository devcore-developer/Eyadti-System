// src/components/billing/usage-progress.tsx

import { UsageStat } from "@/types/subscription";
import {
  Stethoscope,
  Users,
  UserCheck,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Stethoscope,
  Users,
  UserCheck,
  Building2,
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
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && stat.current >= stat.limit!;

  const barColor = isAtLimit
    ? "bg-red-500"
    : isNearLimit
    ? "bg-amber-500"
    : "bg-indigo-500";

  const textColor = isAtLimit
    ? "text-red-600"
    : isNearLimit
    ? "text-amber-600"
    : "text-gray-700";

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg",
            isAtLimit ? "bg-red-100" : isNearLimit ? "bg-amber-100" : "bg-indigo-100"
          )}
        >
          <Icon
            className={cn(
              "w-4.5 h-4.5",
              isAtLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-indigo-600"
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
                style={{ width: `${percentage}%` }}
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
            isAtLimit ? "bg-red-100" : isNearLimit ? "bg-amber-100" : "bg-indigo-100"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isAtLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-indigo-600"
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
        {isAtLimit && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
            Limit Reached
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
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{percentage}% used</span>
            <span>
              {stat.limit! - stat.current} remaining
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