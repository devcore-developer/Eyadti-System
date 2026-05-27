// src/components/billing/subscription-badge.tsx

import { SubscriptionStatus } from "@prisma/client";
import {
  SUBSCRIPTION_STATUS_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/constants/features";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Pause, Ban } from "lucide-react";

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
  trialDaysRemaining?: number | null;
  size?: "sm" | "md" | "lg";
}

const STATUS_ICONS: Record<SubscriptionStatus, React.ElementType> = {
  TRIAL: Clock,
  ACTIVE: CheckCircle2,
  EXPIRED: XCircle,
  CANCELLED: Ban,
  SUSPENDED: Pause,
};

export function SubscriptionBadge({
  status,
  trialDaysRemaining,
  size = "md",
}: SubscriptionBadgeProps) {
  const Icon = STATUS_ICONS[status];
  const colorClass = SUBSCRIPTION_STATUS_COLORS[status];
  const label = SUBSCRIPTION_STATUS_LABELS[status];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold border inline-flex items-center gap-1.5",
        colorClass,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      {label}
      {status === "TRIAL" &&
        trialDaysRemaining !== null &&
        trialDaysRemaining !== undefined && (
          <span className="ml-0.5">
            · {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""}{" "}
            left
          </span>
        )}
    </Badge>
  );
}